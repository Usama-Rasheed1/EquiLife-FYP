# Frontend OTP Integration - Deployment Checklist

## Pre-Deployment Review

### Code Quality
- [ ] All files properly formatted and indented
- [ ] No console.log() statements left for debugging
- [ ] No commented-out code blocks
- [ ] Import statements organized and cleaned up
- [ ] No unused variables or imports
- [ ] Error handling is comprehensive
- [ ] No hardcoded URLs or credentials
- [ ] All environment variables used correctly

### Dependencies
- [ ] axios already installed (verify in package.json)
- [ ] lucide-react already installed
- [ ] react and react-router-dom compatible
- [ ] All imports resolve without errors
- [ ] No missing peer dependencies

### Environment Configuration
- [ ] `.env` file has `VITE_BACKEND_BASE_URL`
- [ ] Backend URL is correct (http://localhost:5001 for dev)
- [ ] CORS enabled on backend for frontend domain
- [ ] All sensitive data in .env (never in code)

---

## Testing Checklist

### Functional Testing
- [ ] Registration flow works (Signup → OTP → Dashboard)
- [ ] OTP verification succeeds with valid code
- [ ] OTP verification fails with invalid code
- [ ] OTP expires after 5 minutes
- [ ] Resend OTP works and resets timer
- [ ] Max resend limit (3) enforced
- [ ] Max attempt limit (5) enforced
- [ ] Back to signup button works
- [ ] Login works for verified users
- [ ] Unverified users see OTP screen on login
- [ ] JWT token stored in localStorage
- [ ] Page refresh maintains login state

### Error Handling
- [ ] Network errors handled gracefully
- [ ] Invalid email format caught
- [ ] Empty OTP field shows validation error
- [ ] OTP with non-digits rejected
- [ ] Server errors display user-friendly messages
- [ ] Rate limiting errors handled
- [ ] 403 responses trigger OTP verification

### UI/UX Testing
- [ ] Form inputs are accessible (keyboard navigation)
- [ ] Error messages are clear and helpful
- [ ] Success messages appear and fade
- [ ] Disabled states are visually distinct
- [ ] Countdown timer updates smoothly
- [ ] Time display is accurate
- [ ] Buttons are properly clickable
- [ ] Loading state shows feedback
- [ ] Mobile layout is responsive
- [ ] All text is readable on small screens

### Security Testing
- [ ] OTP stored as hash, not plaintext
- [ ] Timing-safe comparison used
- [ ] Rate limiting prevents brute force
- [ ] Sensitive data not logged
- [ ] JWT not exposed in Network tab
- [ ] localStorage used for token storage
- [ ] Password fields properly masked
- [ ] No sensitive data in error messages

### Browser Compatibility
- [ ] Chrome latest version
- [ ] Firefox latest version
- [ ] Safari latest version
- [ ] Edge latest version
- [ ] Mobile browsers (Chrome, Safari)

### Performance Testing
- [ ] Form loads in < 2 seconds
- [ ] OTP submit response < 2 seconds
- [ ] No memory leaks on navigation
- [ ] No console errors or warnings
- [ ] Smooth animations (60fps)
- [ ] No layout shifts during load

---

## Integration Steps

### Step 1: Verify Files Created
```bash
# Check all new files exist
ls -la src/services/authService.js
ls -la src/components/OTPVerification.jsx
ls -la FRONTEND_OTP_TESTING_GUIDE.md
ls -la FRONTEND_OTP_QUICK_REFERENCE.md
ls -la src/components/OTP_INTEGRATION_README.md
ls -la FRONTEND_OTP_VISUAL_GUIDE.md
```

### Step 2: Verify Backend Running
```bash
# Terminal 1: Start backend
cd backend
npm start
# Expected: Server running on port 5001
```

### Step 3: Check Environment
```bash
# Verify .env exists
cat .env
# Should contain:
# VITE_BACKEND_BASE_URL=http://localhost:5001
```

### Step 4: Start Frontend
```bash
# Terminal 2: Start frontend
npm run dev
# Expected: Running on http://localhost:5173
```

### Step 5: Run Tests
```bash
# In browser console:
localStorage.getItem('authToken')  // Initially: null

# After signup + OTP verification:
localStorage.getItem('authToken')  // Should: eyJ... (JWT)
```

### Step 6: Manual Test Scenarios
- [ ] Register new user
- [ ] Verify OTP from console log
- [ ] Check JWT in localStorage
- [ ] Refresh page, verify still logged in
- [ ] Navigate to protected route
- [ ] Logout and verify token cleared

---

## Database Preparation

### MongoDB Setup
Ensure these collections exist:
```javascript
// users collection
{
  _id: ObjectId,
  email: "user@example.com",
  password: "hashed_password",
  fullName: "John Doe",
  isVerified: false,  // NEW FIELD - important!
  createdAt: Date,
  updatedAt: Date
}

// otps collection
{
  _id: ObjectId,
  userId: ObjectId,
  email: "user@example.com",
  otpHash: "sha256_hash",
  expiresAt: Date,     // TTL index on this field
  attempts: 0,
  resendCount: 0,
  createdAt: Date,
  updatedAt: Date
}
```

### TTL Index (Auto-Delete)
```javascript
// Run in MongoDB shell to create TTL index:
db.otps.createIndex( { "expiresAt": 1 }, { expireAfterSeconds: 0 } )
```

---

## API Validation

### Test Each Endpoint

#### 1. Register Endpoint
```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "email": "test@example.com",
    "password": "Test@1234"
  }'

# Expected Response (201):
# {
#   "message": "OTP sent to email",
#   "email": "test@example.com"
# }
```

#### 2. Verify OTP Endpoint
```bash
# Check backend console for OTP: [EMAIL FALLBACK] OTP for email: 123456

curl -X POST http://localhost:5001/api/auth/verify-email-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "otp": "123456"
  }'

# Expected Response (200):
# {
#   "accessToken": "eyJhbGc...",
#   "user": { "id": "...", "email": "test@example.com" }
# }
```

#### 3. Resend OTP Endpoint
```bash
curl -X POST http://localhost:5001/api/auth/resend-email-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'

# Expected Response (200):
# {
#   "message": "New OTP sent",
#   "email": "test@example.com",
#   "resendCount": 1
# }
```

#### 4. Login Endpoint (Verified User)
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@1234"
  }'

# Expected Response (200):
# {
#   "accessToken": "eyJhbGc...",
#   "user": { "id": "...", "email": "test@example.com" }
# }
```

#### 5. Login Endpoint (Unverified User)
```bash
# Register but don't verify OTP

curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "unverified@example.com",
    "password": "Test@1234"
  }'

# Expected Response (403):
# {
#   "statusCode": 403,
#   "message": "Email not verified",
#   "requiresOTPVerification": true
# }
```

---

## Browser DevTools Checks

### Application Tab
```
localStorage:
  authToken: (JWT token after verification)

Cookies:
  (None set in this implementation)
```

### Network Tab
During signup → OTP verification:
```
POST /api/auth/register → 201 Created
POST /api/auth/verify-email-otp → 200 OK

Headers checked:
- Content-Type: application/json
- Accept: application/json
```

### Console Tab
```
No red errors
No yellow warnings
Logs visible:
  - API calls being made
  - State changes
  - Navigation events

Check for [EMAIL FALLBACK] logs from backend
```

### React DevTools
```
Component tree:
  App
    ├── Routes
    │   ├── Signup (with OTPVerification conditionally)
    │   ├── Signin (with OTPVerification conditionally)
    │   ├── Dashboard (protected)
    │   └── ...
    └── ...

OTPVerification component state:
  - otp: "123456"
  - timeRemaining: 240
  - attempts: 0
  - canResend: true
  - etc.
```

---

## Performance Monitoring

### Lighthouse Checks
```
Performance: > 80
Accessibility: > 90
Best Practices: > 90
SEO: > 90
```

### Core Web Vitals
```
LCP (Largest Contentful Paint): < 2.5s
FID (First Input Delay): < 100ms
CLS (Cumulative Layout Shift): < 0.1
```

### Network Performance
```
DOM Content Loaded: < 1s
Page Load: < 2s
OTP Submit: < 2s
API Response: < 500ms
```

---

## Security Checklist

### Frontend Security
- [ ] No hardcoded credentials
- [ ] Sensitive data in .env only
- [ ] CORS properly configured
- [ ] No sensitive data in localStorage keys
- [ ] XSS protection via React escaping
- [ ] CSRF protection headers checked
- [ ] Input validation before submission
- [ ] Error messages don't expose sensitive info

### Backend Security (Verify)
- [ ] OTP hashed before storage
- [ ] Timing-safe comparison for OTP
- [ ] Rate limiting on all auth endpoints
- [ ] CORS headers set correctly
- [ ] HTTPS enforced (in production)
- [ ] Password hashing with bcryptjs
- [ ] JWT expiry set appropriately
- [ ] Environment variables loaded securely

### Data Privacy
- [ ] User data encrypted in transit (HTTPS)
- [ ] Password never logged or exposed
- [ ] OTP never returned in plaintext
- [ ] JWT stored securely
- [ ] User consent for data collection

---

## Production Deployment

### Before Going Live

#### Backend
- [ ] Update API base URL in .env
- [ ] Configure SMTP for real email sending
- [ ] Set JWT expiry appropriately (e.g., 7 days)
- [ ] Enable HTTPS
- [ ] Configure CORS for production domain
- [ ] Set rate limits appropriately
- [ ] Enable database backups
- [ ] Configure error logging/monitoring
- [ ] Test OTP email delivery
- [ ] Verify password requirements

#### Frontend
- [ ] Update VITE_BACKEND_BASE_URL to production URL
- [ ] Build: `npm run build`
- [ ] Test built version locally
- [ ] Run Lighthouse audit
- [ ] Test on production backend
- [ ] Enable HTTPS
- [ ] Configure CSP headers
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Verify all API calls use HTTPS
- [ ] Remove development console logs

#### Database
- [ ] Backup all data
- [ ] Verify TTL index on OTP collection
- [ ] Verify isVerified field on users
- [ ] Check database connection string
- [ ] Enable database backups
- [ ] Monitor database size
- [ ] Set up alerts for errors

#### Infrastructure
- [ ] SSL certificate configured
- [ ] CORS headers set
- [ ] Environment variables set
- [ ] Database accessible
- [ ] Server memory sufficient
- [ ] Disk space available
- [ ] Monitoring set up (CPU, memory, disk)
- [ ] Alerting configured
- [ ] Logging configured

### Deployment Steps

1. **Build Frontend**
   ```bash
   cd frontend
   npm run build
   # Creates dist/ folder
   ```

2. **Deploy Frontend**
   ```bash
   # Upload dist/ folder to web server
   # or use deployment service (Vercel, Netlify, etc.)
   ```

3. **Deploy Backend**
   ```bash
   # Deploy to production server
   # Set environment variables
   # Start server
   ```

4. **Database Migration**
   ```bash
   # Add isVerified field to existing users (set to true for old users)
   # Create TTL index on OTP collection
   ```

5. **Smoke Tests**
   ```bash
   # Test full signup → OTP → dashboard flow
   # Test login for existing verified user
   # Test unverified user login → OTP flow
   # Verify email sending works
   ```

---

## Rollback Plan

If issues occur:

1. **Frontend Issues**
   ```bash
   # Redeploy previous version from git
   git checkout <previous-commit>
   npm run build
   # Deploy previous build
   ```

2. **Backend Issues**
   ```bash
   # Stop current server
   # Restore previous environment
   # Restart with previous version
   # Verify database integrity
   ```

3. **Database Issues**
   ```bash
   # Restore from backup
   # Verify data consistency
   # Restart services
   ```

---

## Post-Deployment Monitoring

### Daily Checks (First Week)
- [ ] No error alerts
- [ ] Registration success rate > 95%
- [ ] OTP verification success rate > 90%
- [ ] Login success rate > 95%
- [ ] Page load time < 2s
- [ ] API response time < 500ms
- [ ] No security warnings
- [ ] Email delivery working

### Weekly Checks
- [ ] User feedback review
- [ ] Performance metrics analysis
- [ ] Error logs review
- [ ] Database size monitoring
- [ ] Backup verification
- [ ] Rate limit effectiveness
- [ ] Security scan results

### Monthly Reviews
- [ ] User statistics
- [ ] Conversion funnel analysis
- [ ] Error trend analysis
- [ ] Performance optimization opportunities
- [ ] Security audit
- [ ] Cost analysis

---

## Support & Maintenance

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| OTP email not arriving | Check SMTP config, verify email domain |
| High failure rate on verify | Check rate limiting, verify OTP generation |
| Users locked out | Monitor max attempts, alert on failures |
| Token not persisting | Verify localStorage, check cookie settings |
| Slow OTP verification | Check database indexes, verify API response time |

### Emergency Contacts
- Backend team: [contact]
- DevOps team: [contact]
- Security team: [contact]
- Database team: [contact]

### Documentation Updates
- [ ] Update API docs with new endpoints
- [ ] Update user docs with signup process
- [ ] Update admin docs for monitoring
- [ ] Update support docs for troubleshooting

---

## Sign-Off Checklist

- [ ] Development complete and tested
- [ ] Code reviewed by team
- [ ] Documentation complete
- [ ] API validated against spec
- [ ] Database schema verified
- [ ] Security audit passed
- [ ] Performance requirements met
- [ ] All tests passing
- [ ] Staging deployment successful
- [ ] Production deployment approved
- [ ] Monitoring configured
- [ ] Support team trained
- [ ] Ready for go-live ✅

---

**Status: Ready for Deployment** ✅
**Date: January 2026**
**Last Updated: [Current Date]**
