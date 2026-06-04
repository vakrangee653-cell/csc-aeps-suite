import React, { useState, useEffect } from 'react';
import { 
  Crown, Users, KeyRound, Mail, ArrowRight, ArrowLeft, 
  ShieldCheck, LockOpen, Send, Camera, Unlock, CheckCircle2, X 
} from 'lucide-react';
import { User } from '../types';
import { getStoredData, setStoredData } from '../utils';

interface AuthOverlayProps {
  onLoginSuccess: (user: User) => void;
  onMockEmailTrigger: (subject: string, body: string) => void;
}

export default function AuthOverlay({ onLoginSuccess, onMockEmailTrigger }: AuthOverlayProps) {
  const [activeCard, setActiveCard] = useState<'login' | 'gmail' | 'signup'>('login');
  const [role, setRole] = useState<'Owner' | 'Staff'>('Owner');
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [shake, setShake] = useState(false);

  // Gmail states
  const [gmailEmail, setGmailEmail] = useState('');
  const [gmailRole, setGmailRole] = useState<'Owner' | 'Staff'>('Owner');
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

  // Get active session and list of users from localStorage
  const getUsers = (): User[] => {
    let users = getStoredData<User[]>('csc_users', []);
    if (users.length === 0) {
      users = [
        { id: "user_owner", name: "Owner / Admin", role: "Owner", pin: "1111", mobile: "+91 98765 43210", email: "owner@gmail.com", status: "active" },
        { id: "user_staff", name: "Staff User", role: "Staff", pin: "2222", mobile: "+91 84321 63308", email: "staff@gmail.com", status: "active" }
      ];
      setStoredData('csc_users', users);
    }
    return users;
  };

  const handlePinSubmit = () => {
    if (!pin) {
      alert('Please enter your security PIN.');
      return;
    }

    const users = getUsers();
    const matched = users.find(u => u.role === role && u.pin === pin);

    if (matched) {
      if (matched.status === 'blocked') {
        alert("Access Denied: Your account/license has been suspended by the platform administrator. Contact support at help@smartspe.in");
        setPin('');
        return;
      }
      onLoginSuccess(matched);
    } else {
      setPinError(true);
      setShake(true);
      setPin('');
      setTimeout(() => setShake(false), 400);
    }
  };

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

    // Trigger simulated notification
    onMockEmailTrigger(
      'Gmail OTP Code - SmartSpe Login',
      `Hello ${matched.name}, your SmartSpe verification code OTP is: ${otp}`
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

    // Generate random 4 digit PIN
    const otpPin = String(Math.floor(1000 + Math.random() * 9000));
    setGeneratedPin(otpPin);
    setSignupStep(2);
    setEnteredPinError(false);

    // Trigger email notify
    onMockEmailTrigger(
      'Account Security PIN - SmartSpe Register',
      `Dear ${signupName}, your auto-generated SmartSpe Password Security PIN is: ${otpPin}`
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

        // Sync and Login
        onLoginSuccess(newUser);
      } else {
        setProgress(currentPrg);
      }
    }, 500);
  };

  return (
    <div id="auth-overlay" className="auth-overlay">
      
      {/* 1. PIN LOGIN VIEW */}
      {activeCard === 'login' && (
        <div id="auth-login-card" className={`auth-card ${shake ? 'shake' : ''}`}>
          <div className="flex justify-center mb-6">
            <div className="p-3 bg-white border border-gray-200 rounded-2xl shadow-sm text-center select-none">
              <span className="text-3xl font-black text-blue-600 block leading-none">Smart</span>
              <span className="text-sm font-bold tracking-widest text-[#06B6D4]">SPE</span>
            </div>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">SmartSpe Suite</h2>
          <p className="auth-subtitle">Secure Access Control Panel</p>

          <div className="auth-role-select">
            <button 
              type="button" 
              className={`role-btn ${role === 'Owner' ? 'active' : ''}`}
              onClick={() => { setRole('Owner'); setPinError(false); }}
            >
              <Crown className="w-5 h-5 mx-auto" />
              <span>Owner / Admin</span>
            </button>
            <button 
              type="button" 
              className={`role-btn ${role === 'Staff' ? 'active' : ''}`}
              onClick={() => { setRole('Staff'); setPinError(false); }}
            >
              <Users className="w-5 h-5 mx-auto" />
              <span>Staff User</span>
            </button>
          </div>

          <div className="auth-pin-section">
            <label htmlFor="auth-pin-input">Enter Security PIN</label>
            <div className="pin-input-container">
              <input 
                type="password" 
                id="auth-pin-input" 
                maxLength={6} 
                placeholder="••••" 
                autoComplete="off" 
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setPinError(false);
                }}
                onKeyDown={(e) => e.key === 'Enter' && handlePinSubmit()}
                className="text-center font-mono placeholder-gray-400 dark:placeholder-gray-600 text-2xl tracking-widest py-3 border border-gray-300 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-gray-900 w-full"
              />
            </div>
            {pinError && (
              <div id="auth-error-msg" className="text-red-500 font-semibold text-xs mt-2">
                Incorrect PIN. Please try again.
              </div>
            )}
          </div>

          <button 
            type="button" 
            onClick={handlePinSubmit}
            className="btn-primary mt-4 py-3 flex items-center justify-center gap-2"
          >
            <KeyRound className="w-4 h-4" />
            Unlock Dashboard
          </button>

          <button 
            type="button" 
            onClick={() => setActiveCard('gmail')}
            className="btn-secondary mt-3 flex items-center justify-center gap-2 w-full py-3"
          >
            <Mail className="w-4 h-4" />
            Login with Gmail OTP
          </button>

          <div className="mt-6 border-t border-gray-100 dark:border-gray-800 pt-4 text-center">
            <span className="text-sm text-gray-500 dark:text-gray-400">New VLE Partner?</span>
            <button 
              onClick={() => {
                setActiveCard('signup');
                setSignupStep(1);
              }}
              className="ml-1 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline inline"
            >
              Register & Setup Profile
            </button>
          </div>
        </div>
      )}

      {/* 2. GMAIL OTP VIEW */}
      {activeCard === 'gmail' && (
        <div id="auth-gmail-card" className={`auth-card ${shake ? 'shake' : ''}`}>
          <div className="flex justify-center mb-6">
            <div className="p-3 bg-white border border-gray-200 rounded-2xl shadow-sm text-center">
              <span className="text-3xl font-black text-blue-600 block leading-none">Smart</span>
              <span className="text-sm font-bold tracking-widest text-[#06B6D4]">SPE</span>
            </div>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Gmail Login</h2>
          <p className="auth-subtitle">Verify Identity with Gmail OTP</p>

          {gmailStep === 1 ? (
            <div className="flex flex-col gap-4 w-full text-left">
              <div className="form-group">
                <label htmlFor="gmail-email">Gmail Address</label>
                <input 
                  type="email" 
                  id="gmail-email" 
                  placeholder="name@gmail.com" 
                  value={gmailEmail}
                  onChange={(e) => setGmailEmail(e.target.value)}
                  className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-xl"
                />
              </div>

              <div className="form-group">
                <label htmlFor="gmail-role-select">Select Verification Role</label>
                <select 
                  id="gmail-role-select"
                  value={gmailRole}
                  onChange={(e) => setGmailRole(e.target.value as 'Owner' | 'Staff')}
                  className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-xl"
                >
                  <option value="Owner">Owner / Admin</option>
                  <option value="Staff">Staff User</option>
                </select>
              </div>

              <button 
                type="button" 
                onClick={handleSendGmailOtp}
                className="btn-primary mt-2 py-3 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send Verification OTP
              </button>

              <button 
                type="button" 
                onClick={() => setActiveCard('login')}
                className="mx-auto text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline mt-2"
              >
                Login with Security PIN
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4 text-center w-full">
              <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Enter 6-Digit OTP</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                A 6-digit verification code has been sent to {gmailEmail}. Check your simulated inbox on the bottom right and input it.
              </p>

              <input 
                type="text" 
                maxLength={6} 
                placeholder="000000" 
                value={gmailEnteredOtp}
                onChange={(e) => {
                  setGmailEnteredOtp(e.target.value);
                  setGmailOtpError(false);
                }}
                className="text-center font-bold text-3xl tracking-widest py-3 border border-gray-300 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-gray-900"
              />
              {gmailOtpError && (
                <div className="text-red-500 font-semibold text-xs -mt-2">
                  Incorrect verification OTP card. Please try again.
                </div>
              )}

              <button 
                type="button" 
                onClick={handleVerifyGmailOtp}
                className="btn-primary mt-2 py-3 flex items-center justify-center gap-2"
              >
                <LockOpen className="w-4 h-4" />
                Verify & Unlock Dashboard
              </button>

              <div className="flex justify-between mt-2 text-xs">
                <button onClick={handleSendGmailOtp} className="text-gray-500 hover:underline">
                  Resend OTP Code
                </button>
                <button onClick={() => setGmailStep(1)} className="text-blue-600 dark:text-blue-400 hover:underline">
                  Back to email
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. SIGNUP WIZARD VIEW */}
      {activeCard === 'signup' && (
        <div id="signup-wizard-card" className="auth-card w-full max-w-lg">
          <div className="wizard-header text-center mb-6">
            <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">VLE Partner Registration</h2>
            <p className="auth-subtitle">Onboarding Setup Wizard</p>

            {/* Stepper Bullets */}
            <div className="wizard-steps-indicator flex justify-center gap-3 mt-4 relative">
              <div className={`wizard-step ${signupStep === 1 ? 'active' : signupStep > 1 ? 'completed' : ''}`}>1</div>
              <div className={`wizard-step ${signupStep === 2 ? 'active' : signupStep > 2 ? 'completed' : ''}`}>2</div>
              <div className={`wizard-step ${signupStep === 3 ? 'active' : signupStep > 3 ? 'completed' : ''}`}>3</div>
              <div className={`wizard-step ${signupStep === 4 ? 'active' : signupStep > 4 ? 'completed' : ''}`}>4</div>
            </div>
          </div>

          {/* STEP 1: Account info */}
          {signupStep === 1 && (
            <div className="flex flex-col gap-4 text-left w-full mt-2">
              <div className="form-group">
                <label htmlFor="reg-name">Full Name</label>
                <input 
                  type="text" 
                  id="reg-name" 
                  placeholder="Ramesh Kumar" 
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-xl"
                />
              </div>

              <div className="form-group">
                <label htmlFor="reg-mobile">Mobile Number</label>
                <input 
                  type="text" 
                  id="reg-mobile" 
                  placeholder="9876543210" 
                  value={signupMobile}
                  onChange={(e) => setSignupMobile(e.target.value)}
                  className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-xl"
                />
              </div>

              <div className="form-group">
                <label htmlFor="reg-email">Email Address</label>
                <input 
                  type="email" 
                  id="reg-email" 
                  placeholder="partner@gmail.com" 
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-xl"
                />
              </div>

              <button 
                type="button" 
                onClick={handleSignupNext1}
                className="btn-primary mt-4 py-3 flex items-center justify-center gap-2"
              >
                Get Password PIN
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center text-sm font-semibold text-gray-500 mt-2">
                Already registered? 
                <button 
                  onClick={() => setActiveCard('login')}
                  className="text-blue-600 dark:text-blue-400 hover:underline ml-1 inline"
                >
                  Log In
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Verification code */}
          {signupStep === 2 && (
            <div className="flex flex-col gap-4 text-center w-full mt-2">
              <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Verify Your Simulated OTP PIN</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                A 4-digit code was sent to {signupEmail}. View the slide-in box on the bottom right of the screen and enter the code below.
              </p>

              <input 
                type="password" 
                maxLength={4} 
                placeholder="••••" 
                value={enteredPin}
                onChange={(e) => {
                  setEnteredPin(e.target.value);
                  setEnteredPinError(false);
                }}
                className="text-center font-bold text-3xl tracking-widest py-3 border border-gray-300 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-gray-900 w-32 mx-auto"
              />
              {enteredPinError && (
                <div className="text-red-500 font-semibold text-xs">
                  Incorrect verification PIN. Please rechecked.
                </div>
              )}

              <div className="flex gap-4 mt-4 w-full">
                <button 
                  type="button" 
                  onClick={() => setSignupStep(1)}
                  className="btn-secondary w-1/3 flex items-center justify-center gap-2 py-3"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button 
                  type="button" 
                  onClick={handleVerifySignupPin}
                  className="btn-primary w-2/3 flex items-center justify-center gap-2 py-3"
                >
                  Verify Code
                  <ShieldCheck className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Business Information */}
          {signupStep === 3 && (
            <div className="flex flex-col gap-4 text-left w-full mt-2">
              <div className="flex items-center gap-4 border-b border-gray-100 dark:border-gray-800 pb-4 mb-2">
                <div className="relative w-16 h-16">
                  <img 
                    id="signup-profile-preview" 
                    src={photoBase64} 
                    alt="Preview" 
                    className="w-16 h-16 rounded-full object-cover border-2 border-blue-600"
                  />
                  <label 
                    htmlFor="signup-photo-upload" 
                    className="absolute bottom-0 right-0 w-6 h-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center cursor-pointer border border-white"
                  >
                    <Camera className="w-3 h-3" />
                  </label>
                  <input 
                    type="file" 
                    id="signup-photo-upload" 
                    accept="image/*" 
                    onChange={handlePhotoUpload} 
                    className="hidden" 
                  />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-950 dark:text-white">Profile Photo</h4>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Upload central store logo / picture</p>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="reg-shop">Shop / Center Name</label>
                <input 
                  type="text" 
                  id="reg-shop" 
                  placeholder="APNA DIGITAL CSC CENTER" 
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-xl"
                />
              </div>

              <div className="form-group">
                <label htmlFor="reg-address">Shop Physical Address</label>
                <input 
                  type="text" 
                  id="reg-address" 
                  placeholder="Main Market Gali No 2, Jaipur, Rajasthan" 
                  value={shopAddress}
                  onChange={(e) => setShopAddress(e.target.value)}
                  className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-xl"
                />
              </div>

              <div className="flex gap-4 mt-4 w-full">
                <button 
                  type="button" 
                  onClick={() => setSignupStep(2)}
                  className="btn-secondary w-1/3 flex items-center justify-center gap-2 py-3"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button 
                  type="button" 
                  onClick={handleCompleteProfileSect}
                  className="btn-primary w-2/3 flex items-center justify-center gap-2 py-3"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Welcome letter style */}
          {signupStep === 4 && (
            <div className="flex flex-col gap-4 text-left w-full mt-2">
              <div className="mock-email-container bg-gray-50 dark:bg-gray-900/60 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 font-sans text-sm leading-relaxed text-gray-800 dark:text-gray-300 select-none overflow-y-auto max-h-72">
                <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-800 pb-3 mb-4">
                  <span className="font-bold text-blue-600 dark:text-blue-400">📧 Welcome to SmartSpe CSC!</span>
                  <span className="text-xs text-gray-400">Inbox</span>
                </div>
                <p>Dear <strong className="text-gray-950 dark:text-white">{signupName}</strong>,</p>
                <p className="mt-2">
                  Welcome to <strong>SmartSpe CSC Suite</strong>. Your digital services shop, 
                  <strong className="text-gray-950 dark:text-white"> {shopName}</strong>, is now ready for launch.
                </p>
                <p className="mt-2">Your default password credential is outlined below. Please store it securely:</p>
                
                <div className="my-4 p-4 border border-dashed border-blue-500 bg-blue-500/5 rounded-xl text-center">
                  <div className="text-xs text-blue-500 font-bold uppercase tracking-widest">Authentication PIN</div>
                  <div className="text-3xl font-black text-blue-600 dark:text-blue-400 mt-2 tracking-widest">{generatedPin}</div>
                </div>

                <p className="mt-2">
                  Use this PIN to login to the system. You are now fully empowered to run Aadhaar alignment sheets, print beautiful Marriage biodatas, and track your ledger transactions easily.
                </p>
                <p className="mt-4 border-t border-gray-100 dark:border-gray-800 pt-3 text-xs text-gray-400">
                  Best Regards,<br />SmartSpe Technical Team
                </p>
              </div>

              <button 
                type="button" 
                onClick={handleFinalSignupComplete}
                className="btn-primary mt-2 py-3 flex items-center justify-center gap-2"
              >
                <Unlock className="w-4 h-4" />
                Lock Dashboard & Enter
              </button>
            </div>
          )}

          {/* STEP 5: Loading Progress layout */}
          {signupStep === 5 && (
            <div className="flex flex-col items-center gap-4 text-center py-8 w-full">
              <div className="animate-bounce">
                <CheckCircle2 className="w-16 h-16 text-emerald-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Starting Security Sync</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                Generating secure local registers, seeding defaults, and compiling widgets.
              </p>
              
              <div className="w-full max-w-xs h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mt-4">
                <div 
                  style={{ width: `${progress}%` }}
                  className="h-full bg-gradient-to-r from-blue-600 to-[#06B6D4] transition-all duration-300"
                />
              </div>
              <span className="text-xs font-mono font-black text-blue-500">{progress}% Connected</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
