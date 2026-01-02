# Frontend OTP Integration - Testing Guide

## Quick Start

### Prerequisites
1. Backend running on `http://localhost:5001`
2. Frontend running on `http://localhost:5173` (Vite default)
3. Both services properly configured

### Environment Setup
Verify in `frontend/.env`:
```env
VITE_BACKEND_BASE_URL=http://localhost:5001
```

## Testing Scenarios

### Scenario 1: Happy Path - New User Registration
**Steps:**
1. Navigate to `/signup`
2. Fill form:
   - Full Name: "John Doe"
   - Email: "john@example.com"
   - Password: "Test@1234"
   - Confirm Password: "Test@1234"
3. Click "Sign Up"

**Expected:**
- Form disappears
- OTP verification screen appears
- Shows "We've sent a 6-digit code to john@example.com"
- Countdown timer starts (5:00 → down to 0:00)
- OTP input shows "Issued: HH:MM:SS | Expires: HH:MM:SS"

**Next:**
4. Check backend console for: `[EMAIL FALLBACK] OTP for email: 123456`
5. Enter 6-digit OTP in input field
6. Click "Verify OTP"

**Expected:**
- Loading state: "Verifying..."
- Success message: "Email verified successfully!"
- Redirect to `/dashboard` in ~1.5 seconds
- JWT token stored in localStorage

---

### Scenario 2: Invalid OTP Entry
**Setup:** At OTP verification screen

**Steps:**
1. Enter incorrect OTP: "000000"
2. Click "Verify OTP"

**Expected:**
- Error message: "Invalid OTP" or similar
- Attempt counter shows: "Attempts: 1/5"
- OTP input cleared
- Attempt counter increments

**Repeat 4 more times:**
3. Enter wrong OTP again
4. After 5 failed attempts:

**Expected:**
- Error: "Maximum verification attempts (5) reached. Please resend OTP."
- OTP input field disabled (grayed out)
- "Verify OTP" button disabled

---

### Scenario 3: OTP Expiry
**Setup:** At OTP verification screen

**Steps:**
1. Wait for countdown to reach 0:00 (5 minutes)
   - *OR* Wait ~30 seconds and observe timer progress
2. Try to submit expired OTP

**Expected:**
- Timer shows "00:00"
- Timer bar is red
- Input field disabled
- Error: "OTP has expired. Please resend a new OTP."

---

### Scenario 4: Resend OTP
**Setup:** At OTP verification screen

**Steps:**
1. Click "Resend OTP" button

**Expected:**
- Button disabled immediately
- Shows: "Resend in 30s"
- 30-second countdown visible
- After 30s: Button re-enables
- Success message: "New OTP sent to your email"
- New OTP appears in backend console: `[EMAIL FALLBACK] OTP for email: XXXXXX`
- Timer resets to 5:00
- Time display updates: "Issued: [NEW_TIME] | Expires: [NEW_TIME]"

---

### Scenario 5: Resend Limit Exceeded
**Setup:** At OTP verification screen

**Steps:**
1. Click "Resend OTP" → Wait 30s → Button enabled
2. Click "Resend OTP" → Wait 30s → Button enabled
3. Click "Resend OTP" → Wait 30s → Button enabled
4. Click "Resend OTP" (4th attempt)

**Expected:**
- Error: "You have reached the resend limit..."
- Button disabled permanently: "Resend limit reached"
- Button grayed out
- Message: "You've reached the maximum number of resend attempts..."

---

### Scenario 6: Back to Signup
**Setup:** At OTP verification screen

**Steps:**
1. Click "Back to signup" link

**Expected:**
- Returns to signup form
- All form fields empty (cleared)
- Error/success messages cleared
- OTP verification hidden

---

### Scenario 7: Login with Unverified Email
**Setup:** Create account via signup, but intentionally close before OTP verification

**Alternative Setup:**
1. Directly POST to `/api/auth/register` without verifying
2. Navigate to `/signin`

**Steps:**
1. Enter email from unverified account
2. Enter password
3. Click "Login"

**Expected:**
- Login fails
- Error: "Email not verified"
- OTP verification screen appears automatically
- Same OTP flow as registration

---

### Scenario 8: Successful Login (Verified User)
**Setup:** Have a verified account (completed registration + OTP)

**Steps:**
1. Navigate to `/signin`
2. Enter email: "john@example.com"
3. Enter password: "Test@1234"
4. Click "Login"

**Expected:**
- No errors
- JWT stored in localStorage
- Redirect to `/dashboard`

---

### Scenario 9: Mobile Responsiveness
**Setup:** Any OTP screen on mobile device

**Tests:**
1. Rotate device (portrait → landscape)

**Expected:**
- Layout adjusts smoothly
- OTP input remains large and usable
- Time display doesn't wrap awkwardly
- Buttons remain clickable

2. Test on small screen (320px width)

**Expected:**
- No horizontal scroll
- Text readable
- Input fields full width
- Buttons spaced properly

3. Test on medium screen (768px)

**Expected:**
- Two-column layout works
- Image visible on right side
- Form takes left 50%

---

### Scenario 10: Network Error Handling
**Setup:** At OTP verification screen with network access

**Steps:**
1. Disable internet / unplug network
2. Click "Verify OTP"

**Expected:**
- Error message: "Failed to verify OTP" or network error
- Form remains enabled for retry
- User can re-enable network and try again

3. Re-enable network
4. Click "Verify OTP" again

**Expected:**
- Request succeeds (if OTP still valid)
- Or shows new error if OTP expired/invalid

---

## Edge Cases & Validation

### OTP Input Validation
**Test:** Type non-numeric characters
```
Input: "ABC123"
Expected: Input ignored, only "123" remains
```

**Test:** Paste OTP
```
Input: Paste "123456"
Expected: All 6 digits accepted, input masked
```

**Test:** Max length enforcement
```
Input: Try to enter 7+ digits
Expected: Only 6 digits allowed
```

### Time Display Accuracy
**Test:** Check time format consistency
```
Expected: Issued: 02:34:56 PM | Expires: 02:39:56 PM
Expected: Uses 12-hour format with AM/PM
Expected: Seconds display even if < 10s
```

### State Persistence
**Test:** Refresh page at OTP verification
```
Expected: OTP times should be reset (reload)
Expected: Countdown starts fresh (or very close)
Expected: Form state cleared
```

**Test:** Navigate away and back
```
Expected: Signup/Signin form reloads
Expected: OTP state lost (intentional)
```

### Token Storage
**Test:** Check localStorage after OTP verification
```
JavaScript Console:
localStorage.getItem('authToken')
Expected: Returns JWT token string starting with "eyJ..."
```

**Test:** Check token after page refresh
```
Expected: Dashboard loads (token still valid)
Expected: Auth header sent with token
```

---

## Visual Regression Checklist

### Colors
- [ ] Primary button: Blue (rgba(74,144,226,1))
- [ ] Button hover: Darker blue (rgba(40,96,170,1))
- [ ] Error text: Red (#ef4444)
- [ ] Success text: Green (#10b981)
- [ ] Disabled button: Light gray (#cbd5e1)
- [ ] Time display: Gray text (#6b7280)
- [ ] Progress bar (active): Blue (#3b82f6)
- [ ] Progress bar (expired): Red (#ef4444)

### Typography
- [ ] Heading "Verify Your Email": Bold, larger
- [ ] Email display: Smaller, gray
- [ ] Label text: Small, semi-bold
- [ ] Error/success messages: Small, colored
- [ ] Time display: Smallest size
- [ ] OTP input: Large, monospace font

### Spacing
- [ ] Logo margin: Proper spacing from title
- [ ] Form elements: 16px gaps
- [ ] Time display: Below OTP input with padding
- [ ] Buttons: Proper width (full-width for primary)
- [ ] Section gaps: 24px between major sections

### Disabled States
- [ ] Disabled input: Grayed background
- [ ] Disabled button: Lower opacity
- [ ] Disabled button: Not clickable (cursor change)

---

## Debugging Tips

### Browser Console Checks
```javascript
// Check token storage
localStorage.getItem('authToken')

// Check API requests (Network tab)
// Look for: POST /api/auth/register
//           POST /api/auth/verify-email-otp
//           POST /api/auth/resend-email-otp

// Check component state (React DevTools)
// OTPVerification component → Props & State
```

### Backend Console Logs
```
Look for [EMAIL FALLBACK] logs:
[EMAIL FALLBACK] OTP for email: john@example.com: 123456
[EMAIL FALLBACK] OTP for email: john@example.com: 654321 (resend)
```

### Common Issues

**Issue: OTP input won't accept input**
- Check if form is disabled (max attempts/expired)
- Check if JavaScript is running
- Check browser console for errors

**Issue: Timer doesn't countdown**
- Check browser time (may be wrong)
- Check browser DevTools → Application → localStorage
- Try hard refresh (Ctrl+Shift+R)

**Issue: Token not storing**
- Check localStorage access: `localStorage.setItem('test', '1')`
- Check for browser privacy mode (blocks localStorage)
- Check console for errors

**Issue: Redirect not working**
- Check if JWT actually stored
- Check browser console for routing errors
- Check if `/dashboard` route exists

**Issue: OTP not appearing in console**
- Ensure backend is running
- Check backend console (not frontend)
- Look for SMTP vs EMAIL FALLBACK logs
- Verify database OTP creation

---

## Automated Testing (Future)

### Unit Tests
```javascript
// Test OTP validation
test('OTP input only accepts 6 digits', () => {
  // Input "ABC123" → Expected: "123"
});

// Test time formatting
test('Time display formats correctly', () => {
  // Input: new Date()
  // Expected: "02:34:56 PM"
});
```

### Integration Tests
```javascript
// Test complete registration flow
test('User can register and verify OTP', async () => {
  // 1. Fill signup form
  // 2. Submit
  // 3. Enter OTP
  // 4. Verify
  // 5. Check redirect
});
```

### E2E Tests (Cypress/Playwright)
```javascript
// Test full user journey
describe('OTP Flow', () => {
  it('should register user and verify email', () => {
    // Navigate to signup
    // Fill form
    // Submit
    // Extract OTP from backend
    // Verify
    // Redirect
  });
});
```

---

## Performance Checklist

- [ ] OTP verification response < 2 seconds
- [ ] Page load time < 2 seconds
- [ ] Countdown updates smooth (60fps)
- [ ] No memory leaks on cleanup
- [ ] No unnecessary re-renders
- [ ] Network tab shows no failed requests

---

## Success Criteria

✅ **Basic Flow:**
- [ ] Registration → OTP screen
- [ ] OTP verification → Dashboard
- [ ] Unverified login → OTP screen

✅ **Countdown & Time:**
- [ ] Timer counts down correctly
- [ ] Time display shows Issued & Expiry
- [ ] Progress bar syncs with countdown

✅ **Validation:**
- [ ] OTP input accepts only digits
- [ ] Max attempts enforced
- [ ] Max resends enforced

✅ **UX:**
- [ ] Clear error messages
- [ ] Smooth transitions
- [ ] Mobile responsive

✅ **Security:**
- [ ] JWT stored securely
- [ ] Logout clears token
- [ ] Protected routes checked

---

## Sign-Off
When all tests pass:
- [ ] Screenshot success flow
- [ ] Screenshot error handling
- [ ] Verify mobile on device
- [ ] Get stakeholder approval
- [ ] Deploy to production

**Ready for Production:** ✅
