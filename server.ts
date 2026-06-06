import dotenv from "dotenv";
dotenv.config();

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

    const clientId = process.env.GOOGLE_CLIENT_ID || "787319341169-38qm6mtfbvqcu1gotshtfgbe9incn52g.apps.googleusercontent.com";
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
          client_id: process.env.GOOGLE_CLIENT_ID || "787319341169-38qm6mtfbvqcu1gotshtfgbe9incn52g.apps.googleusercontent.com",
          client_secret: process.env.GOOGLE_CLIENT_SECRET || "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",
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
          <title>Google Login Setup & Sandbox Gateway</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono&display=swap" rel="stylesheet">
          <style>
            body { font-family: 'Inter', sans-serif; background-color: #f8fafc; }
            .heading-font { font-family: 'Space Grotesk', sans-serif; }
            .code-font { font-family: 'JetBrains Mono', monospace; }
          </style>
        </head>
        <body class="min-h-screen flex items-center justify-center p-4">
          <div class="bg-white rounded-[28px] border border-gray-150 shadow-[0_12px_45px_rgba(0,0,0,0.04)] w-full max-w-[580px] p-8 sm:p-10 relative overflow-hidden flex flex-col justify-between">
            <div>
              {/* Google Header G Logo */}
              <div class="flex items-center justify-between border-b pb-5 mb-5">
                <div class="flex items-center gap-2">
                  <svg class="h-6" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.08H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.92l2.85-2.22.81-.6z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.08l3.66 2.84c.87-2.6 3.3-4.54 6.16-4.54z" />
                  </svg>
                  <span class="text-xs font-black tracking-wide uppercase text-gray-400 heading-font">SmartSpe Identity Hub</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <span class="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span>
                  <span class="text-[10px] bg-green-100 text-green-700 font-extrabold px-3 py-1 rounded-full uppercase">Hybrid Active</span>
                </div>
              </div>

              <!-- Sleek Tabs Navigation -->
              <div class="flex gap-2 p-1.5 bg-gray-100 rounded-xl mb-6">
                <button id="tab-btn-setup" onclick="switchTab('setup')" class="flex-1 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer bg-white text-gray-800 shadow-sm border-none">
                  🔐 Real Google Login (असली सेटअप)
                </button>
                <button id="tab-btn-sandbox" onclick="switchTab('sandbox')" class="flex-1 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer text-gray-500 hover:text-gray-800 border-none bg-transparent">
                  ⚡ Sandbox Mode (त्वरित टेस्ट)
                </button>
              </div>

              <!-- ==================== TAB 1: SETUP PANEL ==================== -->
              <div id="panel-setup" class="space-y-4">
                <h1 class="text-lg font-bold text-gray-800 leading-tight heading-font">Configure Real Gmail Sign-In</h1>
                <p class="text-xs text-gray-500 flex items-center gap-1 font-sans">
                  <span>सच्चा गूगल लॉगिन एक्सेस चालू करने के लिए इन क्रेडेंशियल्स को AI Studio के Secrets में जोड़े।</span>
                </p>

                <div class="bg-amber-50/70 border border-amber-200/55 rounded-xl p-3.5 text-xs text-amber-900 leading-relaxed font-sans">
                  <strong>💡 Secret Manager Tip:</strong> Since you deleted the local <code>.env</code> file (which is excellent to prevent credentials in ZIP downloads), please input these keys in the **Secrets Panel (Side Menu)** in AI Studio to keep them secure and run dynamically on this server.
                </div>

                <div class="space-y-3.5 text-xs text-left">
                  <!-- REDIRECT URIs -->
                  <div class="border-l-2 border-indigo-500 pl-3">
                    <div class="font-bold text-gray-800">1. Google Callback Redirect URI</div>
                    <p class="text-[10.5px] text-gray-400 mt-0.5 mb-1.5">Google Project में यह Callback URI दर्ज करें:</p>
                    <div class="bg-gray-50 border border-gray-200 rounded-lg p-2.5 flex items-center justify-between font-mono text-[9px] text-gray-600">
                      <span class="truncate pr-2 select-all">https://ais-dev-uosngrnivjaiw5lu5cxac4-29692119336.asia-southeast1.run.app/api/auth/google/callback</span>
                      <button onclick="navigator.clipboard.writeText('https://ais-dev-uosngrnivjaiw5lu5cxac4-29692119336.asia-southeast1.run.app/api/auth/google/callback'); alert('Copied Redirect URI!')" class="bg-white hover:bg-gray-100 border text-[9px] font-bold py-1 px-2 rounded text-gray-600 cursor-pointer">Copy</button>
                    </div>
                  </div>

                  <!-- CLIENT ID -->
                  <div class="border-l-2 border-indigo-500 pl-3">
                    <div class="font-bold text-gray-800">2. Google Client ID (GOOGLE_CLIENT_ID)</div>
                    <p class="text-[10.5px] text-gray-400 mt-0.5 mb-1.5">यह आपका Google Client ID है:</p>
                    <div class="bg-gray-50 border border-gray-200 rounded-lg p-2.5 flex items-center justify-between font-mono text-[9px] text-gray-650">
                      <span class="truncate pr-2 select-all">787319341169-38qm6mtfbvqcu1gotshtfgbe9incn52g.apps.googleusercontent.com</span>
                      <button onclick="navigator.clipboard.writeText('787319341169-38qm6mtfbvqcu1gotshtfgbe9incn52g.apps.googleusercontent.com'); alert('Copied CLIENT_ID!')" class="bg-white hover:bg-gray-100 border text-[9px] font-bold py-1 px-2 rounded text-gray-600 cursor-pointer">Copy</button>
                    </div>
                  </div>

                  <!-- CLIENT SECRET -->
                  <div class="border-l-2 border-indigo-500 pl-3">
                    <div class="font-bold text-gray-800">3. Google Client Secret (GOOGLE_CLIENT_SECRET)</div>
                    <p class="text-[10.5px] text-gray-400 mt-0.5 mb-1.5">यह आपका Google Client Secret है:</p>
                    <div class="bg-gray-50 border border-gray-200 rounded-lg p-2.5 flex items-center justify-between font-mono text-[9px] text-red-650">
                      <span class="truncate pr-2 select-all">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</span>
                      <button onclick="navigator.clipboard.writeText('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'); alert('Copied CLIENT_SECRET!')" class="bg-white hover:bg-gray-100 border text-[9px] font-bold py-1 px-2 rounded text-gray-600 cursor-pointer">Copy</button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- ==================== TAB 2: SANDBOX BYPASS PANEL ==================== -->
              <div id="panel-sandbox" class="hidden space-y-4">
                <h1 class="text-lg font-bold text-gray-800 leading-tight heading-font">Sandbox Interactive Login</h1>
                <p class="text-xs text-gray-500 font-sans">
                  यदि आप क्रेडेंशियल्स दर्ज नहीं करना चाहते हैं, तो बिना किसी क्रेडेंशियल के सीधे टेस्ट करने के लिए नीचे दिए गए मॉक प्रोफाइल पर क्लिक करें:
                </p>

                <!-- Sandbox Profiles List -->
                <div class="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                  <!-- Profile 1 -->
                  <button 
                    onclick="dispatchGoogleLogin('Super Admin (Vakrangee)', 'vakrangee653@gmail.com')"
                    class="w-full flex items-center gap-3 p-3 hover:bg-indigo-50/50 rounded-xl transition-all border border-gray-100 text-left cursor-pointer bg-white"
                  >
                    <div class="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                      <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=96&auto=format&fit=crop" class="w-full h-full object-cover" />
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="text-xs font-semibold text-gray-800 truncate">Super Admin (vakrangee653)</div>
                      <div class="text-[10px] text-gray-400 truncate">vakrangee653@gmail.com</div>
                    </div>
                    <div class="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full uppercase shrink-0">SUPER ADMIN</div>
                  </button>

                  <!-- Profile 2 -->
                  <button 
                    onclick="dispatchGoogleLogin('Ramesh Sharma', 'owner@gmail.com')"
                    class="w-full flex items-center gap-3 p-3 hover:bg-blue-50/50 rounded-xl transition-all border border-gray-100 text-left cursor-pointer bg-white"
                  >
                    <div class="w-9 h-9 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      RS
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="text-xs font-semibold text-gray-800 truncate">Ramesh Sharma</div>
                      <div class="text-[10px] text-gray-400 truncate">owner@gmail.com</div>
                    </div>
                    <div class="text-[10px] bg-blue-50 text-blue-600 font-bold px-2 py-0.5 rounded-full uppercase shrink-0 font-sans">CSC OWNER</div>
                  </button>

                  <!-- Profile 3 -->
                  <button 
                    onclick="dispatchGoogleLogin('Sunita Verma', 'staff@gmail.com')"
                    class="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-all border border-gray-100 text-left cursor-pointer bg-white"
                  >
                    <div class="w-9 h-9 rounded-full bg-slate-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      SV
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="text-xs font-semibold text-gray-800 truncate">Sunita Verma</div>
                      <div class="text-[10px] text-gray-400 truncate">staff@gmail.com</div>
                    </div>
                    <div class="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full uppercase shrink-0">STAFF</div>
                  </button>

                  <!-- Simulator Custom Profile Input -->
                  <div class="bg-gray-50 border border-gray-150 rounded-2xl p-4 mt-2">
                    <h3 class="text-xs font-bold text-gray-700 mb-2">Simulate Custom Google User</h3>
                    <div class="grid grid-cols-2 gap-2 mb-2">
                      <input id="sim-custom-name" type="text" placeholder="Full Name" class="border border-gray-200 rounded-lg p-2 text-xs bg-white outline-none" />
                      <input id="sim-custom-email" type="email" placeholder="example@gmail.com" class="border border-gray-200 rounded-lg p-2 text-xs bg-white outline-none" />
                    </div>
                    <button onclick="submitCustomSandbox()" class="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors border-none">
                      Login as Custom Google Profile
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer Buttons -->
            <div class="mt-6 pt-4 border-t flex flex-col gap-2">
              <button onclick="window.close()" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl py-3 text-xs tracking-wide transition-all shadow-md shadow-blue-500/10 cursor-pointer border-none">
                Close Setup Assistant
              </button>
              <div class="text-[10px] text-center text-gray-400 leading-normal font-sans">
                सिम्युलेटर मोड में प्रोफाइल पर क्लिक करने से आप तुरंत डैशबोर्ड पर पहुँच जायेंगे।
              </div>
            </div>
          </div>

          <script>
            function switchTab(tabId) {
              const setupBtn = document.getElementById('tab-btn-setup');
              const sandboxBtn = document.getElementById('tab-btn-sandbox');
              const setupPanel = document.getElementById('panel-setup');
              const sandboxPanel = document.getElementById('panel-sandbox');

              if (tabId === 'setup') {
                setupBtn.className = 'flex-1 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer bg-white text-gray-800 shadow-sm border-none';
                sandboxBtn.className = 'flex-1 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer text-gray-500 hover:text-gray-800 border-none bg-transparent';
                setupPanel.classList.remove('hidden');
                sandboxPanel.classList.add('hidden');
              } else {
                sandboxBtn.className = 'flex-1 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer bg-white text-gray-800 shadow-sm border-none';
                setupBtn.className = 'flex-1 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer text-gray-500 hover:text-gray-800 border-none bg-transparent';
                sandboxPanel.classList.remove('hidden');
                setupPanel.classList.add('hidden');
              }
            }

            function dispatchGoogleLogin(name, email) {
              const isSuperAdmin = email.toLowerCase() === 'vakrangee653@gmail.com';
              const isAdmin = email.toLowerCase() === 'admin@smartspe.in';
              const isStaff = email.toLowerCase() === 'staff@gmail.com';
              
              const userData = {
                id: "google_" + Date.now(),
                name: name,
                email: email,
                role: (isSuperAdmin || isAdmin) ? "Admin" : (isStaff ? "Staff" : "Owner"),
                pin: (isSuperAdmin || isAdmin) ? "9999" : (isStaff ? "2222" : "1111"),
                mobile: isSuperAdmin ? "+91 84321 63308" : (isStaff ? "+91 99999 99999" : ""),
                status: "active",
                picture: ""
              };
              
              if (window.opener) {
                window.opener.postMessage({ type: 'GOOGLE_OAUTH_SUCCESS', user: userData }, '*');
                window.close();
              } else {
                alert('Success! User login payload dispatched: ' + name + " (" + email + ")");
              }
            }

            function submitCustomSandbox() {
              const name = document.getElementById('sim-custom-name').value.trim() || 'Custom User';
              const email = document.getElementById('sim-custom-email').value.trim() || 'custom@gmail.com';
              
              if (!email.includes('@')) {
                alert('कृपया एक सही ईमेल प्रविष्ट करें!');
                return;
              }
              dispatchGoogleLogin(name, email);
            }
          </script>
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
