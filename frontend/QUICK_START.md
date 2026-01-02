# 🚀 Frontend OTP Integration - Quick Start Guide

## 5-Minute Setup

### Step 1: Verify Installation
```bash
# In frontend directory
npm list axios
npm list lucide-react
npm list react-router-dom

# All should be installed (they were already dependencies)
```

### Step 2: Start Backend
```bash
cd backend
npm start
# Expected output: Server running on port 5001
# Watch for: [EMAIL FALLBACK] logs when OTP is generated
```

### Step 3: Start Frontend
```bash
cd frontend
npm run dev
# Expected output: Running at http://localhost:5173
```

### Step 4: Test Registration Flow
```
1. Open http://localhost:5173/signup
2. Fill form:
   - Full Name: Test User
   - Email: test@example.com
   - Password: Test@1234
   - Confirm: Test@1234
3. Click "Sign Up"
4. OTP screen should appear
5. Check backend console for: [EMAIL FALLBACK] OTP for email: test@example.com: 123456
6. Copy the 6-digit OTP
7. Paste into OTP field
8. Click "Verify OTP"
9. Should redirect to /dashboard
```

✅ **Done!** Full OTP flow working.

---

## Files Changed Summary

### New Files (2)
| File | Purpose |
|------|---------|
| `src/services/authService.js` | API client for auth endpoints |
| `src/components/OTPVerification.jsx` | OTP input & verification component |

### Updated Files (2)
| File | Change |
|------|--------|
| `src/pages/Signup.jsx` | Added OTP screen after registration |
| `src/pages/Signin.jsx` | Handle unverified users with OTP |

### Documentation Files (5)
All in `frontend/` directory for easy reference.

---

## Component Usage

### Using OTPVerification in Any Page
```jsx
import OTPVerification from "../components/OTPVerification";

export default function MyPage() {
  const [showOTP, setShowOTP] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  return (
    <>
      {showOTP ? (
        <OTPVerification
          email={userEmail}
          onSuccess={() => navigate("/dashboard")}
          onBackToSignup={() => setShowOTP(false)}
        />
      ) : (
        <MyForm onSubmit={() => setShowOTP(true)} />
      )}
    </>
  );
}
```

### Using authService in Any Component
```jsx
import authService from "../services/authService";

// Register
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

// Resend
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
  if (error.response.status === 403) {
    // Email not verified, show OTP
    setShowOTPVerification(true);
  }
}

// Logout
authService.logout();
```

---

## API Endpoints

### Register (Send OTP)
```
POST /api/auth/register
Content-Type: application/json

{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123"
}

Response 201:
{
  "message": "OTP sent to email",
  "email": "john@example.com"
}
```

### Verify OTP
```
POST /api/auth/verify-email-otp
Content-Type: application/json

{
  "email": "john@example.com",
  "otp": "123456"
}

Response 200:
{
  "accessToken": "eyJhbGc...",
  "user": {
    "id": "user_id",
    "email": "john@example.com",
    "fullName": "John Doe"
  }
}
```

### Resend OTP
```
POST /api/auth/resend-email-otp
Content-Type: application/json

{
  "email": "john@example.com"
}

Response 200:
{
  "message": "New OTP sent",
  "email": "john@example.com",
  "resendCount": 1
}
```

### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePassword123"
}

Response 200 (Verified User):
{
  "accessToken": "eyJhbGc...",
  "user": { "id": "...", "email": "john@example.com" }
}

Response 403 (Unverified User):
{
  "statusCode": 403,
  "message": "Email not verified",
  "requiresOTPVerification": true
}
```

---

## Features at a Glance

### ✅ OTP Input
- 6 digits only
- Numeric validation
- Large, readable font
- Real-time input masking

### ✅ Countdown Timer
- 5 minutes expiry
- MM:SS format
- Progress bar visualization
- Color change on expiry (blue → red)

### ✅ Time Display
- Issue time: "02:34:56 PM"
- Expiry time: "02:39:56 PM"
- Auto-updates
- User's local timezone

### ✅ Error Handling
- Invalid OTP → Error message
- Expired OTP → "Please resend"
- Max attempts → Form disabled
- Network error → Graceful fallback

### ✅ Resend OTP
- 30-second cooldown
- Max 3 resends
- Updates times on resend
- Clear feedback

### ✅ Security
- 6-digit code
- Backend hashing
- Rate limiting
- No plaintext storage
- Timing-safe comparison

### ✅ Responsive
- Mobile-first design
- Works on all sizes
- Touch-friendly buttons
- Readable text

---

## Troubleshooting

### Problem: OTP Not Showing in Console
**Solution:**
1. Ensure backend is running on port 5001
2. Check backend console (not frontend)
3. Look for: `[EMAIL FALLBACK] OTP for email:`
4. Verify registration API call succeeded (201)

### Problem: "Cannot find module" Error
**Solution:**
1. Verify `authService.js` exists in `src/services/`
2. Verify `OTPVerification.jsx` exists in `src/components/`
3. Check import paths match your project structure
4. Run `npm install` if dependencies missing

### Problem: Timer Not Counting Down
**Solution:**
1. Hard refresh browser (Ctrl+Shift+R)
2. Clear browser cache
3. Check browser time is correct
4. Check console for JavaScript errors

### Problem: Token Not Storing
**Solution:**
1. Open DevTools → Application → localStorage
2. Verify `authToken` key exists after verification
3. Check browser privacy mode (blocks localStorage)
4. Verify no JavaScript errors in console

### Problem: Resend Button Not Working
**Solution:**
1. Wait 30 seconds after clicking "Resend OTP"
2. Check if max 3 resends reached
3. Verify network request in Network tab
4. Check for 429 rate limit error

### Problem: Redirect to Dashboard Not Working
**Solution:**
1. Verify `/dashboard` route exists
2. Check JWT token is stored
3. Verify API response contains `accessToken`
4. Check browser console for navigation errors

---

## Testing Checklist

Quick verification checklist:

- [ ] Register new user (Signup page)
- [ ] Verify OTP from console appears
- [ ] Enter OTP, verify succeeds
- [ ] Check JWT in localStorage
- [ ] Redirect to dashboard
- [ ] Refresh page, still logged in
- [ ] Try unverified login (skip OTP)
- [ ] See OTP screen automatically
- [ ] Verify email during login
- [ ] Check timer updates smoothly
- [ ] Check resend button works
- [ ] Check max attempts disabled
- [ ] Check mobile layout

---

## Environment Setup

### Required Environment Variables
```bash
# .env (frontend)
VITE_BACKEND_BASE_URL=http://localhost:5001
```

### Optional Environment Variables
```bash
# .env (backend)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@equilife.com
```

If SMTP not configured, OTP logs to console (perfect for development).

---

## Performance

### Expected Response Times
- Register API: < 1 second
- OTP Verify API: < 2 seconds
- Resend API: < 1 second
- Page Load: < 2 seconds
- Timer Update: Smooth 60fps

### Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers

---

## Mobile Testing

### Test on Mobile Device
1. Find your computer's IP: `ipconfig getifaddr en0` (Mac) or `ipconfig` (Windows)
2. Start frontend: `npm run dev`
3. On mobile, open: `http://YOUR_IP:5173`
4. Test signup → OTP flow
5. Test on different screen sizes

### Responsive Breakpoints
- Mobile: 320px - 768px
- Tablet: 768px - 1024px
- Desktop: 1024px+

---

## Debugging Tips

### Browser Console
```javascript
// Check token storage
localStorage.getItem('authToken')

// Check if OTP form is visible
document.querySelector('[id*=otp]')

// Clear localStorage (start fresh)
localStorage.clear()
```

### Network Tab (F12)
```
Look for:
✓ POST /api/auth/register (201)
✓ POST /api/auth/verify-email-otp (200)
✓ POST /api/auth/resend-email-otp (200)
```

### Backend Console
```
Look for:
✓ [EMAIL FALLBACK] OTP for email: test@example.com: 123456
✓ User created successfully
✓ OTP verified successfully
```

---

## Common Use Cases

### Use Case 1: New User Registration
```
1. User → Signup
2. Fills form
3. Clicks "Sign Up"
4. OTP screen appears
5. Enters OTP from email
6. Clicks "Verify OTP"
7. Redirects to dashboard
```

### Use Case 2: Forgot to Verify Email
```
1. User → Signin
2. Enters email & password
3. Gets error: "Email not verified"
4. OTP screen appears automatically
5. Enters OTP from email
6. Clicks "Verify OTP"
7. Now logged in
```

### Use Case 3: Resend OTP
```
1. User at OTP screen
2. Didn't receive email
3. Clicks "Resend OTP"
4. Wait 30 seconds
5. New OTP sent
6. Timer resets to 5:00
7. Enters new OTP
```

### Use Case 4: OTP Expired
```
1. User at OTP screen
2. Timer reached 0:00
3. OTP expired message
4. Click "Resend OTP"
5. New OTP generated
6. Timer resets
7. Continue verification
```

---

## Security Notes

### What's Protected
- ✅ OTP hashed in database (SHA256)
- ✅ Password hashed (bcryptjs)
- ✅ JWT token secured
- ✅ Rate limiting on attempts
- ✅ 5-minute expiry on OTP
- ✅ Max 5 verification attempts
- ✅ Max 3 resends per registration

### Best Practices
- Use HTTPS in production
- Store JWT in localStorage (or HttpOnly cookies)
- Never expose OTP in logs
- Never send OTP in plaintext
- Always hash passwords
- Use rate limiting
- Validate all inputs

---

## Documentation Reference

| Document | Purpose | When to Use |
|----------|---------|------------|
| **IMPLEMENTATION_SUMMARY.md** | Executive overview | Start here |
| **FRONTEND_OTP_QUICK_REFERENCE.md** | Quick lookup | For quick answers |
| **OTP_INTEGRATION_README.md** | Technical deep dive | Understanding code |
| **FRONTEND_OTP_TESTING_GUIDE.md** | Test procedures | Running tests |
| **FRONTEND_OTP_VISUAL_GUIDE.md** | UI/design specs | Design reference |
| **FRONTEND_OTP_DEPLOYMENT_CHECKLIST.md** | Deployment guide | Going to production |

---

## Support & Help

### Getting Help
1. **Quick answer?** → Check FRONTEND_OTP_QUICK_REFERENCE.md
2. **How to test?** → Check FRONTEND_OTP_TESTING_GUIDE.md
3. **Technical issue?** → Check OTP_INTEGRATION_README.md
4. **How to deploy?** → Check FRONTEND_OTP_DEPLOYMENT_CHECKLIST.md
5. **Design question?** → Check FRONTEND_OTP_VISUAL_GUIDE.md

### Common Questions

**Q: Where is the OTP logged?**
A: Backend console, look for `[EMAIL FALLBACK]`

**Q: How long does OTP last?**
A: 5 minutes (300 seconds)

**Q: How many resend attempts?**
A: Max 3 resends per registration

**Q: How many verification attempts?**
A: Max 5 attempts per OTP

**Q: Is it mobile responsive?**
A: Yes, works on all screen sizes

**Q: Can I customize the colors?**
A: Yes, edit OTPVerification.jsx `backgroundColor` values

**Q: Can I change the timer duration?**
A: Yes, change `timeRemaining: 300` (300 = 5 minutes)

---

## Next Steps

1. ✅ **Verify setup** - Run the 5-minute setup above
2. ✅ **Test flow** - Complete test registration flow
3. ✅ **Review docs** - Read IMPLEMENTATION_SUMMARY.md
4. ✅ **Run tests** - Follow FRONTEND_OTP_TESTING_GUIDE.md
5. ✅ **Deploy** - Use FRONTEND_OTP_DEPLOYMENT_CHECKLIST.md

---

## Quick Links

- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md)
- [Testing Guide](./FRONTEND_OTP_TESTING_GUIDE.md)
- [Quick Reference](./FRONTEND_OTP_QUICK_REFERENCE.md)
- [Technical Docs](./src/components/OTP_INTEGRATION_README.md)
- [Visual Guide](./FRONTEND_OTP_VISUAL_GUIDE.md)
- [Deployment Checklist](./FRONTEND_OTP_DEPLOYMENT_CHECKLIST.md)

---

**Status: ✅ Ready to Use**
**Last Updated: January 2026**
**Need Help? See documentation above.**
