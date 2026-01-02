import { useState } from "react";
import { Eye, EyeClosed } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import OTPVerification from "../components/OTPVerification";
import authService from "../services/authService";

const Signin = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showOTPVerification, setShowOTPVerification] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_BASE_URL}/api/auth/login`, { email, password });
      const data = res.data;

      if (data.accessToken) {
        try { localStorage.setItem('authToken', data.accessToken); } catch (err) { console.error(err); }
      }

      navigate('/dashboard');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Login failed';
      const status = err?.response?.status;

      // If email not verified, show OTP verification screen
      if (status === 403 && err?.response?.data?.requiresOTPVerification) {
        setError('Please verify your email first.');
        setShowOTPVerification(true);
      } else {
        setError(msg);
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOTPSuccess = () => {
    // OTP verified, try to login again or redirect
    navigate("/dashboard");
  };

  const handleBackToSignin = () => {
    setShowOTPVerification(false);
    setError(null);
    setPassword('');
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background:
          "linear-gradient(90deg, rgba(74,144,226,0) 0%, rgba(74,144,226,0.5) 30%, rgba(74,144,226,1) 85%, rgba(74,144,226,1) 100%)",
      }}
    >
      {showOTPVerification ? (
        <OTPVerification
          email={email}
          onSuccess={handleOTPSuccess}
          onBackToSignup={handleBackToSignin}
        />
      ) : (
        <div
          className="bg-white shadow-lg rounded-xl flex w-full max-w-4xl overflow-hidden"
          style={{ minHeight: "550px" }}
        >
        <div className="w-1/2 p-8 flex flex-col justify-center">
          <img
            src="./logo.jpeg"
            alt="EquiLife Logo"
            style={{ height: "60px", width: "67px" }}
          />
          <h1 className="text-2xl font-bold pl-2 mb-2">Welcome back!</h1>
          <p className="pl-2 mb-6 text-gray-600 text-sm">
            Sign in to track your mind, body, and progress
          </p>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your mail address"
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-1"
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                  required
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute inset-y-0 right-2 flex items-center text-gray-500"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                  }}
                >
                  {showPassword ? <Eye /> : <EyeClosed />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <a href="/forgot-password" className="text-sm text-blue-600 hover:underline">
                Forgot your password?
              </a>
            </div>

            <div>
              {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full cursor-pointer text-white py-2 px-4 rounded-md transition duration-200 disabled:opacity-60"
                style={{ backgroundColor: "rgba(74,144,226,1)" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "rgba(40,96,170,1)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "rgba(74,144,226,1)")
                }
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-sm">
            <p>
              Don't have an account?
              <a href="/signup" className=" ml-2 text-blue-600 hover:underline">
                Register here
              </a>
            </p>
          </div>
        </div>
        <div className="w-1/2 flex items-center justify-center">
          <img
            src="/signin.webp"
            alt="Login Visual"
            className="h-[60%] w-full object-contain"
          />
        </div>
      </div>
      )}
    </div>
  );
};

export default Signin;
