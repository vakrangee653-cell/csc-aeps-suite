import React, { useState, useEffect } from 'react';
import { User as UserIcon, Store, Phone, Mail, MapPin, Camera, Save } from 'lucide-react';

export default function Profile() {
  const [fullname, setFullname] = useState('Aarav Sharma');
  const [retailerId, setRetailerId] = useState('CSC98765432');
  const [shopName, setShopName] = useState('Aarav Digital Center');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [email, setEmail] = useState('aarav.csc@gmail.com');
  const [address, setAddress] = useState('Main Market, Jaipur, Rajasthan');
  const [photo, setPhoto] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop');

  const loadProfile = () => {
    const storedName = localStorage.getItem('csc_profile_name');
    const storedId = localStorage.getItem('csc_profile_retailer_id');
    const storedShopName = localStorage.getItem('csc_profile_shop_name');
    const storedPhone = localStorage.getItem('csc_profile_phone');
    const storedEmail = localStorage.getItem('csc_profile_email');
    const storedAddress = localStorage.getItem('csc_profile_address');
    const storedPhoto = localStorage.getItem('csc_profile_photo');

    if (storedName) setFullname(storedName);
    if (storedId) setRetailerId(storedId);
    if (storedShopName) setShopName(storedShopName);
    if (storedPhone) setPhone(storedPhone);
    if (storedEmail) setEmail(storedEmail);
    if (storedAddress) setAddress(storedAddress);
    if (storedPhoto) setPhoto(storedPhoto);
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please choose an image file.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const b64 = event.target.result as string;
          setPhoto(b64);
          localStorage.setItem('csc_profile_photo', b64);
          alert('Profile picture uploaded successfully!');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullname || !shopName) {
      alert('Name and Shop Name cannot be blank.');
      return;
    }

    localStorage.setItem('csc_profile_name', fullname);
    localStorage.setItem('csc_profile_retailer_id', retailerId);
    localStorage.setItem('csc_profile_shop_name', shopName);
    localStorage.setItem('csc_profile_phone', phone);
    localStorage.setItem('csc_profile_email', email);
    localStorage.setItem('csc_profile_address', address);

    alert('Your profile and shop credentials have been successfully updated in cache registries!');
    window.location.reload();
  };

  return (
    <div className="flex flex-col gap-5">
      
      <div className="panel-header">
        <h2 className="panel-title">
          <UserIcon className="w-5 h-5 shrink-0" />
          My Store & Business Profile
        </h2>
      </div>

      <div className="flex flex-col gap-6">
        
        {/* CARD ROW PROFILE DISPLAY */}
        <div className="profile-header-card bg-white dark:bg-slate-900/40 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row items-center gap-6 select-none shadow-sm">
          <div className="profile-avatar-wrapper relative shrink-0">
            <img 
              id="profile-display-photo" 
              src={photo} 
              alt="Avatar" 
              className="w-28 h-28 rounded-full object-cover border-4 border-blue-600 shadow"
            />
            <label 
              htmlFor="profile-avatar-uploader" 
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center border-2 border-white dark:border-slate-900 cursor-pointer shadow"
              title="Upload new picture"
            >
              <Camera className="w-4 h-4" />
            </label>
            <input 
              type="file" 
              id="profile-avatar-uploader" 
              accept="image/*" 
              onChange={handlePhotoUpload} 
              className="hidden" 
            />
          </div>

          <div className="profile-header-info text-left">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white" id="profile-display-name">
                {fullname}
              </h1>
              <span className="badge badge-primary font-mono text-sm uppercase tracking-wider font-extrabold" id="profile-display-id">
                {retailerId}
              </span>
            </div>

            <div className="flex flex-col gap-2 mt-3 text-xs md:text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-blue-500 text-center uppercase" />
                <span id="profile-display-store">{shopName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-blue-500" />
                <span id="profile-display-phone">{phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-500" />
                <span id="profile-display-email">{email}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-500" />
                <span id="profile-display-addr">{address}</span>
              </div>
            </div>
          </div>
        </div>

        {/* PROFILE EDIT FORM CARD */}
        <div className="config-card">
          <h3 className="font-bold border-b border-gray-100 dark:border-gray-800 pb-2">Edit Store Front Details</h3>
          
          <form onSubmit={handleProfileSave} className="flex flex-col gap-4 mt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-group">
                <label>VLE Full Name</label>
                <input 
                  type="text" 
                  value={fullname} 
                  onChange={(e) => setFullname(e.target.value)} 
                  required 
                  className="p-2.5 border rounded-lg bg-gray-50 dark:bg-gray-900"
                />
              </div>
              <div className="form-group">
                <label>Retailer / CSC Agency ID</label>
                <input 
                  type="text" 
                  value={retailerId} 
                  onChange={(e) => setRetailerId(e.target.value)} 
                  required 
                  className="p-2.5 border rounded-lg bg-gray-50 dark:bg-gray-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-group">
                <label>Agency Shop / Center Name</label>
                <input 
                  type="text" 
                  value={shopName} 
                  onChange={(e) => setShopName(e.target.value)} 
                  required 
                  className="p-2.5 border rounded-lg bg-gray-50 dark:bg-gray-900"
                />
              </div>
              <div className="form-group">
                <label>Agency Contact Phone</label>
                <input 
                  type="text" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                  className="p-2.5 border rounded-lg bg-gray-50 dark:bg-gray-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-group">
                <label>Gmail Contact Email</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  className="p-2.5 border rounded-lg bg-gray-50 dark:bg-gray-900"
                />
              </div>
              <div className="form-group">
                <label>Shop Ward / Address</label>
                <input 
                  type="text" 
                  value={address} 
                  onChange={(e) => setAddress(e.target.value)} 
                  className="p-2.5 border rounded-lg bg-gray-50 dark:bg-gray-900"
                />
              </div>
            </div>

            <button type="submit" className="btn-primary flex items-center justify-center gap-2 max-w-xs py-3.5 mt-2 shadow">
              <Save className="w-5 h-5 shrink-0" />
              Save Stores Profile Details
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
