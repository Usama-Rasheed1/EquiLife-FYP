import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null); setSuccess(null);
    if (!email) { setError('Please enter your email'); return; }
    setLoading(true);
    try {
      // request password reset OTP
      if (authService.requestPasswordReset) {
        await authService.requestPasswordReset(email);
      } else if (authService.sendOtp) {
        await authService.sendOtp(email);
      }
      setSuccess('Verification code sent to your email');
      navigate('/forgot-password/verify-otp', { state: { email } });
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to send verification code';
      setError(msg);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(90deg, rgba(74,144,226,0) 0%, rgba(74,144,226,0.5) 30%, rgba(74,144,226,1) 85%, rgba(74,144,226,1) 100%)' }}>
      <div className="bg-white shadow-lg rounded-xl flex w-full max-w-4xl overflow-hidden" style={{ minHeight: '400px' }}>
        <div className="w-1/2 p-8 flex flex-col justify-center">
          <img src="/logo.jpeg" alt="EquiLife Logo" style={{ height: '60px', width: '67px' }} />
          <h1 className="text-2xl font-bold pl-2 mb-2 mt-4">Forgot Password</h1>
          <p className="pl-2 mb-6 text-gray-600 text-sm">Enter your account email and we'll send a verification code.</p>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your mail address" className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            {success && <p className="text-sm text-green-600">{success}</p>}

            <button type="submit" disabled={loading} className="w-full cursor-pointer mt-6 text-white py-2 px-4 rounded-md transition duration-200 disabled:opacity-60" style={{ backgroundColor: 'rgba(74,144,226,1)' }}>{loading ? 'Sending...' : 'Send Verification Code'}</button>
          </form>


          {/* Placeholder for new password fields (will be shown after OTP verification) */}
          <div className="mt-6 hidden" id="new-password-section">
            <h2 className="text-lg font-medium mb-2">Set New Password</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">New Password</label>
                <input type="password" className="w-full p-2 border rounded-md" placeholder="Enter new password" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Confirm New Password</label>
                <input type="password" className="w-full p-2 border rounded-md" placeholder="Confirm new password" />
              </div>
              <button className="w-full py-2 px-4 rounded-md text-white" style={{ backgroundColor: 'rgba(74,144,226,1)' }}>Save New Password</button>
            </div>
          </div>
        </div>

        <div className="w-1/2 flex items-center justify-center">
          <img src="/signup.webp" alt="Forgot Password Visual" className="h-[80%] w-full object-contain" />
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
