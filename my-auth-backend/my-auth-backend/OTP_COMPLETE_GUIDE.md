# OTP-Based Authentication System - Complete Setup Guide

## 📋 Overview
This system provides secure email-based OTP authentication with:
- ✅ Email verification during signup
- ✅ Secure login with verified emails only
- ✅ Password reset with OTP
- ✅ Protection against brute force attacks
- ✅ Automatic OTP expiration
- ✅ Rate limiting

---

## 🚀 Quick Start

### 1. Backend Setup

#### Install Dependencies
```bash
cd my-auth-backend/my-auth-backend
npm install nodemailer
```

#### Configure Email Service (.env)
Add these environment variables to your `.env` file:

```env
# Existing variables
MONGO_URI=mongodb://localhost:27017/mealvista
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PORT=5000

# NEW: Email Configuration for OTP
# For Gmail (Recommended for development):
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
# Note: Use Gmail App Password, not regular password

# Alternative: Generic SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
NODE_ENV=development
```

#### How to Get Gmail App Password:
1. Go to https://myaccount.google.com/security
2. Enable 2-Factor Authentication
3. Go to "App passwords"
4. Generate a new app password for "Mail"
5. Copy the 16-character password
6. Use it in `SMTP_PASS`

### 2. Start Backend Server
```bash
cd my-auth-backend/my-auth-backend
npm start
# or
node server.js
```

### 3. Frontend Setup
No additional dependencies needed. The OTP screens are already created.

---

## 📁 File Structure

### Backend Files
```
my-auth-backend/
├── models/
│   ├── User.js              # User model with email verification
│   └── OTP.js               # OTP model with expiry and attempts
├── routes/
│   └── otp-auth.js          # All OTP authentication routes
├── services/
│   └── emailService.js      # Email sending service
└── server.js                # Main server file
```

### Frontend Files
```
mealvista-frontend-main/app/
├── signup.tsx               # Updated with OTP flow
├── verifyEmailOTP.tsx       # Email verification screen (NEW)
├── verifyOTP.tsx            # Password reset OTP screen
├── forgotPassword.tsx       # Forgot password screen
└── resetPasswordNew.tsx     # Set new password screen
```

---

## 🔐 Security Features

### 1. OTP Protection
- **Random 6-digit codes**: Generated using crypto-secure random
- **10-minute expiration**: OTPs expire automatically
- **Max 5 attempts**: Prevents brute force attacks
- **One-time use**: OTPs cannot be reused

### 2. Rate Limiting
- **Signup**: Max 3 OTP requests per 15 minutes per email
- **Login**: Max 5 attempts per 15 minutes per email
- **Password Reset**: Max 3 requests per 15 minutes per email
- **Resend OTP**: Max 3 resends per 15 minutes

### 3. Password Security
- **Minimum requirements**: 8+ characters, 1 uppercase, 1 lowercase, 1 number
- **Bcrypt hashing**: Passwords stored with salt rounds = 10
- **No plain text**: Passwords never stored or transmitted in plain text

### 4. Database Security
- **TTL Index**: Expired OTPs auto-deleted from database
- **Indexed queries**: Fast lookups prevent timing attacks
- **Soft deletes**: User accounts marked deleted, not removed

---

## 📡 API Endpoints

### 1. Signup Flow

#### Step 1: Request OTP
```http
POST /api/otp-auth/signup/request-otp
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@gmail.com",
  "password": "SecurePass123"
}

Response:
{
  "message": "OTP sent to your email. Please verify within 10 minutes",
  "email": "john@gmail.com",
  "expiresIn": 600
}
```

#### Step 2: Verify OTP & Create Account
```http
POST /api/otp-auth/signup/verify-otp
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@gmail.com",
  "password": "SecurePass123",
  "otp": "123456"
}

Response:
{
  "message": "Account created successfully",
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "name": "John Doe",
    "email": "john@gmail.com",
    "isEmailVerified": true
  }
}
```

### 2. Login
```http
POST /api/otp-auth/login
Content-Type: application/json

{
  "email": "john@gmail.com",
  "password": "SecurePass123"
}

Success Response:
{
  "message": "Login successful",
  "token": "jwt-token-here",
  "user": { ... }
}

If Email Not Verified:
{
  "message": "Email not verified. A new verification OTP has been sent",
  "requiresVerification": true,
  "email": "john@gmail.com"
}
```

### 3. Forgot Password Flow

#### Step 1: Request Password Reset OTP
```http
POST /api/otp-auth/forgot-password/request-otp
Content-Type: application/json

{
  "email": "john@gmail.com"
}

Response:
{
  "message": "Password reset OTP sent to your email",
  "expiresIn": 600
}
```

#### Step 2: Verify OTP
```http
POST /api/otp-auth/forgot-password/verify-otp
Content-Type: application/json

{
  "email": "john@gmail.com",
  "otp": "123456"
}

Response:
{
  "message": "OTP verified. You can now reset your password",
  "resetToken": "temporary-reset-token"
}
```

#### Step 3: Reset Password
```http
POST /api/otp-auth/reset-password
Content-Type: application/json

{
  "resetToken": "temporary-reset-token",
  "newPassword": "NewSecurePass123"
}

Response:
{
  "message": "Password reset successfully. You can now login with your new password"
}
```

### 4. Resend OTP
```http
POST /api/otp-auth/resend-otp
Content-Type: application/json

{
  "email": "john@gmail.com",
  "purpose": "email_verification" // or "password_reset"
}

Response:
{
  "message": "OTP sent successfully",
  "expiresIn": 600
}
```

---

## 🧪 Testing Guide

### Test Signup with OTP

1. **Start Backend** (Terminal 1):
```bash
cd my-auth-backend/my-auth-backend
node server.js
```

2. **Start Frontend** (Terminal 2):
```bash
cd mealvista-frontend-main
npx expo start
```

3. **Test Flow**:
   - Open app in browser or device
   - Go to Signup screen
   - Enter: Name, Email, Password
   - Click "Sign Up"
   - Check email for OTP code
   - Enter 6-digit OTP
   - Account should be created
   - Navigate to dietary preference

### Test Login
1. Enter email and password
2. If email not verified → OTP sent automatically
3. If verified → Login successful

### Test Forgot Password
1. Click "Forgot Password"
2. Enter email
3. Check email for OTP
4. Enter OTP
5. Set new password
6. Login with new password

### Check Email Console Logs
If SMTP not configured, OTP will be logged to console:
```
📧 ========== EMAIL (CONSOLE LOG) ==========
To: john@gmail.com
OTP: 123456
==========================================
```

---

## 🐛 Error Handling

### Common Errors

#### "Email service not configured"
**Solution**: Add `SMTP_USER` and `SMTP_PASS` to `.env`

#### "Too many OTP requests"
**Solution**: Wait 15 minutes or restart server (clears rate limit)

#### "OTP has expired"
**Solution**: Request new OTP

#### "Invalid OTP. X attempts remaining"
**Solution**: Check email for correct OTP

#### "MongoDB connection failed"
**Solution**: Ensure MongoDB is running
```bash
# Start MongoDB
mongod --dbpath ./data/db
```

---

## 📊 Database Schema

### User Model
```javascript
{
  name: String,
  email: String (unique, lowercase),
  password: String (hashed),
  isEmailVerified: Boolean,
  emailVerifiedAt: Date,
  role: String ('user' | 'admin'),
  googleId: String (optional),
  isDeleted: Boolean,
  lastLoginAt: Date,
  passwordResetAt: Date,
  createdAt: Date
}
```

### OTP Model
```javascript
{
  email: String (lowercase),
  otp: String (6 digits),
  purpose: String ('email_verification' | 'password_reset'),
  attempts: Number (max 5),
  expiresAt: Date (TTL index),
  verified: Boolean,
  createdAt: Date
}
```

---

## 🔧 Configuration Options

### Customize OTP Expiry
In `routes/otp-auth.js`, change the expiry time:
```javascript
// Default: 10 minutes
const otpDoc = await OTP.createOTP(email, purpose, 10);

// Change to 5 minutes
const otpDoc = await OTP.createOTP(email, purpose, 5);
```

### Customize Rate Limits
In `routes/otp-auth.js`, modify `checkRateLimit` calls:
```javascript
// Default: 3 attempts per 15 minutes
const rateLimit = checkRateLimit(`signup:${email}`, 3, 15 * 60 * 1000);

// Change to 5 attempts per 30 minutes
const rateLimit = checkRateLimit(`signup:${email}`, 5, 30 * 60 * 1000);
```

---

## 📝 Success Messages

### Signup Success
```
✅ User registered successfully: john@gmail.com
```

### Login Success
```
✅ User logged in successfully: john@gmail.com
```

### OTP Sent
```
✅ OTP sent to john@gmail.com: 123456
```

### Password Reset
```
✅ Password reset successfully for: john@gmail.com
```

---

## 🎯 Best Practices

1. **Always use HTTPS in production**
2. **Use strong JWT_SECRET (min 32 characters)**
3. **Enable 2FA for email account**
4. **Use environment-specific configs**
5. **Monitor rate limit logs**
6. **Regularly clear expired OTPs (auto-handled)**
7. **Use Redis for rate limiting in production**
8. **Set up email monitoring/alerts**

---

## 🚨 Production Checklist

- [ ] Configure real SMTP service (SendGrid, AWS SES, etc.)
- [ ] Set strong JWT_SECRET
- [ ] Enable HTTPS/TLS
- [ ] Use Redis for rate limiting
- [ ] Set up email delivery monitoring
- [ ] Configure CORS properly
- [ ] Add request logging
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Enable database backups
- [ ] Use environment variables for all secrets

---

## 📞 Support

For issues or questions:
1. Check console logs for errors
2. Verify .env configuration
3. Test email service separately
4. Check MongoDB connection
5. Review API request/response logs

---

## ✨ Features Summary

✅ Secure OTP-based email verification  
✅ Password reset with OTP  
✅ Brute force protection  
✅ Rate limiting  
✅ Automatic OTP expiration  
✅ Beautiful email templates  
✅ Error handling with helpful messages  
✅ Console logging for debugging  
✅ Mobile-friendly UI  
✅ Support for Gmail, SMTP, and custom providers  

**System is ready to use!** 🎉
