import { useState } from "react";
import { Eye, EyeClosed } from "lucide-react";

const Signin = () => {
  const [showPassword, setShowPassword] = useState(false);

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
          <h1 className="text-2xl font-bold pl-2 mb-2">Welcome back!</h1>
          <p className="pl-2 mb-6 text-gray-600 text-sm">
            Sign in to track your mind, body, and progress
          </p>

          <form className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
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
                  placeholder="Enter password"
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

            <div className="flex items-center justify-end">
              <a href="#" className="text-sm text-blue-600 hover:underline">
                Forgot your password?
              </a>
            </div>

            <button
              type="submit"
              className="w-full cursor-pointer text-white py-2 px-4 rounded-md transition duration-200"
              style={{ backgroundColor: "rgba(74,144,226,1)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "rgba(40,96,170,1)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "rgba(74,144,226,1)")
              }
            >
              Login
            </button>
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
    </div>
  );
};

export default Signin;
