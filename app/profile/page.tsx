"use client";

import { useEffect, useState } from "react";
import LocationPicker from "@/components/LocationPicker";

type Address = {
  id: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pincode: string;
  district?: string;
  country?: string;
  is_default: boolean;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isAddressListOpen, setIsAddressListOpen] = useState(true);
  
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [savingAddress, setSavingAddress] = useState(false);
  
  const [addressForm, setAddressForm] = useState({
    first_name: "", last_name: "", phone: "", address_line1: "",
    address_line2: "", city: "", state: "", pincode: "", district: "", country: "India", set_default: false
  });

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: "", phone: ""
  });

  useEffect(() => {
    fetchProfile();
    fetchAddresses();
  }, []);

  async function fetchProfile() {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const json = await res.json();
        setProfile(json.data);
        setProfileForm({
          full_name: json.data?.full_name || "",
          phone: json.data?.phone || ""
        });
      }
    } catch (err) {
      console.error("Profile fetch error:", err);
    }
  }

  async function fetchAddresses() {
    try {
      const res = await fetch("/api/addresses");
      if (res.ok) {
        const json = await res.json();
        setAddresses(json.data ?? []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile() {
    if (!profileForm.full_name?.trim()) {
      return alert("Full name is required.");
    }

    setSavingProfile(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileForm),
      });

      const result = await res.json();
      if (result.success) {
        setProfile((prev: any) => ({
          ...prev,
          full_name: result.data.full_name,
          phone: result.data.phone
        }));
        setIsEditingProfile(false);
      } else {
        alert("Error: " + result.error);
      }
    } catch (error) {
      alert("Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  }

  function cancelEditProfile() {
    setProfileForm({
      full_name: profile?.full_name || "",
      phone: profile?.phone || ""
    });
    setIsEditingProfile(false);
  }

  function handleEditAddress(addr: Address) {
    const nameParts = addr.full_name.split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    setAddressForm({
      first_name: firstName,
      last_name: lastName,
      phone: addr.phone,
      address_line1: addr.address_line1,
      address_line2: addr.address_line2 || "",
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      district: addr.district || "",
      country: addr.country || "India",
      set_default: addr.is_default
    });
    setEditingAddressId(addr.id);
    setShowAddAddress(true);
    if (!isAddressListOpen) setIsAddressListOpen(true);
  }

  function openNewAddressForm() {
    setAddressForm({ 
      first_name: "", last_name: "", phone: "", address_line1: "", 
      address_line2: "", city: "", state: "", pincode: "", district: "", country: "India", set_default: false 
    });
    setEditingAddressId(null);
    setShowAddAddress(true);
    if (!isAddressListOpen) setIsAddressListOpen(true);
  }

  function closeAddressForm() {
    setShowAddAddress(false);
    setEditingAddressId(null);
  }

  async function saveAddress(e: React.FormEvent) {
    e.preventDefault();
    if (!addressForm.first_name || !addressForm.phone || !addressForm.address_line1 || !addressForm.city) {
      return alert("Please fill all required fields.");
    }
    
    setSavingAddress(true);
    const endpoint = editingAddressId ? `/api/addresses/${editingAddressId}` : "/api/addresses";
    const method = editingAddressId ? "PUT" : "POST";

    const full_name = `${addressForm.first_name} ${addressForm.last_name}`.trim();

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name,
          phone: addressForm.phone,
          address_line1: addressForm.address_line1,
          address_line2: addressForm.address_line2,
          city: addressForm.city,
          state: addressForm.state,
          pincode: addressForm.pincode,
          district: addressForm.district,
          country: addressForm.country
        }),
      });

      const result = await res.json();
      if (result.success) {
        if (addressForm.set_default && !result.data.is_default) {
           await setDefault(result.data.id);
        }

        if (editingAddressId) {
          setAddresses((prev) => prev.map((a) => (a.id === editingAddressId ? { ...result.data, is_default: addressForm.set_default } : a)));
        } else {
          if (addressForm.set_default) {
             fetchAddresses();
          } else {
             setAddresses((prev) => [result.data, ...prev]);
          }
        }
        closeAddressForm();
      } else {
        alert("Error: " + result.error);
      }
    } catch (error) {
      alert("Failed to save address.");
    } finally {
      setSavingAddress(false);
    }
  }

  async function setDefault(id: string) {
    try {
      const res = await fetch(`/api/addresses/${id}`, { method: "PATCH" });
      if (res.ok) {
        setAddresses((prev) => prev.map((a) => ({ ...a, is_default: a.id === id })));
      }
    } catch (err) {
      alert("Failed to set default address.");
    }
  }

  async function deleteAddress(id: string) {
    if (!confirm("Are you sure you want to delete this address?")) return;
    try {
      const res = await fetch(`/api/addresses/${id}`, { method: "DELETE" });
      if (res.ok) {
        setAddresses((prev) => prev.filter((a) => a.id !== id));
      }
    } catch (err) {
      alert("Failed to delete address.");
    }
  }

  const displayName = profile?.full_name?.split(' ')[0] || profile?.email?.split('@')[0] || "User";
  const isVerified = Boolean(profile?.full_name?.trim() && profile?.phone?.trim());
  const joinDate = profile?.created_at 
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) 
    : 'New';

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <main className="max-w-[1100px] mx-auto px-4 py-8">
        
        {/* PAGE HEADER */}
        <div className="mb-8 flex items-start gap-4">
          <a 
            href="/" 
            title="Back to Home"
            className="mt-1 flex-shrink-0 inline-flex items-center justify-center w-10 h-10 bg-white border border-gray-200 rounded-full text-gray-500 hover:text-amber-800 hover:border-amber-300 hover:bg-amber-50 transition-colors shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </a>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
            <p className="text-gray-500 mt-1">Manage your Orders, Addresses, Personal Info</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* LEFT SIDEBAR */}
          <div className="w-full lg:w-[320px] flex-shrink-0 flex flex-col gap-6">
            
            <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 flex items-center gap-4">
                <div className="w-16 h-16 bg-amber-50 text-amber-800 rounded-full flex items-center justify-center font-bold text-2xl uppercase border border-amber-100 shadow-inner flex-shrink-0">
                  {displayName.charAt(0)}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Welcome</p>
                  <h2 className="font-bold text-lg text-gray-900 truncate">{displayName}</h2>
                </div>
              </div>

              <div className="grid grid-cols-2 divide-x divide-gray-100 border-t border-gray-100 bg-gray-50/50">
                <div className="py-5 px-2 flex flex-col items-center justify-center text-center gap-1.5 cursor-default">
                  <span className="text-sm font-bold text-gray-900 leading-none">{joinDate}</span>
                  <span className="text-[11px] text-gray-500 font-bold uppercase tracking-widest">Joined</span>
                </div>
                
                <div className="py-5 px-2 flex flex-col items-center justify-center text-center gap-1.5 cursor-default">
                  {isVerified ? (
                    <>
                      <svg className="w-5 h-5 text-blue-500 drop-shadow-[0_0_6px_rgba(59,130,246,0.6)]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-[11px] text-blue-600 font-bold uppercase tracking-widest">Verified</span>
                    </>
                  ) : (
                    <>
                      <span className="text-xl font-bold text-gray-400 leading-none">-</span>
                      <span className="text-[11px] text-gray-500 font-bold uppercase tracking-widest">Pending</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
              <div className="flex-grow">
                <a href="/orders" className="flex items-center gap-4 px-5 py-4 text-gray-600 hover:text-amber-800 hover:bg-amber-50 transition-colors w-full text-left font-medium border-b border-gray-100">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                  My Orders
                </a>
                <a href="/cart" className="flex items-center gap-4 px-5 py-4 text-gray-600 hover:text-amber-800 hover:bg-amber-50 transition-colors w-full text-left font-medium border-b border-gray-100">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  My Cart
                </a>
                <div className="flex items-center gap-4 px-5 py-4 text-amber-800 font-bold bg-amber-50/50 border-l-4 border-amber-800">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  Profile & Addresses
                </div>
              </div>

              <button className="flex items-center gap-4 px-5 py-4 text-gray-500 hover:text-red-600 w-full text-left font-medium bg-gray-50 hover:bg-red-50 border-t border-gray-100 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                Logout
              </button>
            </div>
          </div>

          {/* RIGHT MAIN CONTENT */}
          <div className="flex-1 space-y-8">
            
            {/* Personal Information Box */}
            <div className="bg-white rounded-md shadow-sm border border-gray-200 p-6 sm:p-8 relative">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  Personal Information
                </h2>
                {!isEditingProfile ? (
                  <button 
                    onClick={() => setIsEditingProfile(true)} 
                    className="text-amber-800 text-sm font-bold hover:underline uppercase tracking-wide"
                  >
                    Edit
                  </button>
                ) : (
                  <button 
                    onClick={cancelEditProfile} 
                    className="text-gray-500 text-sm font-bold hover:text-gray-800 uppercase tracking-wide"
                  >
                    Cancel
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Full Name</label>
                  {isEditingProfile ? (
                    <input 
                      type="text" 
                      value={profileForm.full_name} 
                      onChange={(e) => setProfileForm({...profileForm, full_name: e.target.value})}
                      className="w-full bg-white border border-amber-700 text-gray-900 text-sm rounded-sm px-4 py-3 outline-none focus:ring-1 focus:ring-amber-700 shadow-sm transition-all" 
                    />
                  ) : (
                    <input 
                      type="text" 
                      value={profile?.full_name || "Not provided"} 
                      disabled 
                      className="w-full bg-gray-50 border border-gray-200 text-gray-900 font-medium text-sm rounded-sm px-4 py-3 outline-none cursor-not-allowed" 
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Email Address</label>
                  <input 
                    type="text" 
                    value={profile?.email || "Loading..."} 
                    disabled 
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 font-medium text-sm rounded-sm px-4 py-3 outline-none cursor-not-allowed" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Phone Number</label>
                  {isEditingProfile ? (
                    <input 
                      type="text" 
                      value={profileForm.phone} 
                      onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                      className="w-full bg-white border border-amber-700 text-gray-900 text-sm rounded-sm px-4 py-3 outline-none focus:ring-1 focus:ring-amber-700 shadow-sm transition-all" 
                    />
                  ) : (
                    <input 
                      type="text" 
                      value={profile?.phone || "Not provided"} 
                      disabled 
                      className="w-full bg-gray-50 border border-gray-200 text-gray-900 font-medium text-sm rounded-sm px-4 py-3 outline-none cursor-not-allowed" 
                    />
                  )}
                </div>
              </div>

              {isEditingProfile && (
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <button 
                    onClick={saveProfile}
                    disabled={savingProfile}
                    className={`px-8 py-3 rounded-sm font-bold text-white tracking-wide transition-all ${
                      savingProfile ? "bg-amber-400 cursor-not-allowed" : "bg-amber-800 hover:bg-amber-900 shadow-sm"
                    }`}
                  >
                    {savingProfile ? "SAVING..." : "SAVE CHANGES"}
                  </button>
                </div>
              )}
            </div>

            {/* Manage Addresses Dropdown Box */}
            <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden">
              <button 
                onClick={() => setIsAddressListOpen(!isAddressListOpen)}
                className="w-full flex justify-between items-center p-6 border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  Manage Addresses
                  <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded ml-2">
                    {addresses.length}
                  </span>
                </h2>
                <svg className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${isAddressListOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <div className={`transition-all duration-300 ease-in-out ${isAddressListOpen ? 'opacity-100 max-h-auto' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                <div className="p-6 sm:p-8 space-y-6">
                  {!showAddAddress && (
                    <button 
                      onClick={openNewAddressForm}
                      className="w-full border border-gray-300 rounded-lg p-4 flex items-center justify-center gap-3 text-amber-800 font-bold hover:bg-amber-50 hover:border-amber-600 transition-colors text-sm"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      ADD A NEW ADDRESS
                    </button>
                  )}

                  {showAddAddress && (
                    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm relative">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-gray-900 font-bold text-xl">
                          {editingAddressId ? "Edit address" : "Add address"}
                        </h3>
                        <button onClick={closeAddressForm} className="text-gray-400 hover:text-gray-800 transition-colors">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      <form onSubmit={saveAddress} className="space-y-4">
                        
                        {/* Country / Region */}
                        <div className="relative mt-4">
                          <label className="absolute top-2 left-3 text-[10px] font-bold text-gray-500">Country/region</label>
                          <select 
                            value={addressForm.country} 
                            onChange={e => setAddressForm({...addressForm, country: e.target.value})} 
                            className="w-full pt-6 pb-2 px-3 rounded-lg border border-gray-300 focus:border-amber-700 focus:ring-1 focus:ring-amber-700 outline-none text-sm bg-white text-gray-900 appearance-none cursor-pointer"
                          >
                            <option value="India">India</option>
                            <option value="United States">United States</option>
                            <option value="United Kingdom">United Kingdom</option>
                            <option value="Canada">Canada</option>
                            <option value="Australia">Australia</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                          </div>
                        </div>

                        {/* First Name & Last Name */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="relative">
                            <input required value={addressForm.first_name} onChange={e => setAddressForm({...addressForm, first_name: e.target.value})} className="peer w-full pt-5 pb-2 px-3 rounded-lg border border-gray-300 focus:border-amber-700 focus:ring-1 focus:ring-amber-700 outline-none text-sm bg-white text-gray-900 placeholder-transparent" placeholder="First name" id="first_name" />
                            <label htmlFor="first_name" className="absolute left-3 top-2 text-[10px] font-medium text-gray-500 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-amber-800">First name</label>
                          </div>
                          <div className="relative">
                            <input required value={addressForm.last_name} onChange={e => setAddressForm({...addressForm, last_name: e.target.value})} className="peer w-full pt-5 pb-2 px-3 rounded-lg border border-gray-300 focus:border-amber-700 focus:ring-1 focus:ring-amber-700 outline-none text-sm bg-white text-gray-900 placeholder-transparent" placeholder="Last name" id="last_name" />
                            <label htmlFor="last_name" className="absolute left-3 top-2 text-[10px] font-medium text-gray-500 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-amber-800">Last name</label>
                          </div>
                        </div>

                        {/* Address Line 1 & GPS Auto-fill Button */}
                        <div className="relative flex items-center">
                          <input required value={addressForm.address_line1} onChange={e => setAddressForm({...addressForm, address_line1: e.target.value})} className="peer w-full pt-5 pb-2 pl-3 pr-[85px] rounded-lg border border-gray-300 focus:border-amber-700 focus:ring-1 focus:ring-amber-700 outline-none text-sm bg-white text-gray-900 placeholder-transparent" placeholder="Address" id="address_line1" />
                          <label htmlFor="address_line1" className="absolute left-3 top-2 text-[10px] font-medium text-gray-500 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-amber-800">Address</label>
                          
                          {/* GPS Button container safely nested right inside the input field */}
                          <div className="absolute right-1.5 z-10">
                            <LocationPicker 
                              onSelect={(loc) => setAddressForm(prev => ({
                                ...prev, 
                                city: loc.city || prev.city, 
                                state: loc.state || prev.state, 
                                pincode: loc.pincode || prev.pincode, 
                                district: loc.district || prev.district
                              }))} 
                            />
                          </div>
                        </div>

                        {/* Address Line 2 */}
                        <div className="relative">
                          <input value={addressForm.address_line2} onChange={e => setAddressForm({...addressForm, address_line2: e.target.value})} className="peer w-full pt-5 pb-2 px-3 rounded-lg border border-gray-300 focus:border-amber-700 focus:ring-1 focus:ring-amber-700 outline-none text-sm bg-white text-gray-900 placeholder-transparent" placeholder="Apartment, suite, etc (optional)" id="address_line2" />
                          <label htmlFor="address_line2" className="absolute left-3 top-2 text-[10px] font-medium text-gray-500 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-amber-800">Apartment, suite, etc (optional)</label>
                        </div>

                        {/* City, State, Pincode */}
                        <div className="grid grid-cols-3 gap-4">
                          <div className="relative">
                            <input required value={addressForm.city} onChange={e => setAddressForm({...addressForm, city: e.target.value})} className="peer w-full pt-5 pb-2 px-3 rounded-lg border border-gray-300 focus:border-amber-700 focus:ring-1 focus:ring-amber-700 outline-none text-sm bg-white text-gray-900 placeholder-transparent" placeholder="City" id="city" />
                            <label htmlFor="city" className="absolute left-3 top-2 text-[10px] font-medium text-gray-500 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-amber-800">City</label>
                          </div>
                          <div className="relative">
                            <input required value={addressForm.state} onChange={e => setAddressForm({...addressForm, state: e.target.value})} className="peer w-full pt-5 pb-2 px-3 rounded-lg border border-gray-300 focus:border-amber-700 focus:ring-1 focus:ring-amber-700 outline-none text-sm bg-white text-gray-900 placeholder-transparent" placeholder="State" id="state" />
                            <label htmlFor="state" className="absolute left-3 top-2 text-[10px] font-medium text-gray-500 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-amber-800">State</label>
                          </div>
                          <div className="relative">
                            <input required value={addressForm.pincode} onChange={e => setAddressForm({...addressForm, pincode: e.target.value})} className="peer w-full pt-5 pb-2 px-3 rounded-lg border border-gray-300 focus:border-amber-700 focus:ring-1 focus:ring-amber-700 outline-none text-sm bg-white text-gray-900 placeholder-transparent" placeholder="PIN code" id="pincode" />
                            <label htmlFor="pincode" className="absolute left-3 top-2 text-[10px] font-medium text-gray-500 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-amber-800">PIN code</label>
                          </div>
                        </div>

                        {/* Phone Number with Flag */}
                        <div className="relative flex items-center border border-gray-300 rounded-lg focus-within:border-amber-700 focus-within:ring-1 focus-within:ring-amber-700 overflow-hidden bg-white">
                           <div className="flex items-center justify-center pl-3 pr-2 border-r border-gray-300 bg-gray-50 py-3.5 gap-2">
                              {/* Custom SVG India Flag */}
                              <svg width="20" height="15" viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg" className="border border-gray-200">
                                <rect width="300" height="66.66" fill="#FF9933"/>
                                <rect y="66.66" width="300" height="66.66" fill="#FFFFFF"/>
                                <rect y="133.33" width="300" height="66.66" fill="#138808"/>
                                <circle cx="150" cy="100" r="24" fill="#000080" />
                                <circle cx="150" cy="100" r="18" fill="#FFF" />
                                <circle cx="150" cy="100" r="15" fill="#000080" />
                              </svg>
                              <span className="text-sm font-medium text-gray-700">+91</span>
                           </div>
                           <div className="relative flex-1">
                              <input required value={addressForm.phone} onChange={e => setAddressForm({...addressForm, phone: e.target.value})} className="peer w-full pt-5 pb-1 px-3 outline-none text-sm text-gray-900 placeholder-transparent bg-transparent" placeholder="Phone" id="phone" />
                              <label htmlFor="phone" className="absolute left-3 top-1.5 text-[10px] font-medium text-gray-500 transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-amber-800">Phone</label>
                           </div>
                        </div>

                        {/* Set as Default Checkbox */}
                        <div className="flex items-center pt-2 pb-4">
                          <input 
                            type="checkbox" 
                            id="set_default" 
                            checked={addressForm.set_default}
                            onChange={(e) => setAddressForm({...addressForm, set_default: e.target.checked})}
                            className="w-4 h-4 text-amber-700 bg-white border-gray-300 rounded focus:ring-amber-600 cursor-pointer"
                          />
                          <label htmlFor="set_default" className="ml-2 text-sm text-gray-700 cursor-pointer">
                            This is my default address
                          </label>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-4 pt-4">
                          <button type="button" onClick={closeAddressForm} className="px-6 py-2.5 rounded-md font-bold text-amber-800 text-sm hover:bg-amber-50 transition-colors">
                            Cancel
                          </button>
                          <button type="submit" disabled={savingAddress} className={`px-6 py-2.5 rounded-md font-bold text-white tracking-wide text-sm transition-colors ${
                            savingAddress ? "bg-amber-400 cursor-not-allowed" : "bg-amber-700 hover:bg-amber-800 shadow-sm"
                          }`}>
                            {savingAddress ? "Saving..." : "Save"}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Address List */}
                  {loading ? (
                    <div className="animate-pulse space-y-4 pt-2">
                      <div className="h-24 bg-gray-100 rounded-sm w-full"></div>
                      <div className="h-24 bg-gray-100 rounded-sm w-full"></div>
                    </div>
                  ) : addresses.length === 0 ? (
                    <div className="text-center py-10 bg-gray-50 border border-dashed border-gray-200 rounded-sm mt-2">
                      <p className="text-gray-500 font-medium text-sm">No addresses saved yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-4 mt-2">
                      {addresses.map((addr) => (
                        <div key={addr.id} className={`p-6 hover:shadow-md transition-shadow bg-white relative group border rounded-lg ${addr.is_default ? 'border-amber-600 shadow-sm' : 'border-gray-200'}`}>
                          
                          <div className="absolute top-6 right-6 flex items-center gap-5">
                             {!addr.is_default && (
                              <button onClick={() => setDefault(addr.id)} className="text-[10px] font-bold text-amber-700 hover:underline uppercase tracking-wide hidden sm:block">
                                Make Default
                              </button>
                            )}
                            <button onClick={() => handleEditAddress(addr)} className="text-gray-400 hover:text-amber-800 transition-colors">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            </button>
                            <button onClick={() => deleteAddress(addr.id)} className="text-gray-400 hover:text-red-600 transition-colors">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>

                          <div className="flex items-center gap-2 mb-3">
                            {addr.is_default && (
                              <span className="text-amber-800 text-[10px] font-bold px-2 py-0.5 border border-amber-200 bg-amber-50 rounded-sm tracking-widest">
                                DEFAULT
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-4 mb-2">
                            <h3 className="font-bold text-gray-900">{addr.full_name}</h3>
                          </div>
                          
                          <div className="text-sm text-gray-600 leading-relaxed pr-16">
                            <span className="font-medium text-gray-800">{addr.address_line1}</span>
                            {addr.address_line2 && <>, {addr.address_line2}</>}
                            <br/>{addr.city}{addr.district && `, ${addr.district}`}, {addr.state} {addr.pincode}
                            <br/><span className="text-gray-500">{addr.country || 'India'}</span>
                            <br/><span className="font-medium mt-1 inline-block">+91 {addr.phone}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}