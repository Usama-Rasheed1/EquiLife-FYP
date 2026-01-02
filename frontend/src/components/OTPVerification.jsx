import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

const OTPVerification = ({
  email,
  onSuccess,
  onBackToSignup,
  verifyFunc = authService.verifyEmailOTP,
  expectToken = true,
  title = 'Verify Your Email',
  subtitle = "We've sent a 6-digit code to",
}) => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [maxAttempts] = useState(5);
  const [canResend, setCanResend] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [resendLimit, setResendLimit] = useState(false);
  const [otpIssueTime, setOtpIssueTime] = useState(null);
  const [otpExpiryTime, setOtpExpiryTime] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(300);

  useEffect(() => {
    const now = new Date();
    setOtpIssueTime(now);
    setOtpExpiryTime(new Date(now.getTime() + 5 * 60 * 1000));
    setTimeRemaining(300);
  }, []);

  useEffect(() => {
    if (timeRemaining <= 0) return;
    const timer = setInterval(() => setTimeRemaining((p) => p - 1), 1000);
    return () => clearInterval(timer);
  }, [timeRemaining]);

  useEffect(() => {
    if (resendCountdown <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setInterval(() => setResendCountdown((p) => p - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

  const formatTime = (date) => {
    if (!date) return '';
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });
  };

  const formatCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const validateOtp = (value) => /^\d{0,6}$/.test(value);
  const handleOtpChange = (e) => {
    const v = e.target.value;
    if (validateOtp(v)) setOtp(v);
  };

  const handleVerifyOTP = async (e) => {
    e?.preventDefault();
    setError(null);
    setSuccess(null);

    if (otp.length !== 6) { setError('OTP must be 6 digits'); return; }
    if (attempts >= maxAttempts) { setError(`Maximum verification attempts (${maxAttempts}) reached. Please resend OTP.`); return; }
    if (timeRemaining <= 0) { setError('OTP has expired. Please resend a new OTP.'); return; }

    setLoading(true);
    try {
      const response = await verifyFunc(email, otp);
      if (expectToken) {
        if (response.accessToken) {
          authService.setToken(response.accessToken);
          setSuccess('Email verified successfully!');
          setTimeout(() => onSuccess(response, otp), 800);
        } else {
          setError('Verification failed');
        }
      } else {
        if (response.ok) {
          setSuccess('OTP verified');
          setTimeout(() => onSuccess(response, otp), 300);
        } else {
          setError(response.message || 'Verification failed');
        }
      }
    } catch (err) {
      const msg = err?.response?.data?.message || 'OTP verification failed';
      setError(msg);
      setAttempts((p) => p + 1);
      setOtp('');
    } finally { setLoading(false); }
  };

  const handleResendOTP = async () => {
    setError(null); setSuccess(null);
    if (resendLimit) { setError('You have reached the resend limit. Please try again later.'); return; }
    setCanResend(false); setResendCountdown(30);
    try {
      const res = await authService.requestPasswordReset ? authService.requestPasswordReset(email) : authService.resendEmailOTP(email);
      const now = new Date();
      setOtpIssueTime(now); setOtpExpiryTime(new Date(now.getTime() + 5 * 60 * 1000)); setTimeRemaining(300);
      setSuccess('New OTP sent to your email'); setOtp(''); setAttempts(0);
      if (res?.resendCount >= 3) setResendLimit(true);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to resend OTP';
      setError(msg); setCanResend(true); setResendCountdown(0);
      if (err?.response?.status === 429) setResendLimit(true);
    }
  };

  const navigate = useNavigate();
  const isOtpExpired = timeRemaining <= 0;
  const isMaxAttemptsReached = attempts >= maxAttempts;

  return (
    <div className="bg-white shadow-lg rounded-xl flex w-full max-w-4xl overflow-hidden" style={{ minHeight: '550px' }}>
      <div className="w-1/2 p-8 flex flex-col justify-center">
        <div className="mb-6">
          <img src="/logo.jpeg" alt="EquiLife Logo" style={{ height: '60px', width: '67px' }} />
          <h1 className="text-2xl font-bold pl-2 mb-2 mt-4">{title}</h1>
          <p className="pl-2 mb-1 text-gray-600 text-sm">{subtitle}</p>
          <p className="pl-2 text-gray-700 font-medium text-sm">{email}</p>
        </div>

        <form className="space-y-4" onSubmit={handleVerifyOTP}>
          <div>
            <label htmlFor="otp" className="block text-sm font-medium mb-2">Enter OTP Code</label>
            <input id="otp" type="text" value={otp} onChange={handleOtpChange} placeholder="000000" maxLength={6} disabled={isOtpExpired || isMaxAttemptsReached} className="w-full p-3 border-2 rounded-md text-center text-2xl tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed" style={{ borderColor: error ? '#ef4444' : '#e5e7eb' }} />
          </div>

          <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
            <div className="flex justify-between items-center text-xs text-gray-600">
              <span><span className="font-medium">Issued:</span> {otpIssueTime ? formatTime(otpIssueTime) : '--:--:-- --'}</span>
              <span><span className="font-medium">Expires:</span> {otpExpiryTime ? formatTime(otpExpiryTime) : '--:--:-- --'}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <div className="flex-1">
                <div className="h-1 bg-gray-300 rounded-full overflow-hidden" style={{ backgroundColor: '#e5e7eb' }}>
                  <div className="h-full transition-all duration-1000" style={{ width: `${(timeRemaining / 300) * 100}%`, backgroundColor: isOtpExpired ? '#ef4444' : '#3b82f6' }} />
                </div>
              </div>
              <span className="ml-3 font-mono text-sm font-bold" style={{ color: isOtpExpired ? '#ef4444' : '#3b82f6' }}>{formatCountdown(timeRemaining)}</span>
            </div>
          </div>

          {attempts > 0 && <p className="text-xs text-gray-600">Attempts: {attempts}/{maxAttempts}</p>}
          {error && <div className="bg-red-50 border border-red-200 rounded-md p-3"><p className="text-sm text-red-600">{error}</p></div>}
          {success && <div className="bg-green-50 border border-green-200 rounded-md p-3"><p className="text-sm text-green-600">{success}</p></div>}

          <button type="submit" disabled={loading || otp.length !== 6 || isOtpExpired || isMaxAttemptsReached} className="w-full cursor-pointer mt-6 text-white py-2 px-4 rounded-md transition duration-200 disabled:opacity-60 disabled:cursor-not-allowed" style={{ backgroundColor: loading || otp.length !== 6 || isOtpExpired || isMaxAttemptsReached ? '#cbd5e1' : 'rgba(74,144,226,1)' }}>{loading ? 'Verifying...' : 'Verify OTP'}</button>
        </form>

        <div className="mt-6 border-t pt-6">
          <p className="text-sm text-gray-600 mb-3">Didn't receive the code?</p>
          <button
            type="button"
            onClick={handleResendOTP}
            disabled={!canResend || resendLimit}
            className={`w-full hover:cursor-pointer py-2 px-4 rounded-md border-2 font-medium transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${resendLimit ? 'border-gray-300 text-gray-400' : 'border-blue-500 text-blue-600'} ${!canResend ? 'bg-gray-100' : 'bg-transparent'} hover:bg-blue-50`}
          >
            {resendLimit ? 'Resend limit reached' : !canResend ? `Resend in ${resendCountdown}s` : 'Resend OTP'}
          </button>
          {resendLimit && <p className="text-xs text-gray-500 mt-2 text-center">You've reached the maximum number of resend attempts. Please try again later.</p>}
        </div>
      </div>

      <div className="w-1/2">
        <img src="/signup.webp" alt="OTP Verification Visual" className="h-full w-full object-contain" />
      </div>
    </div>
  );
};

export default OTPVerification;
