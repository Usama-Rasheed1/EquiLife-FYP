# Frontend OTP Integration Documentation

## Overview
Complete email OTP verification flow integrated into EquiLife registration and login pages. Users must verify their email via OTP before accessing the dashboard.

## Components Created

### 1. **OTPVerification.jsx** (`src/components/OTPVerification.jsx`)
Complete OTP verification component with all required features:

**Features:**
- 6-digit OTP input with numeric-only validation
- Real-time countdown timer (5 minutes expiry)
- Time display: Issue time & Expiry time
- Progress bar showing remaining time
- Attempt counter (max 5 attempts)
- Resend OTP with 30-second cooldown
- Rate limiting enforcement (max 3 resends)
- Error and success messages
- Disabled state when OTP expires or max attempts reached

**Props:**
- `email` (string): User email for OTP verification
- `onSuccess` (function): Callback when OTP is verified successfully
- `onBackToSignup` (function): Callback to return to signup/signin form

**Key Features:**
```jsx
<OTPVerification
  email="user@example.com"
  onSuccess={() => navigate("/dashboard")}
  onBackToSignup={() => setShowOTPVerification(false)}
/>
```

### 2. **authService.js** (`src/services/authService.js`)
API service for all authentication endpoints:

**Methods:**
- `register(fullName, email, password)` - Register user and send OTP
- `verifyEmailOTP(email, otp)` - Verify OTP and get JWT
- `resendEmailOTP(email)` - Resend OTP with limits
- `login(email, password)` - Login user
- `setToken(token)` - Store JWT in localStorage
- `getToken()` - Retrieve JWT from localStorage
- `clearToken()` - Remove JWT from localStorage
- `logout()` - Clear token and logout

## Updated Pages

### 1. **Signup.jsx** - Registration Flow
**Changes:**
- Added OTP verification screen after registration
- Conditional rendering: Show signup form OR OTP verification
- Upon successful OTP verification, redirect to dashboard

**Flow:**
```
Enter Details → Submit → Show OTP Form → Verify OTP → Dashboard
```

### 2. **Signin.jsx** - Login Flow
**Changes:**
- Added handling for unverified email (403 response)
- Show OTP verification if user tries to login before verifying
- Allow email verification during login attempt

**Flow:**
```
Enter Email/Password → Try Login → Unverified? → Show OTP Form → Verify → Login → Dashboard
```

## UI/UX Features

### OTP Input Design
- Clean, centered 6-digit input field
- Numeric-only validation (prevents non-numeric input)
- Large, monospace font for better visibility
- Focus ring highlighting
- Disabled state when OTP expires or max attempts reached

### Time Display
```
Issued: 02:34:56 PM | Expires: 02:39:56 PM
```
- Compact format below OTP input
- Uses user's locale for time formatting
- Updates automatically with countdown timer

### Countdown Timer
- Visual progress bar showing remaining time
- Countdown displayed as MM:SS format
- Color changes:
  - Blue: OTP valid
  - Red: OTP expired

### Resend OTP Button
- Disabled for 30 seconds after sending (prevents spam)
- Shows countdown when disabled: "Resend in 30s"
- Grayed out when max resend limit (3) is reached
- Clear feedback on resend limit status

### Error/Success Messaging
- Red background for errors
- Green background for success
- Clear, user-friendly error messages
- Auto-hides after successful verification

### Attempt Tracking
- Shows current attempt vs max (5/5)
- Form disables after max attempts reached
- User must resend OTP to try again

## Styling & Design System

### Color Scheme
- Primary Blue: `rgba(74,144,226,1)` (#4A90E2)
- Hover Blue: `rgba(40,96,170,1)` (#2860AA)
- Error Red: `#ef4444`
- Success Green: `#10b981`
- Text Gray: `#6b7280`
- Background Gray: `#f3f4f6`
- Border Gray: `#e5e7eb`

### Responsive Design
- Mobile-first approach
- Works on all screen sizes
- Padding and spacing optimized for mobile

### Typography
- Font sizes: 12px (small), 14px (base), 16px (input), 20px (heading), 24px (title)
- Font weights: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
- OTP input uses monospace font for alignment

### Components Used
- Lucide React icons: `Eye`, `EyeClosed` (password visibility)
- Tailwind CSS for styling
- Axios for HTTP requests

## Security Features

### Frontend Security
1. **OTP Validation**
   - Numeric-only input validation
   - 6-digit requirement enforced
   - Input masking for security

2. **Rate Limiting**
   - Max 5 verification attempts
   - Max 3 resends per registration
   - 30-second resend cooldown (prevents spam)

3. **Token Management**
   - JWT stored in localStorage after verification
   - Token cleared on logout
   - Automatic redirect on success

4. **Error Handling**
   - User-friendly error messages
   - Network error handling
   - Graceful fallbacks

### Backend Security (Already Implemented)
- SHA256 OTP hashing
- Timing-safe comparison
- 5-minute expiry with TTL index
- Rate limiting via express-rate-limit
- Password encryption with bcryptjs

## API Endpoints Called

### POST `/api/auth/register`
**Request:**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "message": "OTP sent to email",
  "email": "john@example.com"
}
```

### POST `/api/auth/verify-email-otp`
**Request:**
```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGc...",
  "user": { "id": "...", "email": "..." }
}
```

### POST `/api/auth/resend-email-otp`
**Request:**
```json
{
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "message": "New OTP sent",
  "email": "john@example.com",
  "resendCount": 1
}
```

### POST `/api/auth/login`
**Request:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response (Verified User):**
```json
{
  "accessToken": "eyJhbGc...",
  "user": { "id": "...", "email": "..." }
}
```

**Response (Unverified User):**
```json
{
  "statusCode": 403,
  "message": "Email not verified",
  "requiresOTPVerification": true
}
```

## State Management

### Signup Component State
```javascript
const [showOTPVerification, setShowOTPVerification] = useState(false);
// Shows OTP form after successful registration
```

### Signin Component State
```javascript
const [showOTPVerification, setShowOTPVerification] = useState(false);
// Shows OTP form if login fails due to unverified email
```

### OTPVerification Component State
```javascript
const [otp, setOtp] = useState('');                    // User input
const [loading, setLoading] = useState(false);         // API loading state
const [error, setError] = useState(null);              // Error message
const [success, setSuccess] = useState(null);          // Success message
const [attempts, setAttempts] = useState(0);           // Verification attempts
const [canResend, setCanResend] = useState(false);     // Resend button state
const [resendCountdown, setResendCountdown] = useState(0); // Cooldown timer
const [resendLimit, setResendLimit] = useState(false); // Max resends reached
const [otpIssueTime, setOtpIssueTime] = useState(null); // When OTP was issued
const [otpExpiryTime, setOtpExpiryTime] = useState(null); // When OTP expires
const [timeRemaining, setTimeRemaining] = useState(300); // Seconds remaining
```

## Usage Examples

### Basic Integration (Already Done)
```jsx
import OTPVerification from "../components/OTPVerification";

const Signup = () => {
  const [showOTPVerification, setShowOTPVerification] = useState(false);

  return (
    <>
      {showOTPVerification ? (
        <OTPVerification
          email={email}
          onSuccess={() => navigate("/dashboard")}
          onBackToSignup={() => setShowOTPVerification(false)}
        />
      ) : (
        <SignupForm />
      )}
    </>
  );
};
```

### Using authService
```jsx
import authService from "../services/authService";

// Register user
try {
  const response = await authService.register(fullName, email, password);
  console.log(response.message); // "OTP sent to email"
} catch (error) {
  console.error(error.response.data.message);
}

// Verify OTP
try {
  const response = await authService.verifyEmailOTP(email, otp);
  authService.setToken(response.accessToken);
  navigate("/dashboard");
} catch (error) {
  console.error(error.response.data.message);
}

// Resend OTP
try {
  const response = await authService.resendEmailOTP(email);
  console.log(response.message); // "New OTP sent"
} catch (error) {
  console.error(error.response.data.message);
}

// Login
try {
  const response = await authService.login(email, password);
  authService.setToken(response.accessToken);
  navigate("/dashboard");
} catch (error) {
  // Handle 403 requiresOTPVerification
}

// Logout
authService.logout();
```

## Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires localStorage support
- Requires ES6+ JavaScript support

## Performance Considerations
1. **Countdown Timer**: Optimized with useEffect cleanup
2. **Form Disable States**: Prevents double-submission
3. **Async Operations**: Loading state prevents spam
4. **Token Storage**: localStorage is synchronous and instant

## Testing Checklist

- [ ] Register with valid credentials → OTP form shows
- [ ] Enter invalid OTP → Error message displays
- [ ] OTP expires → Form disables, countdown reaches 00:00
- [ ] Resend OTP → New countdown starts, times update
- [ ] Max resend limit (3) → Button disabled, message shown
- [ ] Max attempts (5) → Form disabled, error shows
- [ ] Successful verification → JWT stored, redirects to dashboard
- [ ] Login with unverified email → OTP form shows
- [ ] Verify during login → JWT stored, redirects to dashboard
- [ ] Mobile responsiveness → Works on small screens
- [ ] Network error → Graceful error handling
- [ ] Logout → Token cleared, user logged out

## Troubleshooting

### OTP not showing/arriving
- Check backend console for `[EMAIL FALLBACK]` logs
- Verify SMTP configuration if using real email
- Check spam/junk folder

### JWT not storing
- Verify localStorage is available
- Check browser console for errors
- Ensure token is returned from backend

### Countdown not updating
- Check browser time is correct
- Verify JavaScript is enabled
- Check for console errors

### Resend limit not working
- Clear localStorage and try again
- Check backend rate limiting
- Verify resendCount in response

## Future Enhancements
1. SMS OTP option
2. Biometric verification
3. Remember this device option
4. Two-factor authentication (2FA)
5. OTP history/audit log
6. Custom OTP length configuration
7. Email template customization

## Related Backend Documentation
See `backend/controllers/otpController.js` and `backend/models/OTP.js` for implementation details.
