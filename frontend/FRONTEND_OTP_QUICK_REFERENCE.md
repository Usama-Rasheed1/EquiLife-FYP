# Frontend OTP Integration - Quick Reference

## Files Created

### 1. `src/services/authService.js`
Central API service for all auth endpoints. Methods:
- `register()` - POST /api/auth/register
- `verifyEmailOTP()` - POST /api/auth/verify-email-otp
- `resendEmailOTP()` - POST /api/auth/resend-email-otp
- `login()` - POST /api/auth/login
- `setToken()`, `getToken()`, `clearToken()` - JWT management

### 2. `src/components/OTPVerification.jsx`
Complete OTP verification component with:
- 6-digit numeric input validation
- 5-minute countdown timer with progress bar
- Time display (Issued & Expiry in HH:MM:SS format)
- Attempt counter (max 5)
- Resend OTP with 30s cooldown (max 3 resends)
- Error & success messaging
- Responsive design

## Files Updated

### 1. `src/pages/Signup.jsx`
**Changes:**
- Import `OTPVerification` component
- Import `authService`
- Add `showOTPVerification` state
- Update `handleSubmit()`: Show OTP form instead of redirecting
- Add handlers: `handleOTPSuccess()`, `handleBackToSignup()`
- Conditional render: Signup form OR OTP verification screen

### 2. `src/pages/Signin.jsx`
**Changes:**
- Import `OTPVerification` component
- Import `authService`
- Add `showOTPVerification` state
- Update `handleSubmit()`: Detect 403 response, show OTP verification
- Add handlers: `handleOTPSuccess()`, `handleBackToSignin()`
- Conditional render: Login form OR OTP verification screen

## Flow Diagrams

### Registration Flow
```
User → Signup Form
     ↓
     Enter: Full Name, Email, Password
     ↓
     Click "Sign Up"
     ↓
     API: POST /auth/register
     ↓ Success (201)
     OTP Verification Screen
     ↓
     Enter 6-digit OTP
     ↓
     API: POST /auth/verify-email-otp
     ↓ Success (200)
     Store JWT in localStorage
     ↓
     Redirect to /dashboard
```

### Login Flow (Verified User)
```
User → Signin Form
     ↓
     Enter: Email, Password
     ↓
     Click "Login"
     ↓
     API: POST /auth/login
     ↓ Success (200)
     Store JWT in localStorage
     ↓
     Redirect to /dashboard
```

### Login Flow (Unverified User)
```
User → Signin Form
     ↓
     Enter: Email, Password
     ↓
     Click "Login"
     ↓
     API: POST /auth/login
     ↓ Error (403) - Email not verified
     Show OTP Verification Screen
     ↓
     Enter 6-digit OTP
     ↓
     API: POST /auth/verify-email-otp
     ↓ Success (200)
     Store JWT in localStorage
     ↓
     Redirect to /dashboard
```

## Component Props & States

### OTPVerification Props
```jsx
<OTPVerification
  email="user@example.com"              // Email to verify
  onSuccess={() => navigate("/...")}    // Called on successful verification
  onBackToSignup={() => setShow(false)} // Called when user clicks "Back"
/>
```

### OTPVerification Internal State
```javascript
[otp, setOtp]                        // User input (0-6 digits)
[loading, setLoading]                // API call in progress
[error, setError]                    // Error message display
[success, setSuccess]                // Success message display
[attempts, setAttempts]              // Failed verification attempts (max 5)
[canResend, setCanResend]            // Resend button enabled
[resendCountdown, setResendCountdown] // Cooldown timer (30s)
[resendLimit, setResendLimit]        // Max resends reached (3)
[otpIssueTime, setOtpIssueTime]      // When OTP was generated
[otpExpiryTime, setOtpExpiryTime]    // When OTP expires (5 mins)
[timeRemaining, setTimeRemaining]    // Countdown in seconds (300 → 0)
```

## CSS Classes Used

### Tailwind CSS
- Layout: `min-h-screen`, `flex`, `items-center`, `justify-center`
- Spacing: `p-8`, `mb-2`, `mt-6`, `space-y-4`
- Typography: `text-2xl`, `font-bold`, `text-sm`, `font-medium`
- Colors: `text-white`, `text-red-600`, `text-green-600`, `text-gray-600`
- Interactions: `hover:`, `focus:`, `disabled:`, `cursor-pointer`
- Responsive: `w-1/2`, `max-w-4xl`, `overflow-hidden`

### Custom Inline Styles
- Button colors: `backgroundColor: "rgba(74,144,226,1)"`
- Hover: `"rgba(40,96,170,1)"`
- Border colors: `borderColor`, `backgroundColor`
- Progress bar: Dynamic width `(timeRemaining / 300) * 100`

## API Error Handling

### Error Response Codes
| Code | Message | Action |
|------|---------|--------|
| 400 | Invalid email/OTP format | Show error, user fixes input |
| 404 | User not found | Show error, suggest signup |
| 429 | Rate limit exceeded | Disable button, show cooldown |
| 500 | Server error | Show generic error, suggest retry |

### User-Friendly Error Messages
```
"OTP must be 6 digits"
"Invalid OTP"
"OTP has expired. Please resend a new OTP."
"Maximum verification attempts (5) reached. Please resend OTP."
"You have reached the resend limit. Please try again later."
"New OTP sent to your email"
"Email verified successfully!"
```

## JWT Token Lifecycle

1. **Generation**: Backend issues JWT after OTP verification
2. **Storage**: Frontend stores in `localStorage['authToken']`
3. **Retrieval**: Frontend sends in `Authorization: Bearer <token>` header
4. **Expiry**: Backend validates token and `isVerified` flag
5. **Logout**: Frontend clears from localStorage

## Time Display Format

### Issue & Expiry Times
```
Format: HH:MM:SS AM/PM (user's locale)
Example: "02:34:56 PM"
Updated every second
Automatically formatted to user's timezone
```

### Countdown Timer
```
Format: MM:SS (5 minutes = 5:00, down to 0:00)
Example: "4:32" (4 minutes 32 seconds remaining)
Updated every second
Color: Blue (#3b82f6) if valid, Red (#ef4444) if expired
```

## Validation Rules

### Frontend Validation
- OTP: 6 digits, numeric only
- Email: Valid email format (via browser)
- Password: At least 8 characters (optional enhancement)
- Name: Non-empty (optional enhancement)

### Backend Validation (Already Implemented)
- Email format: RFC 5322 compliant
- Password: Hashed with bcryptjs
- OTP: 6-digit numeric, SHA256 hashed
- OTP Expiry: 5 minutes TTL
- Attempts: Max 5 per OTP
- Resends: Max 3 per registration

## Testing Coverage

### Manual Test Scenarios
1. ✅ Happy path (register → verify → dashboard)
2. ✅ Invalid OTP entry
3. ✅ OTP expiry handling
4. ✅ Resend OTP functionality
5. ✅ Resend limit enforcement
6. ✅ Back button functionality
7. ✅ Unverified login → OTP verification
8. ✅ Successful login (verified user)
9. ✅ Mobile responsiveness
10. ✅ Network error handling

### Browser Console Checks
```javascript
localStorage.getItem('authToken') // Should return JWT after verification
```

### Network Tab Checks
```
POST /api/auth/register → 201
POST /api/auth/verify-email-otp → 200
POST /api/auth/resend-email-otp → 200
POST /api/auth/login → 200 or 403
```

## Styling Customization

To customize OTP component, modify in `OTPVerification.jsx`:

### Change Color Scheme
```jsx
// Primary blue color
backgroundColor: "rgba(74,144,226,1)" → "rgba(59,130,246,1)" // New blue

// Hover color
backgroundColor: "rgba(40,96,170,1)" → "rgba(29,78,216,1)" // Darker blue

// Success green
color: "#10b981" → "#34d399"

// Error red
color: "#ef4444" → "#f87171"
```

### Change Timer Duration
```jsx
const [timeRemaining, setTimeRemaining] = useState(300); // 300 seconds = 5 min
// Change 300 to 180 for 3 minutes, 600 for 10 minutes, etc.
```

### Change Resend Cooldown
```jsx
setResendCountdown(30); // 30 second cooldown
// Change 30 to 60 for 1 minute, 15 for 15 seconds, etc.
```

### Change Max Attempts/Resends
```jsx
const [maxAttempts] = useState(5); // Max verification attempts
// In backend, change in otpController.js
```

## Performance Optimizations

1. **useEffect Cleanup**: Timers cleaned up on unmount
2. **Conditional Rendering**: Only mount OTP component when needed
3. **No Unnecessary Re-renders**: Proper dependency arrays
4. **Async Operations**: Prevent state updates after unmount
5. **localStorage API**: Synchronous, no performance impact

## Security Best Practices

✅ **Implemented:**
- OTP hashed (backend)
- Timing-safe comparison (backend)
- Rate limiting (backend)
- JWT in localStorage (not secure, but standard)
- Password hashing (backend)

⚠️ **Consider Future:**
- HttpOnly cookies (more secure than localStorage)
- CSRF protection
- CORS validation
- Environment variable validation

## Deployment Checklist

- [ ] Backend running on production URL
- [ ] Frontend `.env` points to production backend
- [ ] VITE_BACKEND_BASE_URL configured
- [ ] SMTP configured or fallback accepted
- [ ] Database backups configured
- [ ] Error logging enabled
- [ ] Rate limiting activated
- [ ] HTTPS enabled
- [ ] User testing completed
- [ ] Documentation reviewed

## Support & Debugging

### Common Issues
| Issue | Solution |
|-------|----------|
| OTP not appearing | Check backend console for `[EMAIL FALLBACK]` |
| Token not storing | Verify localStorage is enabled |
| Redirect not working | Check `/dashboard` route exists |
| Timer not counting | Clear cache, hard refresh (Ctrl+Shift+R) |
| Input not accepting digits | Check browser console for JS errors |

### Quick Debug Steps
1. Open browser DevTools (F12)
2. Check Console tab for errors
3. Check Network tab for failed requests
4. Check Application → localStorage for token
5. Check backend console for OTP logs

## Related Files

- Backend: `backend/controllers/otpController.js`
- Backend: `backend/models/OTP.js`
- Backend: `backend/utils/otpHelpers.js`
- Backend: `backend/utils/emailService.js`
- Backend: `backend/middleware/rateLimiters.js`
- Documentation: `FRONTEND_OTP_TESTING_GUIDE.md`
- Documentation: `components/OTP_INTEGRATION_README.md`

---

**Last Updated:** January 2026
**Status:** Production Ready ✅
