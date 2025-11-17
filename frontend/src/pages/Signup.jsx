import { useState } from "react";
import { Eye, EyeClosed } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fullName, setfullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!email || !password) {
      setError("Please provide email and password");
      return;
    }

    setLoading(true);
    try {
      const url = `${import.meta.env.VITE_BACKEND_BASE_URL}/api/auth/register`;

      const payload = { fullName, email, password };

      const res = await axios.post(url, payload);
      if (res.status === 201 || res.status === 200) {
        // store token if backend returns one
        if (res.data?.accessToken) {
          try {
            localStorage.setItem("authToken", res.data.accessToken);
          } catch (e) {}
        }
        // After signup redirect user directly to dashboard
        navigate("/dashboard");
      } else {
        setError(res.data?.message || "Registration failed");
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "Registration failed";
      setError(msg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background:
          "linear-gradient(90deg, rgba(74,144,226,0) 0%, rgba(74,144,226,0.5) 30%, rgba(74,144,226,1) 85%, rgba(74,144,226,1) 100%)",
      }}
    >
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
          <h1 className="text-2xl font-bold pl-2 mb-2">Join EquiLife</h1>
          <p className="pl-2 mb-6 text-gray-600 text-sm">
            Sign up to start your wellness journey—mind & body in sync
          </p>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium mb-1"
              >
                Full Name
              </label>
              <input
                type="text"
                id="fullName"
                value={fullName}
                onChange={(e) => setfullName(e.target.value)}
                placeholder="Enter Name"
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

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
                  placeholder="Create a strong password"
                  className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
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

            <div>
              <label
                htmlFor="confirm-password"
                className="block text-sm font-medium mb-1"
              >
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirm-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute inset-y-0 right-2 flex items-center text-gray-500"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                  }}
                >
                  {showConfirmPassword ? <Eye /> : <EyeClosed />}
                </button>
              </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {success && <p className="text-sm text-green-600">{success}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full cursor-pointer mt-6 text-white py-2 px-4 rounded-md transition duration-200 disabled:opacity-60"
              style={{ backgroundColor: "rgba(74,144,226,1)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "rgba(40,96,170,1)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "rgba(74,144,226,1)")
              }
            >
              {loading ? "Signing up..." : "Sign Up"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <p>
              Already have an account?
              <a href="/signin" className="ml-2 text-blue-600 hover:underline">
                Login here
              </a>
            </p>
          </div>
        </div>
        <div className="w-1/2">
          <img
            src="/signup.webp"
            alt="Signup Visual"
            className="h-full w-full object-contain"
          />
        </div>
      </div>
    </div>
  );
};

export default Signup;
