import React, { useState, useEffect } from "react";
import AppModal from "./AppModal";
import { Eye, EyeOff, ChevronDown, ChevronUp } from "lucide-react";

const ProfileSettingsModal = ({ isOpen, onClose, userData }) => {
  // State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [profilePhoto, setProfilePhoto] = useState("/user.jpg");

  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  // Load user data from backend
  useEffect(() => {
    if (userData) {
      setFullName(userData.fullName || "");
      setEmail(userData.email || "");
      setGender(userData.gender || "");
      setDob(userData.dob || "");
      setHeight(userData.height || "");
      setWeight(userData.weight || "");
      setProfilePhoto(userData.profilePhoto || "/user.jpg");
    }
  }, [userData]);

  // Upload handler
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePhoto(URL.createObjectURL(file));
    }
  };

  // Toggle password section
  const togglePasswordSection = () => setPasswordVisible(!passwordVisible);

  // Password validation
  const passwordRequired = newPass.length > 0 || confirmPass.length > 0;
  const passwordValid =
    newPass.length >= 5 && confirmPass.length >= 5 && newPass === confirmPass;

  // Save button validation
  const canSave =
    fullName.trim() &&
    email.trim() &&
    gender.trim() &&
    dob &&
    height &&
    weight &&
    (!passwordRequired || (passwordRequired && passwordValid));

  // Handle Save
  const handleSave = () => {
    if (!canSave) return;
    // TODO: Add your API call to save profile here
    // After saving, close modal
    onClose();
  };

  return (
    <AppModal isOpen={isOpen} onClose={onClose} title="Profile" widthClass="max-w-3xl">
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
            className="absolute inset-0 bg-black/40 text-white text-sm 
                       flex items-center justify-center rounded-full opacity-0 
                       group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
          >
            Upload
          </label>
          <input
            id="photoUpload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoUpload}
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
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              <option value="Male">Male</option>
              <option value="Female">Female</option>
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
        <div className="text-sm text-red-500 w-full max-w-3xl">* All fields are required.</div>

        {/* Change Password Section */}
        <div className="w-full max-w-3xl">
          <button
            type="button"
            onClick={togglePasswordSection}
            className="w-full flex justify-between items-center bg-gray-100 rounded-lg p-2 font-semibold"
          >
            <span>Change Password</span>
            {passwordVisible ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>

          {passwordVisible && (
            <div className="grid grid-cols-2 gap-6 mt-3">
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
                  <p className="text-xs text-red-500 mt-1">Password must be at least 5 characters.</p>
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
                  <p className="text-xs text-red-500 mt-1">Passwords do not match.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={!canSave}
          className={`px-6 py-2 rounded-lg text-white font-medium mt-2 ${
            canSave ? "bg-blue-500 hover:bg-blue-600" : "bg-gray-300 cursor-not-allowed"
          }`}
        >
          Save
        </button>
      </div>
    </AppModal>
  );
};

export default ProfileSettingsModal;