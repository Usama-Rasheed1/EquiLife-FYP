import React, { useState, useEffect } from "react";
import AppModal from "./AppModal";
import axios from "axios";
import { Eye, EyeOff, ChevronDown, ChevronUp } from "lucide-react";
import { useDispatch } from 'react-redux';
import { setUserData } from '../store/userSlice';

// small helper to compute age from dob
const calculateAge = (dob) => {
  if (!dob) return undefined;
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const ProfileSettingsModal = ({ isOpen, onClose, userData, onSaved }) => {
  // State
  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [profilePhoto, setProfilePhoto] = useState("/user.jpg");
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [currentPass, setCurrentPass] = useState("");
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const dispatch = useDispatch();

  // Load user data from backend
  useEffect(() => {
    const load = async () => {
      if (!isOpen) return;

      // Always fetch fresh data from backend when modal opens
      // This ensures we have the latest user data from database

      // fetch profile from backend
      try {
        const token = localStorage.getItem("authToken");
        if (!token) return;
        const url = `${import.meta.env.VITE_BACKEND_BASE_URL}/api/auth/profile`;
        const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
        const u = res.data?.user;
        if (u) {
          setFullName(u.fullName || "");
          setGender(u.gender || "");
          setDob(u.dob ? new Date(u.dob).toISOString().slice(0, 10) : "");
          setHeight(u.heightCm ? u.heightCm.toString() : "");
          setWeight(u.weightKg ? u.weightKg.toString() : "");
          // Handle profile photo - could be base64 string or URL
          if (u.profilePhoto) {
            setProfilePhoto(u.profilePhoto.startsWith('data:') ? u.profilePhoto : u.profilePhoto);
          } else {
            setProfilePhoto("/user.jpg");
          }
          // update redux store with fresh values
          try {
            dispatch(setUserData({ fullName: u.fullName, profilePhoto: u.profilePhoto || undefined, weight: u.weightKg || undefined, dob: u.dob || undefined, age: u.age || undefined }));
          } catch (e) {}
        }
      } catch (err) {
        console.error("Load profile error:", err);
      }
    };

    load();
  }, [isOpen]);

  // Upload handler - convert image to base64
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select an image file' });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image size must be less than 5MB' });
      return;
    }

    setUploadingPhoto(true);
    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setProfilePhoto(base64String);
        setProfilePhotoFile(base64String);
        setUploadingPhoto(false);
      };
      reader.onerror = () => {
        setMessage({ type: 'error', text: 'Error reading image file' });
        setUploadingPhoto(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error processing image:', error);
      setMessage({ type: 'error', text: 'Error processing image' });
      setUploadingPhoto(false);
    }
  };

  // Toggle password section
  const togglePasswordSection = () => setPasswordVisible(!passwordVisible);

  // Password validation
  const passwordRequired = newPass.length > 0 || confirmPass.length > 0 || currentPass.length > 0;
  const passwordValid =
    currentPass.length > 0 && 
    newPass.length >= 5 && 
    confirmPass.length >= 5 && 
    newPass === confirmPass;

  // Save button validation
  const canSave =
    fullName.trim() &&
    gender.trim() &&
    dob &&
    height &&
    weight &&
    (!passwordRequired || (passwordRequired && passwordValid));

  // Handle Save
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setMessage(null);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setMessage({ type: 'error', text: 'Not authenticated' });
        setSaving(false);
        return;
      }

      // Save profile information
      const profileUrl = `${import.meta.env.VITE_BACKEND_BASE_URL}/api/auth/profile`;
      const profilePayload = {
        fullName,
        gender: gender ? gender.toLowerCase() : undefined,
        dob: dob || undefined,
        heightCm: height ? Number(height) : undefined,
        weightKg: weight ? Number(weight) : undefined,
        profilePhoto: profilePhotoFile || (profilePhoto && profilePhoto.startsWith('data:image') ? profilePhoto : undefined),
      };
      await axios.put(profileUrl, profilePayload, { headers: { Authorization: `Bearer ${token}` } });

      // Handle password change separately if password fields are filled
      if (passwordRequired && passwordValid) {
        const changePasswordUrl = `${import.meta.env.VITE_BACKEND_BASE_URL}/api/auth/change-password`;
        const passwordPayload = {
          currentPassword: currentPass,
          newPassword: newPass,
        };
        await axios.post(changePasswordUrl, passwordPayload, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        
        // Clear password fields on success
        setCurrentPass("");
        setNewPass("");
        setConfirmPass("");
        setPasswordVisible(false);
        setMessage({ type: 'success', text: 'Profile and password updated successfully' });
      } else {
        setMessage({ type: 'success', text: 'Profile updated' });
      }

      // Reset photo file state after successful save
      setProfilePhotoFile(null);
      
      // update redux store with saved values (only after successful save)
      try {
        dispatch(setUserData({
          fullName,
          profilePhoto,
          weight: weight ? Number(weight) : undefined,
          dob: dob || undefined,
          age: dob ? calculateAge(dob) : undefined,
          heightCm: height ? Number(height) : undefined,
          gender: gender ? gender.toLowerCase() : undefined,
        }));
      } catch (e) {
        // ignore
      }

      // notify parent about updated profile
      try {
        if (typeof onSaved === 'function') {
          onSaved({
            fullName,
            gender: gender ? gender.toLowerCase() : undefined,
            dob: dob || undefined,
            heightCm: height ? Number(height) : undefined,
            weightKg: weight ? Number(weight) : undefined,
            profilePhoto,
          });
        }
      } catch (e) {
        console.error('onSaved callback error:', e);
      }

      // close modal after brief delay
      setTimeout(() => {
        setSaving(false);
        onClose();
      }, 800);
    } catch (err) {
      let msg = err?.response?.data?.message || 'Failed to update profile';
      
      // Check if it's a password change error (incorrect current password, etc)
      if (err?.response?.status === 401 || err?.response?.data?.message?.toLowerCase().includes('password')) {
        msg = 'Incorrect current password or password update failed';
      }
      
      setMessage({ type: 'error', text: msg });
      setSaving(false);
    }
  };

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title="Profile"
      widthClass="max-w-3xl"
    >
      <div className="w-full flex flex-col items-center space-y-5">
        {/* Profile Photo */}
        <div className="relative group cursor-pointer">
          <img
            src={profilePhoto}
            className="w-28 h-28 rounded-full object-cover border"
            alt="Profile"
          />
          <label
            htmlFor="photoUpload"
            className={`absolute inset-0 bg-black/40 text-white text-sm 
                       flex items-center justify-center rounded-full transition-opacity duration-200 cursor-pointer
                       ${uploadingPhoto ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
          >
            {uploadingPhoto ? 'Processing...' : 'Upload'}
          </label>
          <input
            id="photoUpload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoUpload}
            disabled={uploadingPhoto}
          />
        </div>

        {/* Form Grid */}
              <div className="grid grid-cols-2 gap-3 w-full max-w-3xl">
                <div>
                  <label className="text-sm font-medium">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full border rounded-lg p-2"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full border rounded-lg p-2 mt-1 bg-white cursor-pointer"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Date of Birth</label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full border rounded-lg p-2 mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Height (cm)</label>
                  <input
                    type="number"
                    min="1"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="w-full border rounded-lg p-2 mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Weight (kg)</label>
                  <input
                    type="number"
                    min="1"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full border rounded-lg p-2 mt-1"
                  />
                </div>
              </div>

        {/* All fields required */}
        <div className="text-sm text-red-500 w-full max-w-3xl">
          * All fields are required.
        </div>

        {message && (
          <div className={`w-full max-w-3xl text-sm ${message.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
            {message.text}
          </div>
        )}

        {/* Change Password Section */}
        <div className="w-full max-w-3xl">
          <button
            type="button"
            onClick={togglePasswordSection}
            className="w-full flex justify-between items-center bg-gray-100 rounded-lg p-2 font-semibold"
          >
            <span>Change Password</span>
            {passwordVisible ? (
              <ChevronUp size={18} />
            ) : (
              <ChevronDown size={18} />
            )}
          </button>

          {passwordVisible && (
            <div className="grid grid-cols-2 gap-6 mt-3">
              <div className="relative">
                <label className="text-sm font-medium">Current Password</label>
                <input
                  type={showCurrentPass ? "text" : "password"}
                  value={currentPass}
                  onChange={(e) => setCurrentPass(e.target.value)}
                  className="w-full border rounded-lg p-2 mt-1"
                />
                <div
                  className="absolute right-3 top-[34px] cursor-pointer"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                >
                  {showCurrentPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </div>
              </div>

              <div></div>

              <div className="relative">
                <label className="text-sm font-medium">New Password</label>
                <input
                  type={showNewPass ? "text" : "password"}
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  className="w-full border rounded-lg p-2 mt-1"
                />
                <div
                  className="absolute right-3 top-[34px] cursor-pointer"
                  onClick={() => setShowNewPass(!showNewPass)}
                >
                  {showNewPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </div>
                {newPass && newPass.length < 5 && (
                  <p className="text-xs text-red-500 mt-1">
                    Password must be at least 5 characters.
                  </p>
                )}
              </div>

              <div className="relative">
                <label className="text-sm font-medium">Confirm Password</label>
                <input
                  type={showConfirmPass ? "text" : "password"}
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  className="w-full border rounded-lg p-2 mt-1"
                />
                <div
                  className="absolute right-3 top-[34px] cursor-pointer"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                >
                  {showConfirmPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </div>
                {confirmPass && confirmPass !== newPass && (
                  <p className="text-xs text-red-500 mt-1">
                    Passwords do not match.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={!canSave || saving}
          className={`px-6 py-2 rounded-lg text-white font-medium mt-2 ${
            canSave && !saving
              ? "bg-blue-500 hover:bg-blue-600"
              : "bg-gray-300 cursor-not-allowed"
          }`}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </AppModal>
  );
};

export default ProfileSettingsModal;
