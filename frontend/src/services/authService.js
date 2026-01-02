import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;

const authService = {
  // Register user and send OTP
  register: async (fullName, email, password) => {
    const response = await axios.post(`${API_BASE_URL}/api/auth/register`, {
      fullName,
      email,
      password,
    });
    return response.data;
  },

  // Verify OTP and get JWT
  verifyEmailOTP: async (email, otp) => {
    const response = await axios.post(`${API_BASE_URL}/api/auth/verify-email-otp`, {
      email,
      otp,
    });
    return response.data;
  },

  // Resend OTP
  resendEmailOTP: async (email) => {
    const response = await axios.post(`${API_BASE_URL}/api/auth/resend-email-otp`, {
      email,
    });
    return response.data;
  },

  // Request password-reset OTP (public)
  requestPasswordReset: async (email) => {
    const response = await axios.post(`${API_BASE_URL}/api/auth/request-password-reset`, { email });
    return response.data;
  },

  // Verify OTP for password reset without changing password
  verifyResetOTP: async (email, otp) => {
    const response = await axios.post(`${API_BASE_URL}/api/auth/verify-reset-otp`, { email, otp });
    return response.data;
  },

  // Reset password using OTP
  resetPassword: async (email, otp, newPassword) => {
    const response = await axios.post(`${API_BASE_URL}/api/auth/reset-password`, { email, otp, newPassword });
    return response.data;
  },

  // Login user
  login: async (email, password) => {
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email,
      password,
    });
    return response.data;
  },

  // Store JWT token
  setToken: (token) => {
    try {
      localStorage.setItem('authToken', token);
    } catch (e) {
      console.error('Failed to store token', e);
    }
  },

  // Get JWT token
  getToken: () => {
    try {
      return localStorage.getItem('authToken');
    } catch (e) {
      console.error('Failed to retrieve token', e);
      return null;
    }
  },

  // Clear JWT token
  clearToken: () => {
    try {
      localStorage.removeItem('authToken');
    } catch (e) {
      console.error('Failed to clear token', e);
    }
  },

  // Logout user
  logout: () => {
    authService.clearToken();
  },
};

export default authService;
