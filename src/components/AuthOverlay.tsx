import React, { useState, useEffect } from 'react';
import { 
  Crown, Users, KeyRound, Mail, ArrowRight, ArrowLeft, 
  ShieldCheck, LockOpen, Send, Camera, Unlock, CheckCircle2, X,
  Phone, MapPin, Sparkles, Check, Eye, EyeOff, Building2, HelpCircle
} from 'lucide-react';
import { User } from '../types';
import { getStoredData, setStoredData } from '../utils';

interface AuthOverlayProps {
  onLoginSuccess: (user: User) => void;
  onMockEmailTrigger: (subject: string, body: string, toEmail?: string) => void;
}

export default function AuthOverlay({ onLoginSuccess, onMockEmailTrigger }: AuthOverlayProps) {
  // Screen transitions: 'login' | 'gmail' | 'signup'
  const [activeCard, setActiveCard] = useState<'login' | 'gmail' | 'signup'>('login');
  
  // Login form states
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pinError, setPinError] = useState(false);
  const [shake, setShake] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Gmail states
  const [gmailEmail, setGmailEmail] = useState('');
  const [gmailRole, setGmailRole] = useState<'Owner' | 'Staff' | 'Admin'>('Owner');
  const [gmailStep, setGmailStep] = useState<1 | 2>(1);
  const [gmailGeneratedOtp, setGmailGeneratedOtp] = useState('');
  const [gmailEnteredOtp, setGmailEnteredOtp] = useState('');
  const [gmailOtpError, setGmailOtpError] = useState(false);

  // Signup states
  const [signupStep, setSignupStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [signupName, setSignupName] = useState('');
  const [signupMobile, setSignupMobile] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [generatedPin, setGeneratedPin] = useState('');
  const [enteredPin, setEnteredPin] = useState('');
  const [enteredPinError, setEnteredPinError] = useState(false);
  const [shopName, setShopName] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [photoBase64, setPhotoBase64] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop');
  const [progress, setProgress] = useState(0);

  // Retrieve users from LocalStorage
  const getUsers = (): User[] => {
    let users = getStoredData<User[]>('csc_users', []);
    
    // Default system seed lists
    const defaultUsers: User[] = [
      { id: "user_owner", name: "Ramesh Sharma", role: "Owner", pin: "1111", mobile: "+91 84321 63308", email: "owner@gmail.com", status: "active" },
      { id: "user_staff", name: "Sunita Verma", role: "Staff", pin: "2222", mobile: "+91 84321 63308", email: "staff@gmail.com", status: "active" },
      { id: "user_plat_admin", name: "Developer Admin", role: "Admin", pin: "9999", mobile: "+91 99999 99999", email: "admin@smartspe.in", status: "active" }
    ];

    if (users.length === 0) {
      users = defaultUsers;
      setStoredData('csc_users', users);
    } else {
      // Ensure Developer account always exists
      const hasPlatAdmin = users.some(u => u.id === 'user_plat_admin' || u.role === 'Admin');
      if (!hasPlatAdmin) {
        users.push({
          id: "user_plat_admin",
          name: "Developer Admin",
          role: "Admin",
          pin: "9999",
          mobile: "+91 99999 99999",
          email: "admin@smartspe.in",
          status: "active"
        });
        setStoredData('csc_users', users);
      }
    }
    return users;
  };

  // Safe side effect to seed users initially
  useEffect(() => {
    getUsers();
  }, []);

  // Google OAuth Cross-window Communication Listener
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      // Accept messaging from dev run.app, shared run.app or localhost
      if (!origin.endsWith('.run.app') && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
        return;
      }

      if (event.data?.type === 'GOOGLE_OAUTH_SUCCESS') {
        const googleUser = event.data.user;
        if (googleUser) {
          setIsGoogleLoading(false);
          const currentUsers = getUsers();
          const existing = currentUsers.find(u => u.email.toLowerCase() === googleUser.email.toLowerCase());

          if (existing) {
            if (existing.status === 'blocked') {
              alert("Access Denied: Your account/license has been suspended by the administrator.");
              return;
            }
            onLoginSuccess(existing);
          } else {
            // Self-register with role "Owner"
            const newUser: User = {
              id: googleUser.id,
              name: googleUser.name,
              role: 'Owner',
              pin: '1111',
              mobile: '',
              email: googleUser.email,
              status: 'active'
            };

            // Set up default local profile configs so dashboard is fully functional
            localStorage.setItem('csc_profile_name', googleUser.name);
            localStorage.setItem('csc_profile_shop_name', googleUser.name + " Digital CSC Center");
            localStorage.setItem('csc_profile_email', googleUser.email);
            if (googleUser.picture) {
              localStorage.setItem('csc_profile_photo', googleUser.picture);
            }
            localStorage.setItem('csc_profile_retailer_id', "CSC" + String(Math.floor(10000000 + Math.random() * 90000000)));

            currentUsers.push(newUser);
            setStoredData('csc_users', currentUsers);

            // Send welcoming Operational Dispatch code
            onMockEmailTrigger(
              `Google Login Registration Code`,
              `प्रिय ${googleUser.name},\n\nSmartSpe CSC Suite में आपका स्वागत है। गूगल द्वारा सत्यापित कर आपका नया खाता सक्रिय किया गया है।\n\nलॉगिन विवरण:\nजीमेल आईडी: ${googleUser.email}\nआपका डिफ़ॉल्ट सिक्योर पिन: 1111\n\nआप इस डिफ़ॉल्ट सुरक्षा पिन (1111) का उपयोग कर अपनी सुरक्षा को बढ़ा सकते हैं।\n\nसादर,\nSmartSpe Technical Core Support Group`,
              googleUser.email
            );

            onLoginSuccess(newUser);
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onLoginSuccess, onMockEmailTrigger]);

  // Look up registered user based on entered email
  const allUsers = getUsers();
  const detectedUser = emailInput.trim() 
    ? allUsers.find(u => u.email.toLowerCase() === emailInput.trim().toLowerCase()) 
    : null;

  // Handle standard email password sign in
  const handleEmailPasswordSubmit = () => {
    if (!emailInput) {
      alert('कृपया अपनी ईमेल आईडी दर्ज करें।');
      return;
    }
    if (!passwordInput) {
      alert('कृपया अपना लॉगिन पासवर्ड दर्ज करें।');
      return;
    }

    const users = getUsers();
    const matched = users.find(
      u => u.email.toLowerCase() === emailInput.trim().toLowerCase() && u.pin === passwordInput.trim()
    );

    if (matched) {
      if (matched.status === 'blocked') {
        alert("Access Denied: Your account/license has been suspended by the platform administrator. Contact support at help@smartspe.in");
        setPasswordInput('');
        return;
      }
      onLoginSuccess(matched);
    } else {
      setPinError(true);
      setShake(true);
      setPasswordInput('');
      setTimeout(() => setShake(false), 450);
    }
  };

  // Google interactive sign in helper
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      // Dynamic fetch from Express Server - accommodates live secret keys as well as high-fidelity sandboxes
      const resp = await fetch(`/api/auth/google/url?origin=${encodeURIComponent(window.location.origin)}`);
      if (!resp.ok) {
        throw new Error("Unable to retrieve Google Authentication resource routes.");
      }
      const data = await resp.json();

      const width = 500;
      const height = 650;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const authWindow = window.open(
        data.url,
        "google_oauth_popup",
        `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes,scrollbars=yes`
      );

      if (!authWindow) {
        setIsGoogleLoading(false);
        alert("पॉप-अप ब्लॉक किया गया! कृपया अपने ब्राउज़र सेटिंग्स में पॉप-अप विंडो खोलने की अनुमति प्रदान करें (Allow Pop-ups on this site) ताकि गूगल लॉगिन सुचारू रूप से काम कर सके।");
      }
    } catch (err) {
      console.error("❌ Google Authorization popup trigger failure:", err);
      setIsGoogleLoading(false);
      alert("गूगल ऑथेंटिकेशन गेटवे से कनेक्ट करने में त्रुटि। कृपया पुनः प्रयास करें।");
    }
  };

  // recovery or OTP handler
  const handleSendGmailOtp = () => {
    if (!gmailEmail) {
      alert('Please enter your Gmail address.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(gmailEmail)) {
      alert('Please enter a valid email address.');
      return;
    }

    const users = getUsers();
    const matched = users.find(u => u.role === gmailRole && u.email.toLowerCase() === gmailEmail.toLowerCase());

    if (!matched) {
      alert('This Gmail address is not registered for the selected role. Please register or sign up first!');
      return;
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    setGmailGeneratedOtp(otp);
    setGmailStep(2);
    setGmailOtpError(false);

    // Trigger SMTP dispatch
    onMockEmailTrigger(
      'Gmail OTP Code - SmartSpe Login',
      `Hello ${matched.name}, your SmartSpe verification code OTP is: ${otp}`,
      gmailEmail
    );
  };

  const handleVerifyGmailOtp = () => {
    if (gmailEnteredOtp === gmailGeneratedOtp) {
      const users = getUsers();
      const matched = users.find(u => u.role === gmailRole && u.email.toLowerCase() === gmailEmail.toLowerCase());
      if (matched) {
        if (matched.status === 'blocked') {
          alert("Access Denied: This account is suspended.");
          setGmailEnteredOtp('');
          return;
        }
        onLoginSuccess(matched);
      }
    } else {
      setGmailOtpError(true);
      setShake(true);
      setGmailEnteredOtp('');
      setTimeout(() => setShake(false), 400);
    }
  };

  const handleSignupNext1 = () => {
    if (!signupName || !signupMobile || !signupEmail) {
      alert('Please fill in Name, Mobile, and Email.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signupEmail)) {
      alert('Please enter a valid email address.');
      return;
    }

    // Generate random 4 digit PIN
    const otpPin = String(Math.floor(1000 + Math.random() * 9000));
    setGeneratedPin(otpPin);
    setSignupStep(2);
    setEnteredPinError(false);

    // Trigger SMTP dispatch code to Gmail
    onMockEmailTrigger(
      'Account Security PIN - SmartSpe Register',
      `Dear ${signupName}, your auto-generated SmartSpe Password Security PIN is: ${otpPin}. Enter this code on the verification step to complete your registration.`,
      signupEmail
    );
  };

  const handleVerifySignupPin = () => {
    if (enteredPin === generatedPin) {
      setSignupStep(3);
    } else {
      setEnteredPinError(true);
      setEnteredPin('');
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotoBase64(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCompleteProfileSect = () => {
    if (!shopName || !shopAddress) {
      alert('Please enter your Shop Name and Shop Address.');
      return;
    }
    setSignupStep(4);
  };

  const handleFinalSignupComplete = () => {
    setSignupStep(5);
    setProgress(10);
    
    // Simulate loading configuration progress
    let currentPrg = 10;
    const interval = setInterval(() => {
      currentPrg += 30;
      if (currentPrg >= 100) {
        currentPrg = 100;
        clearInterval(interval);

        // Final registration
        const newUserId = "user_" + Date.now();
        const newUser: User = {
          id: newUserId,
          name: signupName,
          role: "Owner",
          pin: generatedPin,
          mobile: signupMobile,
          email: signupEmail,
          status: 'active',
          shopName: shopName
        };

        // Cache variables in LocalStorage profile
        localStorage.setItem('csc_profile_name', signupName);
        localStorage.setItem('csc_profile_shop_name', shopName);
        localStorage.setItem('csc_profile_phone', signupMobile);
        localStorage.setItem('csc_profile_email', signupEmail);
        localStorage.setItem('csc_profile_address', shopAddress);
        localStorage.setItem('csc_profile_photo', photoBase64);
        localStorage.setItem('csc_profile_retailer_id', "CSC" + String(Math.floor(10000000 + Math.random() * 90000000)));

        const currentUsers = getUsers();
        currentUsers.push(newUser);
        setStoredData('csc_users', currentUsers);

        // Dispatches permanent ID & password directly to real Gmail email inbox
        onMockEmailTrigger(
          `SmartSpe VLE Account Created: ${shopName}`,
          `प्रिय ${signupName},\n\nबधाई हो! आपका SmartSpe CSC Suite एकाउंट सफलतापूर्वक एक्टिवेट कर दिया गया है।\n\nआपकी लॉग इन क्रेडेंशियल्स निम्नलिखित हैं:\nलॉग इन आईडी (Gmail): ${signupEmail}\nआपका सिक्योर पिन / पासवर्ड: ${generatedPin}\n\nकृपया इस सिक्योर पिन का उपयोग कर अपने डैशबोर्ड को सुरक्षित रूप से खोलें। यह पिन किसी के साथ शेयर न करें।\n\nसादर,\nSmartSpe Technical Core Support Group`,
          signupEmail
        );

        // Sync and Login
        onLoginSuccess(newUser);
      } else {
        setProgress(currentPrg);
      }
    }, 450);
  };

  return (
    <div id="auth-overlay" className="absolute inset-0 min-h-screen w-full flex items-center justify-center overflow-y-auto px-4 py-8 bg-[#f8fafc] font-sans z-50 text-gray-800">
      
      {/* Styles for Shaking and Fade In animations */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spinSlow 3s linear infinite;
        }
      `}</style>

      {/* Abstract Background Grid Accent */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f001_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f001_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      
      {/* 2 Exquisite Background Blue/Cyan Blobs representing the uploaded screenshot style */}
      {/* Left Blob Accent */}
      <div 
        id="bg-blob-left"
        className="absolute left-0 top-[20%] w-[18vw] min-w-[120px] max-w-[280px] h-[55%] bg-gradient-to-tr from-[#0284c7] via-[#0369a1] to-[#1d4ed8] rounded-r-[150px] border-none shadow-2xl opacity-90 pointer-events-none"
      />

      {/* Right Blob Accent */}
      <div 
        id="bg-blob-right"
        className="absolute right-0 top-0 w-[24vw] min-w-[160px] max-w-[360px] h-[48%] bg-gradient-to-bl from-[#1d4ed8] via-[#0369a1] to-[#0284c7] rounded-bl-[150px] border-none shadow-2xl opacity-90 pointer-events-none"
      />

      {/* Centered Master Modern White Card */}
      <div 
        id="auth-master-card"
        className={`relative z-10 w-full max-w-[440px] bg-white border border-gray-150 rounded-[28px] p-8 sm:p-12 shadow-[0_12px_45px_rgba(0,0,0,0.035)] space-y-6 my-auto ${shake ? 'animate-shake' : ''}`}
      >
        
        {/* Loading overlay for Google authentication */}
        {isGoogleLoading && (
          <div id="google-authenticating-overlay" className="absolute inset-0 bg-white/95 rounded-[28px] flex flex-col items-center justify-center space-y-3 z-20 animate-fadeIn">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-semibold text-gray-600 animate-pulse font-sans">Connecting with Google Security...</p>
          </div>
        )}

        {/* 1. LOGIN SCREEN CARD */}
        {activeCard === 'login' && (
          <div id="auth-login-view" className="space-y-6">
            
            {/* Title exact copy of 'Login' */}
            <h1 id="hdr-login-title" className="text-3xl font-medium text-gray-800 text-center tracking-tight mb-8 mt-1 select-none font-sans">
              Login
            </h1>

            {/* Email & Password Input Fields */}
            <div className="space-y-5">
              
              <div className="space-y-1.5 text-left font-sans">
                <label htmlFor="login-email-input" className="text-gray-400 text-xs font-normal tracking-wide block select-none">
                  Email ID
                </label>
                <input 
                  type="email" 
                  id="login-email-input" 
                  placeholder="Enter Email ID" 
                  value={emailInput}
                  onChange={(e) => {
                    setEmailInput(e.target.value);
                    setPinError(false);
                  }}
                  className="w-full h-11 px-4 border border-gray-200 focus:border-[#007bff] focus:ring-1 focus:ring-[#007bff] rounded-md text-sm text-gray-800 bg-white outline-none transition-all placeholder-gray-300 font-sans"
                />

                {/* Intelligent Dynamic VLE User/Role Detector */}
                {detectedUser && (
                  <div id="badge-detector" className="flex items-center gap-1 text-[11px] text-blue-500 font-semibold bg-blue-50/70 py-1 px-2.5 rounded-full w-fit mt-1.5 animate-fadeIn font-sans">
                    {detectedUser.role === 'Admin' ? (
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                    ) : detectedUser.role === 'Owner' ? (
                      <Crown className="w-3.5 h-3.5 text-blue-500" />
                    ) : (
                      <Users className="w-3.5 h-3.5 text-blue-500" />
                    )}
                    <span>Detected Account category: {detectedUser.role} ({detectedUser.name})</span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5 text-left font-sans">
                <label htmlFor="login-password-input" className="text-gray-400 text-xs font-normal tracking-wide block select-none">
                  Password
                </label>
                <div className="relative">
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    id="login-password-input" 
                    placeholder="Enter Password / PIN" 
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      setPinError(false);
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleEmailPasswordSubmit()}
                    className="w-full h-11 pl-4 pr-11 border border-gray-200 focus:border-[#007bff] focus:ring-1 focus:ring-[#007bff] rounded-md text-sm text-gray-800 bg-white outline-none transition-all placeholder-gray-300 tracking-widest font-mono"
                  />
                  <button 
                    type="button" 
                    id="btn-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 border-none bg-transparent cursor-pointer select-none outline-none p-0"
                  >
                    {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                  </button>
                </div>
              </div>

              {pinError && (
                <div id="login-error-toast" className="bg-red-500/5 border border-red-500/10 text-red-500 text-xs py-2 px-3.5 rounded-lg text-center font-medium animate-fadeIn">
                  ❌ गलत ईमेल आईडी या पासवर्ड! कृपया जांचें।
                </div>
              )}
            </div>

            {/* Submit Actions Row matching design */}
            <div className="flex items-center justify-between gap-4 pt-1 font-sans">
              <button 
                type="button" 
                id="btn-login-submit"
                onClick={handleEmailPasswordSubmit}
                className="bg-[#007bff] hover:bg-[#0069d9] text-white font-medium text-sm px-10 py-2.5 rounded-full shadow-[0_4px_12px_rgba(0,123,255,0.15)] transition-all active:scale-[0.98] cursor-pointer border-none"
              >
                Login
              </button>
              
              <button 
                type="button" 
                id="btn-text-forgot-psw"
                onClick={() => {
                  setActiveCard('gmail');
                  setGmailStep(1);
                  setGmailOtpError(false);
                }}
                className="text-xs text-[#007bff] hover:underline cursor-pointer bg-transparent border-none font-medium text-right outline-none p-0"
              >
                Forgot password?
              </button>
            </div>

            {/* Create new Sign up line */}
            <div className="text-xs text-gray-500 text-left pt-2 font-medium font-sans select-none">
              {"Don't have an account? "}
              <button 
                type="button" 
                id="btn-create-account-switch"
                onClick={() => {
                  setActiveCard('signup');
                  setSignupStep(1);
                }}
                className="text-[#007bff] font-bold hover:underline cursor-pointer bg-transparent border-none p-0 inline text-xs ml-0.5"
              >
                Create new
              </button>
            </div>

            {/* Middle Divider 'Or Login with' */}
            <div className="relative flex items-center py-2 select-none">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="flex-shrink mx-4 text-gray-400 text-xs font-normal font-sans">
                Or Login with
              </span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>

            {/* Google Authentication Button representing design layout */}
            <div className="flex justify-center pt-1">
              <button 
                type="button" 
                id="btn-google-sign-in"
                onClick={handleGoogleSignIn}
                className="flex items-center justify-center gap-2.5 border border-gray-200 hover:bg-gray-50 bg-white text-xs font-semibold text-gray-600 px-6 py-2.5 rounded-full w-full max-w-[280px] transition-colors cursor-pointer shadow-[0_2px_6px_rgba(0,0,0,0.015)] select-none border-solid font-sans"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.08H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.92l2.85-2.22.81-.6z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.08l3.66 2.84c.87-2.6 3.3-4.54 6.16-4.54z" />
                </svg>
                <span>Sign in with Google</span>
              </button>
            </div>

          </div>
        )}

        {/* 2. GMAIL OTP PANEL */}
        {activeCard === 'gmail' && (
          <div id="auth-gmail-view" className="space-y-6">
            
            <h1 id="hdr-gmail-title" className="text-2xl font-medium text-gray-800 text-center tracking-tight mb-2 mt-1 select-none font-sans">
              Gmail Password Helper
            </h1>

            {gmailStep === 1 ? (
              <div className="space-y-4 text-left w-full font-sans">
                <p className="text-xs text-gray-400 text-center max-w-xs mx-auto leading-normal">
                  OTP वेरिफिकेशन के माध्यम से अपना लॉगिन पासवर्ड / पिन सीधे रिकवर करें।
                </p>

                <div className="space-y-1.5">
                  <label htmlFor="gmail-email" className="text-gray-400 text-xs font-normal tracking-wide block">रजिस्टर्ड जीमेल एड्रेस (Gmail Address)</label>
                  <input 
                    type="email" 
                    id="gmail-email" 
                    placeholder="vle-partner@gmail.com" 
                    value={gmailEmail}
                    onChange={(e) => setGmailEmail(e.target.value)}
                    className="w-full h-11 px-4 border border-gray-200 focus:border-[#007bff] focus:ring-1 focus:ring-[#007bff] rounded-md text-sm text-gray-800 bg-white outline-none transition-all placeholder-gray-300"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="gmail-role-select" className="text-gray-400 text-xs font-normal tracking-wide block">पोर्टल ऑपरेटर श्रेणी (Access Level)</label>
                  <select 
                    id="gmail-role-select"
                    value={gmailRole}
                    onChange={(e) => setGmailRole(e.target.value as 'Owner' | 'Staff' | 'Admin')}
                    className="w-full h-11 px-3 border border-gray-200 focus:border-[#007bff] focus:ring-1 focus:ring-[#007bff] rounded-md text-xs text-gray-700 bg-white outline-none cursor-pointer"
                  >
                    <option value="Owner">Owner / VLE Center</option>
                    <option value="Staff">Staff Operator</option>
                    <option value="Admin">Developer Support</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button" 
                    id="btn-gmail-back"
                    onClick={() => setActiveCard('login')}
                    className="border border-gray-200 hover:bg-gray-50 text-gray-500 font-bold text-xs py-2.5 px-4 rounded-full flex-1 transition-all cursor-pointer bg-white"
                  >
                    पीछे लौटें
                  </button>
                  <button 
                    type="button" 
                    id="btn-gmail-otp-request"
                    onClick={handleSendGmailOtp}
                    className="bg-[#007bff] hover:bg-[#0069d9] text-white font-semibold text-xs py-2.5 px-5 rounded-full flex-2 transition-all active:scale-95 shadow-md border-none cursor-pointer text-center"
                  >
                    कोड भेजें (Send OTP)
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-center w-full font-sans">
                <div className="mx-auto w-10 h-10 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-gray-800">६ - अंकीय ओटीपी प्रविष्टि</h3>
                  <p className="text-[11px] text-gray-400 max-w-sm mx-auto leading-relaxed">
                    आपके ईमेल <strong className="text-gray-700">{gmailEmail}</strong> पर एक सुरक्षा पिन भेजा गया है।
                  </p>
                </div>

                <input 
                  type="text" 
                  maxLength={6} 
                  placeholder="000000" 
                  value={gmailEnteredOtp}
                  onChange={(e) => {
                    setGmailEnteredOtp(e.target.value);
                    setGmailOtpError(false);
                  }}
                  className="text-center font-bold text-2xl tracking-widest py-2 border border-gray-200 rounded-xl bg-gray-50 text-gray-800 w-full outline-none focus:border-[#007bff] focus:ring-1 focus:ring-[#007bff] font-mono"
                />
                
                {gmailOtpError && (
                  <div className="bg-red-500/5 border border-red-500/10 text-red-500 text-xs py-1.5 px-3 rounded-lg font-semibold">
                    ❌ गलत कोड प्रविष्टि! कृपया इनबॉक्स की जांच करें।
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setGmailStep(1)}
                    className="border border-gray-200 hover:bg-gray-50 text-gray-500 font-bold text-xs py-2.5 px-4 rounded-full flex-1 transition-all cursor-pointer bg-white"
                  >
                    ईमेल बदलें
                  </button>
                  <button 
                    type="button" 
                    onClick={handleVerifyGmailOtp}
                    className="bg-[#007bff] hover:bg-[#0069d9] text-white font-semibold text-xs py-2.5 px-5 rounded-full flex-2 transition-all active:scale-95 shadow-md border-none cursor-pointer"
                  >
                    सत्यापित करें (Verify)
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. SIGNUP WIZARD PANEL (VLE नया पंजीकरण) */}
        {activeCard === 'signup' && (
          <div id="auth-signup-view" className="space-y-5">
            
            <div className="text-center space-y-1 select-none font-sans">
              <h2 className="text-lg font-extrabold text-gray-800 flex items-center justify-center gap-1">
                <Sparkles className="w-4.5 h-4.5 text-blue-500 shrink-0" />
                <span>VLE नया डिजिटल पंजीकरण</span>
              </h2>
              <p className="text-[11px] text-gray-400">
                सीक्रेट पिन और पासवर्ड सत्यापन सीधे आपके ईमेल इनबॉक्स में डिस्पेच होगा।
              </p>

              {/* Minimal Wizard Steps */}
              <div className="flex justify-center gap-2 pt-2">
                {[1, 2, 3, 4, 5].map((sNum) => (
                  <div 
                    key={sNum}
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all ${
                      signupStep === sNum 
                        ? 'bg-[#007bff] border-[#007bff] text-white shadow-sm' 
                        : signupStep > sNum
                          ? 'bg-emerald-50 border-emerald-100 text-emerald-500'
                          : 'bg-gray-50 border-gray-100 text-gray-300'
                    }`}
                  >
                    {signupStep > sNum ? <Check className="w-3.5 h-3.5" /> : sNum}
                  </div>
                ))}
              </div>
            </div>

            {/* STEP 1: Basic personal details */}
            {signupStep === 1 && (
              <div className="space-y-4 text-left w-full font-sans">
                <div className="space-y-1">
                  <label htmlFor="reg-name" className="text-gray-500 text-[11px] font-semibold block">ऑपरेटर का पूर्ण नाम (Full Name)</label>
                  <input 
                    type="text" 
                    id="reg-name" 
                    placeholder="जैसे: Ramesh Kumar" 
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    className="w-full h-11 px-4 border border-gray-200 focus:border-[#007bff] rounded-md text-xs text-gray-800 placeholder-gray-300 bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="reg-mobile" className="text-gray-500 text-[11px] font-semibold block">सक्रिय मोबाइल नंबर (Mobile Number)</label>
                  <input 
                    type="text" 
                    id="reg-mobile" 
                    placeholder="+91 XXXXX XXXXX" 
                    value={signupMobile}
                    onChange={(e) => setSignupMobile(e.target.value)}
                    className="w-full h-11 px-4 border border-gray-200 focus:border-[#007bff] rounded-md text-xs text-gray-800 placeholder-gray-300 bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="reg-email" className="text-gray-500 text-[11px] font-semibold block">Gmail ईमेल आईडी (लाइसेंस कोड यही भेजा जाएगा)</label>
                  <input 
                    type="email" 
                    id="reg-email" 
                    placeholder="partner@gmail.com" 
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    className="w-full h-11 px-4 border border-gray-200 focus:border-[#007bff] rounded-md text-xs text-gray-800 placeholder-gray-300 bg-white"
                  />
                </div>

                <div className="flex gap-2.5 pt-1">
                  <button 
                    type="button" 
                    onClick={() => setActiveCard('login')}
                    className="border border-gray-200 hover:bg-gray-50 text-gray-500 font-bold text-xs py-2.5 px-4 rounded-full flex-1 transition-all cursor-pointer bg-white"
                  >
                    लॉगिन पर लौटें
                  </button>
                  <button 
                    type="button" 
                    onClick={handleSignupNext1}
                    className="bg-[#007bff] hover:bg-[#0069d9] text-white font-semibold text-xs py-2.5 px-4 rounded-full flex-1.5 transition-all text-center flex items-center justify-center gap-1 border-none cursor-pointer"
                  >
                    <span>सुरक्षा कोड भेजें</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Verify code sent to Gmail */}
            {signupStep === 2 && (
              <div className="space-y-4 text-center w-full font-sans">
                <div className="mx-auto w-11 h-11 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center">
                  <ShieldCheck className="w-5.5 h-5.5" />
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-gray-800">ईमेल आईडी सत्यापित करें</h3>
                  <p className="text-[11px] text-gray-400 max-w-xs mx-auto leading-normal">
                    एक सुरक्षा पिन आपके ईमेल <strong className="text-gray-700">{signupEmail}</strong> पर भेजा गया है। उसे दर्ज करें।
                  </p>
                </div>

                <input 
                  type="password" 
                  maxLength={4} 
                  placeholder="••••" 
                  value={enteredPin}
                  onChange={(e) => {
                    setEnteredPin(e.target.value);
                    setEnteredPinError(false);
                  }}
                  className="text-center font-bold text-2xl tracking-widest py-2 border border-gray-200 rounded-xl bg-gray-50 text-gray-800 w-28 mx-auto outline-none focus:border-[#007bff]"
                />
                
                {enteredPinError && (
                  <div className="bg-red-500/5 border border-red-500/10 text-red-500 text-xs py-1.5 px-3 rounded-lg max-w-xs mx-auto font-semibold">
                    ❌ डाला गया पिन सही नहीं है, पुनः जांचें!
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <button 
                    type="button" 
                    onClick={() => setSignupStep(1)}
                    className="border border-gray-200 hover:bg-gray-50 text-gray-500 font-bold text-xs py-2.5 px-4 rounded-full flex-1 hover:bg-gray-50 transition-colors cursor-pointer bg-white"
                  >
                    पीछे
                  </button>
                  <button 
                    type="button" 
                    onClick={handleVerifySignupPin}
                    className="bg-[#007bff] hover:bg-[#0069d9] text-white font-extrabold text-xs py-2.5 px-4 rounded-full flex-2 flex items-center justify-center gap-1.5 border-none cursor-pointer"
                  >
                    <span>सत्यापित करें</span>
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Shop Name & Details */}
            {signupStep === 3 && (
              <div className="space-y-4 text-left w-full font-sans">
                
                <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-150">
                  <div className="relative w-12 h-12 shrink-0">
                    <img 
                      id="signup-profile-preview" 
                      src={photoBase64} 
                      alt="Preview" 
                      className="w-12 h-12 rounded-full object-cover border-2 border-blue-500 bg-white"
                      referrerPolicy="no-referrer"
                    />
                    <label 
                      htmlFor="signup-photo-upload" 
                      className="absolute -bottom-1 -right-1 w-5.5 h-5.5 bg-[#007bff] hover:bg-blue-600 text-white rounded-full flex items-center justify-center cursor-pointer border border-white"
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </label>
                    <input 
                      type="file" 
                      id="signup-photo-upload" 
                      accept="image/*" 
                      onChange={handlePhotoUpload} 
                      className="hidden" 
                    />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-gray-700">ऑपरेटर प्रोफाइल लोगो फ़ोटो</h4>
                    <p className="text-[10px] text-gray-400">
                      दुकान का बोर्ड इमेज या स्वयं की फ़ोटो अपलोड करें।
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="reg-shop" className="text-gray-500 text-[11px] font-semibold block">डिजिटल केंद्र / दुकान का नाम (Shop Name)</label>
                  <input 
                    type="text" 
                    id="reg-shop" 
                    placeholder="जैसे: कनक डिजिटल सीएससी सेंटर" 
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    className="w-full h-11 px-3 border border-gray-200 focus:border-[#007bff] rounded-md text-xs text-gray-800 bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="reg-address" className="text-gray-500 text-[11px] font-semibold block">शारीरिक पता (Physical Address)</label>
                  <input 
                    type="text" 
                    id="reg-address" 
                    placeholder="जैसे: सीतापुरा इंडस्ट्रियल एरिया, जयपुर" 
                    value={shopAddress}
                    onChange={(e) => setShopAddress(e.target.value)}
                    className="w-full h-11 px-3 border border-gray-200 focus:border-[#007bff] rounded-md text-xs text-gray-800 bg-white"
                  />
                </div>

                <div className="flex gap-3 pt-1">
                  <button 
                    type="button" 
                    onClick={() => setSignupStep(2)}
                    className="border border-gray-200 hover:bg-gray-50 text-gray-500 font-bold text-xs py-2.5 px-4 rounded-full flex-1 hover:bg-gray-50 bg-white cursor-pointer"
                  >
                    पीछे
                  </button>
                  <button 
                    type="button" 
                    onClick={handleCompleteProfileSect}
                    className="bg-[#007bff] hover:bg-[#0069d9] text-white font-extrabold text-xs py-2.5 px-4 rounded-full flex-2 flex items-center justify-center gap-1 border-none cursor-pointer"
                  >
                    <span>आगे बढ़ें</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Credential Dispatch overview */}
            {signupStep === 4 && (
              <div className="space-y-4 text-left w-full font-sans">
                <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-150 text-xs text-gray-650 leading-relaxed font-sans max-h-60 overflow-y-auto">
                  <div className="flex justify-between items-center border-b border-gray-200 pb-2 mb-2">
                    <span className="font-extrabold text-blue-600 uppercase tracking-wider text-[10px]">📧 Account Dispatch Letter</span>
                    <span className="text-[10px] text-gray-400">Credential Hub</span>
                  </div>

                  <p>नमस्ते ऑपरेटर <strong className="text-gray-800">{signupName}</strong>,</p>
                  <p className="mt-1">
                    आपका पंजीकरण पूर्ण हो गया है। आपके केंद्र <strong className="text-gray-850">{shopName}</strong> का लाइसेंस सक्रिय कर दिया गया है।
                  </p>
                  <p className="mt-1 font-bold text-gray-700">
                    पिन जेनरेट हो चूका है और आपके Gmail इनबॉक्स में भी प्रेषित हो चूका है:
                  </p>

                  <div className="my-3 p-3 bg-blue-50 border border-dashed border-blue-200 rounded-xl text-center select-all">
                    <div className="text-[10px] text-blue-500 font-bold uppercase tracking-wider">लॉगिन सिक्योर पासवर्ड (PIN CODE)</div>
                    <div className="text-2xl font-black text-blue-600 tracking-widest mt-1 font-mono">{generatedPin}</div>
                    <div className="text-[9px] text-gray-400 mt-0.5">लॉगिन करने के लिए इस पिन कोड का उपयोग करें।</div>
                  </div>

                  <p className="text-[10px] text-gray-400 italic">
                    ✓ नीचे बटन पर क्लिक कर आप सीधे अपने मुख्य वीएलई डैशबोर्ड को खोल सकते हैं।
                  </p>
                </div>

                <button 
                  type="button" 
                  onClick={handleFinalSignupComplete}
                  className="w-full bg-[#34a853] hover:bg-[#2d9348] text-white font-extrabold text-xs py-3 px-4 rounded-full flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-md border-none cursor-pointer"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>लाइसेंस एक्टिवेट करें और लॉगिन करें (Lock & Login)</span>
                </button>
              </div>
            )}

            {/* STEP 5: Setting up database progress */}
            {signupStep === 5 && (
              <div className="flex flex-col items-center gap-3.5 text-center py-4 w-full font-sans animate-fadeIn">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center animate-bounce">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-gray-800">नया खाता स्थापित किया जा रहा है...</h3>
                  <p className="text-xs text-gray-400 max-w-xs mx-auto leading-normal">
                    डिजिटल सेवा हब, बैंकिंग खाता बही, और वीएलई ऑपरेटर क्रेडेंशियल्स सक्रिय किया जा रहा है।
                  </p>
                </div>
                
                <div className="w-full max-w-[260px] h-2 bg-gray-100 rounded-full overflow-hidden mt-1.5 border border-gray-150">
                  <div 
                    style={{ width: `${progress}%` }}
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-300"
                  />
                </div>
                <span className="text-[11px] font-bold text-blue-500 font-mono">{progress}% Ready</span>
              </div>
            )}

            <div className="text-center text-[11px] text-gray-500 border-t border-gray-100 pt-3 select-none font-sans">
              पंजीकृत ऑपरेटर हैं? 
              <button 
                type="button"
                onClick={() => {
                  setActiveCard('login');
                  setPinError(false);
                }}
                className="text-[#007bff] hover:underline ml-1 inline border-none bg-transparent cursor-pointer font-bold p-0 text-xs"
              >
                लॉगिन पैनल पर लौटें
              </button>
            </div>

          </div>
        )}

        {/* BOTTOM SMT SUPPORT INFRASTRUCTURE CONTACT PANEL */}
        <div className="border-t border-gray-100 pt-4 mt-2 select-none">
          <div className="bg-gray-50 border border-gray-150 p-3 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs leading-relaxed text-gray-300 font-sans text-left">
            <div className="space-y-0.5">
              <span className="text-[10px] font-extrabold tracking-wider text-blue-500 uppercase block">HELP & SUPPORT (सहायता केंद्र)</span>
              <p className="text-[10px] text-gray-400 leading-normal">
                लॉगिन अथवा पंजीकरण में समस्या होने पर सीधे संपर्क सूत्र:
              </p>
            </div>
            <div className="flex flex-col gap-1 shrink-0 text-[10px]">
              <div className="flex items-center gap-1.5 text-gray-600 font-semibold">
                <Phone className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>+91 84321 63308 / 91168 18196</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-600 font-semibold">
                <Mail className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>help@smartspe.in</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-400">
                <MapPin className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                <span>Sitapura Ind. Area, Jaipur, RJ</span>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
