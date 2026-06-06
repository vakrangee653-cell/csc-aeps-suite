import express from "express";
import path from "path";
import nodemailer from "nodemailer";
import { createServer as createViteServer } from "vite";
import dns from "dns";
import fs from "fs";
import AdmZip from "adm-zip";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Use JSON middleware to parse JSON bodies
  app.use(express.json());

  // API endpoint to download the entire clean workspace source code as a ZIP file
  app.get("/api/download-zip", (req, res) => {
    try {
      const zip = new AdmZip();
      const workspaceRoot = process.cwd();

      function addFilesRecursively(dir: string, zipPathRelative: string = "") {
        const items = fs.readdirSync(dir);
        for (const item of items) {
          const fullPath = path.join(dir, item);
          const zipPath = zipPathRelative ? path.join(zipPathRelative, item) : item;

          // Exclude unnecessary, heavy, or sensitive locations
          if (
            item === "node_modules" ||
            item === ".git" ||
            item === "dist" ||
            item === ".aistudio" ||
            item === ".DS_Store" ||
            item.startsWith(".env") && item !== ".env.example"
          ) {
            continue;
          }

          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            addFilesRecursively(fullPath, zipPath);
          } else {
            zip.addLocalFile(fullPath, zipPathRelative);
          }
        }
      }

      addFilesRecursively(workspaceRoot);

      const buffer = zip.toBuffer();
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", 'attachment; filename="smartspe_source_code.zip"');
      res.send(buffer);
    } catch (error: any) {
      console.error("ZIP Generation Error:", error);
      res.status(500).json({ error: "Failed to generate ZIP", details: error?.message || String(error) });
    }
  });

  // API endpoint to check SMTP status
  app.get("/api/smtp-status", (req, res) => {
    const userDefined = !!process.env.SMTP_USER;
    const passDefined = !!process.env.SMTP_PASS;
    res.json({
      configured: userDefined && passDefined,
      smtpUser: process.env.SMTP_USER ? `${process.env.SMTP_USER.split('@')[0].slice(0, 3)}...@gmail.com` : null,
    });
  });

  // API Endpoint to send real emails via SMTP using Gmail App Passwords
  app.post("/api/send-email", async (req, res) => {
    const { to, subject, body } = req.body;

    if (!to || !subject || !body) {
      res.status(400).json({ error: "Missing required fields (to, subject, body)." });
      return;
    }

    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    // Gracefully handle missing credentials
    if (!smtpUser || !smtpPass) {
      console.warn("⚠️ SMTP credentials (SMTP_USER / SMTP_PASS) are not configured in your .env / Secrets.");
      console.warn(`[Mock Email Sent to ${to}]`);
      console.warn(`Subject: ${subject}`);
      console.warn(`Content: ${body}`);
      
      res.json({
        success: true,
        simulated: true,
        message: "SMS/Email simulated successfully. Configure SMTP_USER and SMTP_PASS in Secrets to send real emails."
      });
      return;
    }

    try {
      // Lazy initialization of transporter
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      });

      const mailOptions = {
        from: `"SmartSpe CSC Suite" <${smtpUser}>`,
        to,
        subject,
        text: body,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff; color: #1f2937;">
            <div style="text-align: center; margin-bottom: 25px; padding-bottom: 15px; border-b: 2px solid #3b82f6;">
              <h2 style="margin: 0; color: #1e3a8a; font-size: 26px;">Smart<span style="color: #06b6d4;">SPE</span></h2>
              <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #6b7280; font-weight: bold;">Secure Access Dispatcher</span>
            </div>
            <div style="font-size: 15px; line-height: 1.6; color: #374151;">
              ${body.replace(/\n/g, '<br />')}
            </div>
            <div style="margin-top: 30px; font-size: 11px; color: #9ca3af; border-top: 1px solid #f3f4f6; pt-15px; text-align: center;">
              This is an automated operational notification regarding your SmartSpe VLE/Staff account setup. Please keep yourcredentials private.
            </div>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log(`✅ Mail dispatched successfully using Gmail App Password to ${to}`);
      res.json({
        success: true,
        simulated: false,
        message: `Verification code successfully dispatched to ${to}`
      });
    } catch (err: any) {
      console.error("❌ Failed to send email via SMTP transporter:", err);
      res.status(500).json({
        error: "SMTP execution failed",
        details: err?.message || String(err)
      });
    }
  });

  // =========================================================================
  // GOOGLE OAUTH 2.0 & SANDBOX LOGIN SERVICE
  // =========================================================================

  // 1. Generate Authorization URL (Interactive popup link generator)
  app.get("/api/auth/google/url", (req, res) => {
    const origin = req.query.origin as string || `${req.protocol}://${req.get("host")}`;
    const redirectUri = `${origin}/api/auth/google/callback`;

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      // If GOOGLE_CLIENT_ID is not configured in client secrets, return high-fidelity sandbox route
      res.json({ 
        sandbox: true, 
        url: `${origin}/api/auth/google/sandbox?origin=${encodeURIComponent(origin)}` 
      });
      return;
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid profile email",
      prompt: "select_account",
      access_type: "offline"
    });

    res.json({ 
      sandbox: false, 
      url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` 
    });
  });

  // 2. Real Google OAuth Redirect handler representing token resolution exchange
  app.get("/api/auth/google/callback", async (req, res) => {
    const { code } = req.query;
    const origin = `${req.protocol}://${req.get("host")}`;
    const redirectUri = `${origin}/api/auth/google/callback`;

    if (!code) {
      res.status(400).send("Authorization grant authentication code is missing.");
      return;
    }

    try {
      // Exchange code for Google ID token
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code: code as string,
          client_id: process.env.GOOGLE_CLIENT_ID || "",
          client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
          redirect_uri: redirectUri,
          grant_type: "authorization_code"
        })
      });

      if (!tokenResponse.ok) {
        const errTxt = await tokenResponse.text();
        throw new Error(`Token exchange failed: ${errTxt}`);
      }

      const tokens = await tokenResponse.json();
      
      // Fetch identity profile
      const userinfoResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${tokens.access_token}` }
      });

      if (!userinfoResponse.ok) {
        throw new Error("Unable to resolve identity profile userinfo from Google service.");
      }

      const profile = await userinfoResponse.json();

      // Return a self-executing closing communication document sending tokens back to parent iframe
      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Identity Secured</title>
          </head>
          <body style="font-family: system-ui, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background-color: #f8fafc; color: #1e293b; margin: 0;">
            <div style="text-align: center; padding: 2rem; border-radius: 1.5rem; background: white; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; max-width: 320px;">
              <div style="width: 38px; height: 38px; border: 3px solid #3b82f6; border-top-color: transparent; border-radius: 50%; animate: spin 0.8s linear infinite; margin: 0 auto 1.25rem auto;"></div>
              <style>
                @keyframes spin { to { transform: rotate(360deg); } }
                div { animation: spin 0.8s linear infinite; }
              </style>
              <h2 style="margin: 0 0 0.5rem 0; font-size: 1.125rem; font-weight: 700;">Google Account Connected</h2>
              <p style="color: #64748b; font-size: 0.825rem; margin: 0; line-height: 1.5;">Securing remote login profile session & transmitting to SmartSpe VLE panel...</p>
            </div>
            <script>
              const userEmail = ${JSON.stringify(profile.email || "")}.toLowerCase();
              const isSuperAdmin = userEmail === "vakrangee653@gmail.com";
              const isAdmin = userEmail === "admin@smartspe.in";
              const userData = {
                id: "google_" + ${JSON.stringify(profile.sub || Date.now().toString())},
                name: ${JSON.stringify(profile.name || "Google User")},
                email: ${JSON.stringify(profile.email)},
                role: (isSuperAdmin || isAdmin) ? "Admin" : "Owner",
                pin: (isSuperAdmin || isAdmin) ? "9999" : "1111",
                mobile: isSuperAdmin ? "+91 84321 63308" : "",
                status: "active",
                picture: ${JSON.stringify(profile.picture || "")}
              };
              if (window.opener) {
                window.opener.postMessage({ type: 'GOOGLE_OAUTH_SUCCESS', user: userData }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
          </body>
        </html>
      `);
    } catch (err: any) {
      console.error("❌ Google OAuth Code Exchange Error:", err);
      res.status(500).send(`
        <html>
          <body style="font-family: system-ui, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background-color: #fef2f2; color: #991b1b; padding: 20px; text-align: center;">
            <h2 style="font-weight: 800; font-size: 1.5rem;">Google Authorization Refused</h2>
            <p style="color: #7f1d1d; max-width: 480px; margin-top: 10px; font-size: 0.875rem;">${err?.message || "Verify your GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET variables in Secrets."}</p>
            <button onclick="window.close()" style="margin-top: 20px; background-color: #ef4444; color: white; border: none; padding: 8px 18px; border-radius: 9999px; font-weight: bold; cursor: pointer;">Close Window</button>
          </body>
        </html>
      `);
    }
  });

  // 3. Google Account Selector Sandbox Page (Interactive Live simulation tool)
  app.get("/api/auth/google/sandbox", (req, res) => {
    const origin = req.query.origin as string || "";
    
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Real Google Login Setup Assistant</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono&display=swap" rel="stylesheet font-sans">
          <style>
            body { font-family: 'Inter', sans-serif; background-color: #f8fafc; }
            .heading-font { font-family: 'Space Grotesk', sans-serif; }
            .code-font { font-family: 'JetBrains Mono', monospace; }
          </style>
        </head>
        <body class="min-h-screen flex items-center justify-center p-4">
          <div class="bg-white rounded-[28px] border border-gray-150 shadow-[0_12px_40px_rgba(0,0,0,0.03)] w-full max-w-[540px] p-8 sm:p-10 relative overflow-hidden flex flex-col justify-between">
            <div>
              {/* Google Header G Logo */}
              <div class="flex items-center justify-between border-b pb-5 mb-6">
                <div class="flex items-center gap-2">
                  <svg class="h-6" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.08H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.92l2.85-2.22.81-.6z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.08l3.66 2.84c.87-2.6 3.3-4.54 6.16-4.54z" />
                  </svg>
                  <span class="text-xs font-black tracking-wide uppercase text-gray-400 heading-font">Identity Config Gateway</span>
                </div>
                <span class="text-[10px] bg-red-100 text-red-700 font-extrabold px-2.5 py-0.5 rounded-full uppercase">Sandbox Disabled</span>
              </div>

              <!-- Setup Titles -->
              <h1 class="text-xl font-bold text-gray-800 leading-tight heading-font">Real Google Sign-In Setup Required</h1>
              <p class="text-xs text-gray-500 mt-1.5 mb-6">सच्चा गूगल लॉगिन सेट अप करने के लिए नीचे दिए गए क्रेडेंशियल्स को AI Studio Secrets में जोड़े।</p>

              <!-- Warning Banner -->
              <div class="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-xs text-amber-900 leading-relaxed font-sans">
                <p class="font-bold mb-1 flex items-center gap-1.5">
                  <span>⚠️</span> Simple Sandbox Logins are Off
                </p>
                <p>आपने सैंडबॉक्स डिफ़ॉल्ट लॉगिन को हटाने का अनुरोध किया है। अब असली Google (Gmail) ऑथेंटिकेशन के साथ लॉगिन करने के लिए आपके पास स्वयं का <strong>Google OAuth 2.0 Credentials</strong> होना अनिवार्य है।</p>
              </div>

              <div class="space-y-4 text-xs">
                <!-- Step 1 -->
                <div class="border-l-2 border-blue-500 pl-3">
                  <div class="font-bold text-gray-800">1. Google Cloud Console पर जाएं</div>
                  <p class="text-[11px] text-gray-500 mt-0.5">
                    इस लिंक को खोलें: <a href="https://console.cloud.google.com/apis/credentials" target="_blank" class="text-blue-600 hover:underline font-medium">console.cloud.google.com/apis/credentials</a> और अपनी प्रोजेक्ट का चुनाव करें।
                  </p>
                </div>

                <!-- Step 2 -->
                <div class="border-l-2 border-blue-500 pl-3">
                  <div class="font-bold text-gray-800">2. Authorized Redirect URIs दर्ज करें</div>
                  <p class="text-[11px] text-gray-500 mt-0.5 mb-2">अपनी OAuth Client Credentials में निम्नलिखित दोनों <strong>Redirect URIs</strong> को जोड़ें:</p>
                  <div class="space-y-1.5">
                    <div class="bg-gray-50 border border-gray-200 rounded-lg p-2 flex items-center justify-between font-mono text-[9.5px]">
                      <span class="truncate pr-2">https://ais-dev-uosngrnivjaiw5lu5cxac4-29692119336.asia-southeast1.run.app/api/auth/google/callback</span>
                      <button onclick="navigator.clipboard.writeText('https://ais-dev-uosngrnivjaiw5lu5cxac4-29692119336.asia-southeast1.run.app/api/auth/google/callback'); alert('Copied Redirect URI!')" class="bg-white hover:bg-gray-100 border text-[9px] font-bold py-0.5 px-1.5 rounded text-gray-600">Copy</button>
                    </div>
                    <div class="bg-gray-50 border border-gray-200 rounded-lg p-2 flex items-center justify-between font-mono text-[9.5px]">
                      <span class="truncate pr-2">https://ais-pre-uosngrnivjaiw5lu5cxac4-29692119336.asia-southeast1.run.app/api/auth/google/callback</span>
                      <button onclick="navigator.clipboard.writeText('https://ais-pre-uosngrnivjaiw5lu5cxac4-29692119336.asia-southeast1.run.app/api/auth/google/callback'); alert('Copied Redirect URI!')" class="bg-white hover:bg-gray-100 border text-[9px] font-bold py-0.5 px-1.5 rounded text-gray-600">Copy</button>
                    </div>
                  </div>
                </div>

                <!-- Step 3 -->
                <div class="border-l-2 border-blue-500 pl-3">
                  <div class="font-bold text-gray-800">3. AI Studio में Secrets दर्ज करें</div>
                  <p class="text-[11px] text-gray-500 mt-0.5">
                    AI Studio के <strong>Secrets Panel</strong> (सेटिंग्स) में जाकर इन वेरिएबल्स को सेव करें:
                  </p>
                  <ul class="list-disc pl-4 mt-1 text-[11px] text-gray-600 space-y-0.5">
                    <li><strong class="code-font">GOOGLE_CLIENT_ID</strong></li>
                    <li><strong class="code-font">GOOGLE_CLIENT_SECRET</strong></li>
                  </ul>
                </div>
              </div>
            </div>

            <div class="mt-8 pt-4 border-t flex flex-col gap-2.5">
              <button onclick="window.close()" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl py-3 text-xs tracking-wide transition-all shadow-md shadow-blue-500/10 cursor-pointer">
                I Understand, Close Popup
              </button>
              <div class="text-[10px] text-center text-gray-400">
                जब आप सीक्रेट्स जोड़ देंगे, तो इस बटन को दबाने पर सीधे आपका असली जीमेल लॉगिन पॉपअप खुल जाएगा।
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
  });

  // Serve Vite in development, static build in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 SmartSpe full-stack server listening on http://localhost:${PORT}`);
  });
}

startServer();
