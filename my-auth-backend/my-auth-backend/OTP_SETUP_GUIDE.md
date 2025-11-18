# OTP-Based Authentication System - Complete Setup Guide

## 📋 Overview

This is a complete email verification and password reset system using OTP (One-Time Password) for the MealVista application.

### Features Implemented:
✅ Signup with email verification using 6-digit OTP  
✅ OTP sent via email (expires in 10 minutes)  
✅ Login only allowed for verified emails  
✅ Forgot password with OTP verification  
✅ Reset password flow  
✅ Rate limiting to prevent brute force attacks  
✅ Secure password hashing with bcrypt  
✅ OTP attempt limits (max 5 attempts)  
✅ Automatic cleanup of expired OTPs  
✅ Email validation  
✅ Password strength validation  

---

## 🚀 Step 1: Install Dependencies

Navigate to your backend directory and install required packages:

```bash
cd my-auth-backend/my-auth-backend
npm install nodemailer
```

---

## 🔧 Step 2: Environment Variables Setup

Update your `.env` file with SMTP credentials:

```env
# Existing variables
MONGO_URI=mongodb://localhost:27017/mealvista
JWT_SECRET=your_jwt_secret_key_here
PORT=5000

# New SMTP Email Settings
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=xpok slzt fckk bmku

# For Gmail, you need to:
# 1. Enable 2-Factor Authentication
# 2. Generate an "App Password" at: https://myaccount.google.com/apppasswords
# 3. Use the 16-character app password (not your regular password)

NODE_ENV=development
```

### Gmail Setup Instructions:
1. Go to Google Account → Security
2. Enable 2-Step Verification
3. Go to "App passwords" (https://myaccount.google.com/apppasswords)
4. Select "Mail" and "Other (Custom name)"
5. Name it "MealVista Backend"
6. Copy the 16-character password
7. Paste it in `SMTP_PASS` in your .env file

### Alternative Email Services:
- **SendGrid**: `SMTP_HOST=smtp.sendgrid.net`, `SMTP_PORT=587`
- **Mailgun**: `SMTP_HOST=smtp.mailgun.org`, `SMTP_PORT=587`
- **Amazon SES**: Use AWS SES SMTP credentials

---

## 📁 Step 3: File Structure

Your backend should now have:

```
my-auth-backend/
├── models/
│   ├── User.js          (✅ Updated with email verification fields)
│   └── OTP.js           (✅ New - OTP model)
├── routes/
│   ├── auth.js          (Existing - keeps old auth)
│   └── otp-auth.js      (✅ New - OTP-based auth routes)
├── services/
│   └── emailService.js  (✅ New - Email sending service)
├── server.js            (✅ Updated with OTP routes)
└── .env                 (✅ Updated with SMTP credentials)
```

---

## 🔌 Step 4: API Endpoints

### Base URL: `http://localhost:5000/api/otp-auth`

### 1️⃣ Signup Flow

#### **Step 1: Request OTP**
```http
POST /api/otp-auth/signup/request-otp
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@gmail.com",
  "password": "SecurePass123"
}
```

**Success Response (200)**:
```json
{
  "message": "OTP sent to your email. Please verify within 10 minutes",
  "email": "john@gmail.com",
  "expiresIn": 600
}
```

**Error Responses**:
- `400`: Email already registered
- `400`: Invalid email format
- `400`: Weak password
- `429`: Too many OTP requests (rate limited)

---

#### **Step 2: Verify OTP and Create Account**
```http
POST /api/otp-auth/signup/verify-otp
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@gmail.com",
  "password": "SecurePass123",
  "otp": "123456"
}
```

**Success Response (201)**:
```json
{
  "message": "Account created successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "674e3f2a1b2c3d4e5f6g7h8i",
    "name": "John Doe",
    "email": "john@gmail.com",
    "role": "user",
    "isAdmin": false,
    "isEmailVerified": true
  }
}
```

**Error Responses**:
- `400`: Invalid OTP
- `400`: OTP expired
- `400`: Too many failed attempts

---

### 2️⃣ Login

```http
POST /api/otp-auth/login
Content-Type: application/json

{
  "email": "john@gmail.com",
  "password": "SecurePass123"
}
```

**Success Response (200)**:
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "674e3f2a1b2c3d4e5f6g7h8i",
    "name": "John Doe",
    "email": "john@gmail.com",
    "role": "user",
    "isAdmin": false,
    "isEmailVerified": true
  }
}
```

**Error Responses**:
- `401`: Invalid email or password
- `403`: Email not verified (OTP will be sent automatically)
- `429`: Too many login attempts

**Special Case - Unverified Email (403)**:
```json
{
  "message": "Email not verified. A new verification OTP has been sent to your email",
  "requiresVerification": true,
  "email": "john@gmail.com"
}
```
When you get this response, redirect user to OTP verification screen.

---

### 3️⃣ Resend OTP

```http
POST /api/otp-auth/resend-otp
Content-Type: application/json

{
  "email": "john@gmail.com",
  "purpose": "email_verification"
}
```

**Purpose values**:
- `"email_verification"` - For signup verification
- `"password_reset"` - For forgot password

**Success Response (200)**:
```json
{
  "message": "OTP sent successfully",
  "expiresIn": 600
}
```

---

### 4️⃣ Forgot Password Flow

#### **Step 1: Request Password Reset OTP**
```http
POST /api/otp-auth/forgot-password/request-otp
Content-Type: application/json

{
  "email": "john@gmail.com"
}
```

**Success Response (200)**:
```json
{
  "message": "Password reset OTP sent to your email",
  "expiresIn": 600
}
```

---

#### **Step 2: Verify OTP**
```http
POST /api/otp-auth/forgot-password/verify-otp
Content-Type: application/json

{
  "email": "john@gmail.com",
  "otp": "123456"
}
```

**Success Response (200)**:
```json
{
  "message": "OTP verified. You can now reset your password",
  "resetToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Note**: Save this `resetToken` - you'll need it for the next step. It expires in 15 minutes.

---

#### **Step 3: Reset Password**
```http
POST /api/otp-auth/reset-password
Content-Type: application/json

{
  "resetToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "newPassword": "NewSecurePass456"
}
```

**Success Response (200)**:
```json
{
  "message": "Password reset successfully. You can now login with your new password"
}
```

---

## 🧪 Step 5: Testing the System

### Option A: Using Postman/Insomnia

1. **Test Signup**:
   - Send POST to `/api/otp-auth/signup/request-otp`
   - Check your email for the OTP
   - Send POST to `/api/otp-auth/signup/verify-otp` with the OTP

2. **Test Login**:
   - Send POST to `/api/otp-auth/login` with verified credentials

3. **Test Forgot Password**:
   - Send POST to `/api/otp-auth/forgot-password/request-otp`
   - Check email for OTP
   - Send POST to `/api/otp-auth/forgot-password/verify-otp`
   - Send POST to `/api/otp-auth/reset-password`

### Option B: Using curl

```bash
# 1. Signup - Request OTP
curl -X POST http://localhost:5000/api/otp-auth/signup/request-otp \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@gmail.com","password":"Test1234"}'

# 2. Signup - Verify OTP (replace 123456 with actual OTP from email)
curl -X POST http://localhost:5000/api/otp-auth/signup/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@gmail.com","password":"Test1234","otp":"123456"}'

# 3. Login
curl -X POST http://localhost:5000/api/otp-auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@gmail.com","password":"Test1234"}'
```

---

## 🔒 Security Features

### 1. **Rate Limiting**
- Signup OTP requests: 3 requests per 15 minutes per email
- Login attempts: 5 attempts per 15 minutes per email
- Forgot password: 3 requests per 15 minutes per email
- Resend OTP: 3 requests per 15 minutes per email

### 2. **OTP Security**
- Random 6-digit code
- Expires in 10 minutes
- Maximum 5 verification attempts
- Automatically deleted after expiry (MongoDB TTL)
- Previous OTPs invalidated when new one is generated

### 3. **Password Security**
- Minimum 8 characters
- Must include: uppercase, lowercase, and number
- Hashed using bcrypt (salt rounds: 10)
- Passwords never stored in plain text

### 4. **Email Validation**
- Checks valid email format
- Normalizes to lowercase
- Trims whitespace

### 5. **Brute Force Prevention**
- Rate limiting on all endpoints
- Account lockout after failed attempts
- Temporary blocks (15 minutes)

### 6. **Replay Attack Prevention**
- OTPs are single-use (marked as verified)
- Reset tokens expire in 15 minutes
- JWT tokens have expiration

---

## 📧 Email Templates

The system includes beautiful HTML email templates with:
- Professional design with gradients
- Clear OTP display
- Security warnings
- Expiry information
- MealVista branding

**Email Preview** (Check console logs in development):
```
📧 ========== EMAIL (CONSOLE LOG) ==========
To: user@gmail.com
Subject: Verify Your Email - MealVista
OTP: 123456
==========================================
```

---

## ⚠️ Error Handling

### Common Error Messages:

| Code | Message | Action |
|------|---------|--------|
| 400 | Invalid email format | Check email syntax |
| 400 | Password must be at least 8 characters... | Use stronger password |
| 400 | Invalid OTP | Re-enter correct OTP |
| 400 | OTP has expired | Request new OTP |
| 400 | Too many failed attempts | Request new OTP |
| 401 | Invalid email or password | Check credentials |
| 403 | Email not verified | Verify email first |
| 429 | Too many OTP requests | Wait 15 minutes |
| 500 | Server error | Check server logs |

---

## 🎯 Success Messages

- ✅ "OTP sent to your email. Please verify within 10 minutes"
- ✅ "Account created successfully"
- ✅ "Login successful"
- ✅ "OTP verified successfully"
- ✅ "Password reset successfully"
- ✅ "OTP sent successfully"

---

## 🔄 Migration from Old Auth

If you want to migrate existing users:

1. **Keep both systems running** (old `/api/auth` and new `/api/otp-auth`)
2. **Existing users**: Can continue using `/api/auth/login`
3. **New users**: Use `/api/otp-auth` endpoints
4. **Gradual migration**: On next login, prompt users to verify their email

---

## 🐛 Troubleshooting

### Problem: Emails not sending

**Solution**:
1. Check SMTP credentials in `.env`
2. For Gmail, ensure:
   - 2FA is enabled
   - Using App Password (not regular password)
   - "Less secure app access" is OFF (use App Password instead)
3. Check console logs for email errors
4. In development, emails are logged to console if SMTP fails

### Problem: OTP expired immediately

**Solution**:
- Check server timezone
- Ensure MongoDB TTL index is working
- OTP expiry is 10 minutes by default

### Problem: Rate limit hit

**Solution**:
- Wait 15 minutes
- In development, restart server to clear in-memory rate limits
- In production, use Redis for rate limiting

### Problem: "Email already registered"

**Solution**:
- User needs to login instead of signup
- Or use forgot password if they forgot credentials

---

## 📱 Next Steps: Frontend Integration

See `FRONTEND_INTEGRATION.md` for React Native code examples.

---

## 📝 Database Schema

### User Collection:
```javascript
{
  name: String,
  email: String (unique, lowercase),
  password: String (hashed),
  isEmailVerified: Boolean (default: false),
  emailVerifiedAt: Date,
  role: String ('user' or 'admin'),
  isAdmin: Boolean,
  lastLoginAt: Date,
  passwordResetAt: Date,
  createdAt: Date
}
```

### OTP Collection:
```javascript
{
  email: String,
  otp: String (6 digits),
  purpose: String ('email_verification' or 'password_reset'),
  attempts: Number (max: 5),
  expiresAt: Date (TTL index),
  verified: Boolean,
  createdAt: Date
}
```

---

## 🎉 Congratulations!

Your OTP-based authentication system is now fully configured! 

Test it thoroughly before deploying to production.
