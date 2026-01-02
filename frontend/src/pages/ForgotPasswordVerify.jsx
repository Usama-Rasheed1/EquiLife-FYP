import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import OTPVerification from '../components/OTPVerification';
import authService from '../services/authService';

const ForgotPasswordVerify = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location?.state?.email || '';

  const [verified, setVerified] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleOtpSuccess = (res, otp) => {
    setOtpValue(otp || '');
    setVerified(true);
  };

  const handleResetPassword = async (e) => {
    e?.preventDefault();
    setError(null); setSuccess(null);
    if (!otpValue) { setError('OTP missing'); return; }
    if (!newPassword || !confirmPassword) { setError('Please enter and confirm your new password'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }

    setResetLoading(true);
    try {
      await authService.resetPassword(email, otpValue, newPassword);
      setSuccess('Password updated successfully. Redirecting to login...');
      setTimeout(() => navigate('/signin'), 1200);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to reset password';
      setError(msg);
    } finally { setResetLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(90deg, rgba(74,144,226,0) 0%, rgba(74,144,226,0.5) 30%, rgba(74,144,226,1) 85%, rgba(74,144,226,1) 100%)' }}>
      <div className="w-full max-w-4xl">
        {!verified ? (
          <OTPVerification email={email} verifyFunc={authService.verifyResetOTP} expectToken={false} title="Reset Password" subtitle="Enter the 6-digit code sent to" onSuccess={handleOtpSuccess} onBackToSignup={() => navigate('/forgot-password')} />
        ) : (
          <div className="bg-white shadow-lg rounded-xl flex w-full max-w-4xl overflow-hidden" style={{ minHeight: '400px' }}>
            <div className="w-1/2 p-8 flex flex-col justify-center">
              <div className="p-4">
                <h2 className="text-xl font-bold mb-4">Set New Password</h2>
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">New Password</label>
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Confirm New Password</label>
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                  </div>
                  {error && <p className="text-sm text-red-600">{error}</p>}
                  {success && <p className="text-sm text-green-600">{success}</p>}
                  <button type="submit" disabled={resetLoading} className="mt-4 w-full py-2 px-4 rounded-md text-white" style={{ backgroundColor: resetLoading ? '#cbd5e1' : 'rgba(74,144,226,1)' }}>{resetLoading ? 'Resetting...' : 'Reset Password'}</button>
                </form>
              </div>
            </div>

            <div className="w-1/2 flex items-center justify-center bg-transparent">
              <img src="/signup.webp" alt="Reset Visual" className="h-[80%] w-full object-contain" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordVerify;
