# Frontend Integration - OTP Authentication

## 📱 New Screens Created

1. **verifyOTP.tsx** - OTP verification screen
2. **forgotPassword.tsx** - Forgot password screen
3. **resetPasswordNew.tsx** - New password creation screen

## 🔄 Integration Steps

### 1. Update Signup Flow

Modify your existing `signup.tsx` to use OTP verification:

```typescript
// In signup.tsx, update the handleSignUp function:

const handleSignUp = async () => {
  try {
    setErrorMessage(null);
    setValidationErrors({});

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    // Step 1: Request OTP
    const response = await api.post('/api/otp-auth/signup/request-otp', {
      name: fullName.trim(),
      email: email.trim().toLowerCase(),
      password,
    });

    // Step 2: Navigate to OTP verification screen
    router.push({
      pathname: '/verifyOTP',
      params: {
        email: email.trim().toLowerCase(),
        name: fullName.trim(),
        password: password,
        purpose: 'email_verification',
      },
    });

  } catch (error: any) {
    console.error('Signup error:', error);
    const message = error?.response?.data?.message || 'Signup failed';
    setErrorMessage(message);
  } finally {
    setLoading(false);
  }
};
```

### 2. Update SignIn Flow

Modify your existing `signIn.tsx` to handle unverified emails:

```typescript
// In signIn.tsx, update the handleSignIn function:

const handleSignIn = async () => {
  try {
    setErrorMessage(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      setErrorMessage("Email and password are required.");
      return;
    }

    setLoading(true);

    // Try to login with OTP auth
    const response = await api.post('/api/otp-auth/login', {
      email: trimmedEmail,
      password,
    });

    // Store token
    if (response.data.token) {
      await storeToken(response.data.token);
    }

    // Check onboarding status
    const onboardingComplete = await getOnboardingStatus();
    
    if (onboardingComplete) {
      router.replace("/home");
    } else {
      router.replace("/dietaryPreference");
    }

  } catch (error: any) {
    console.error('Login error:', error);
    
    const status = error?.response?.status;
    const data = error?.response?.data;

    // Handle unverified email
    if (status === 403 && data?.requiresVerification) {
      Alert.alert(
        'Email Not Verified',
        'Your email is not verified. A new OTP has been sent to your email.',
        [
          {
            text: 'Verify Now',
            onPress: () => router.push({
              pathname: '/verifyOTP',
              params: {
                email: data.email,
                name: '', // Won't be needed for verification
                password: password,
                purpose: 'email_verification',
              },
            }),
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }

    const message = data?.message || 'Login failed';
    setErrorMessage(message);
  } finally {
    setLoading(false);
  }
};
```

### 3. Add "Forgot Password" Link

In your `signIn.tsx`, add this button below the password field:

```typescript
{/* Forgot Password Link */}
<TouchableOpacity
  style={styles.forgotPasswordButton}
  onPress={() => router.push('/forgotPassword')}
>
  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
</TouchableOpacity>

// Add to styles:
forgotPasswordButton: {
  alignSelf: 'flex-end',
  marginBottom: 20,
},
forgotPasswordText: {
  color: '#667eea',
  fontSize: 14,
  fontWeight: '600',
},
```

### 4. Update Existing Auth Service (Optional)

You can add new OTP auth functions to `lib/authService.ts`:

```typescript
// Add to authService.ts:

export const signupRequestOTP = async (data: { name: string; email: string; password: string }) => {
  const response = await api.post('/api/otp-auth/signup/request-otp', data);
  return response.data;
};

export const signupVerifyOTP = async (data: { name: string; email: string; password: string; otp: string }) => {
  const response = await api.post('/api/otp-auth/signup/verify-otp', data);
  if (response.data.token) {
    await storeToken(response.data.token);
  }
  return response.data;
};

export const loginWithOTP = async (data: { email: string; password: string }) => {
  const response = await api.post('/api/otp-auth/login', data);
  if (response.data.token) {
    await storeToken(response.data.token);
  }
  return response.data;
};

export const resendOTP = async (data: { email: string; purpose: string }) => {
  const response = await api.post('/api/otp-auth/resend-otp', data);
  return response.data;
};

export const forgotPasswordRequestOTP = async (data: { email: string }) => {
  const response = await api.post('/api/otp-auth/forgot-password/request-otp', data);
  return response.data;
};

export const forgotPasswordVerifyOTP = async (data: { email: string; otp: string }) => {
  const response = await api.post('/api/otp-auth/forgot-password/verify-otp', data);
  return response.data;
};

export const resetPassword = async (data: { resetToken: string; newPassword: string }) => {
  const response = await api.post('/api/otp-auth/reset-password', data);
  return response.data;
};
```

## 🎨 Screen Flow

### Signup Flow:
```
signup.tsx (Enter details)
    ↓ (Request OTP)
verifyOTP.tsx (Enter 6-digit code)
    ↓ (Verify & Create Account)
dietaryPreference.tsx or home.tsx
```

### Login Flow:
```
signIn.tsx (Enter credentials)
    ↓
    ├─→ If verified: home.tsx
    └─→ If not verified: verifyOTP.tsx
```

### Forgot Password Flow:
```
signIn.tsx (Click "Forgot Password")
    ↓
forgotPassword.tsx (Enter email)
    ↓ (Request OTP)
verifyOTP.tsx (Enter 6-digit code)
    ↓ (Verify OTP)
resetPasswordNew.tsx (Enter new password)
    ↓
signIn.tsx (Login with new password)
```

## 🚀 Quick Start

### 1. Start Backend
```bash
cd my-auth-backend/my-auth-backend
npm install nodemailer
node server.js
```

### 2. Configure SMTP
Edit `.env` file:
```env
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_16_char_app_password
```

### 3. Start Frontend
```bash
cd mealvista-frontend-main
npx expo start
```

### 4. Test the Flow
1. Go to Signup
2. Enter your real email
3. Check your email for OTP
4. Enter OTP to complete signup
5. Try login with verified account

## 📝 Code Examples

### Making API Calls Directly

```typescript
// Request OTP for signup
const requestSignupOTP = async (name: string, email: string, password: string) => {
  try {
    const response = await api.post('/api/otp-auth/signup/request-otp', {
      name,
      email,
      password,
    });
    console.log('OTP sent:', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data?.message);
  }
};

// Verify OTP
const verifyOTP = async (name: string, email: string, password: string, otp: string) => {
  try {
    const response = await api.post('/api/otp-auth/signup/verify-otp', {
      name,
      email,
      password,
      otp,
    });
    
    // Save token
    await storeToken(response.data.token);
    console.log('Account created:', response.data.user);
  } catch (error) {
    console.error('Error:', error.response?.data?.message);
  }
};

// Resend OTP
const resendOTP = async (email: string, purpose: 'email_verification' | 'password_reset') => {
  try {
    const response = await api.post('/api/otp-auth/resend-otp', {
      email,
      purpose,
    });
    console.log('OTP resent');
  } catch (error) {
    console.error('Error:', error.response?.data?.message);
  }
};
```

## 🎨 UI Components Used

All screens use:
- **Ionicons** for icons
- **expo-router** for navigation
- **React Native** built-in components
- **KeyboardAvoidingView** for better mobile UX
- **ScrollView** for responsive layouts

## 🔐 Security Features in Frontend

1. **Input Validation**: Email format, password strength
2. **Password Visibility Toggle**: Eye icon to show/hide password
3. **Auto-focus**: Automatically moves to next OTP digit
4. **Timer Display**: Shows OTP expiry countdown
5. **Resend Disabled**: Prevents spam OTP requests
6. **Error Handling**: Clear error messages for users
7. **Password Strength Indicator**: Visual feedback on password quality
8. **Confirmation Match**: Shows if passwords match

## 📱 Responsive Design

All screens are:
- Mobile-optimized with proper padding
- Keyboard-aware (shifts up when keyboard opens)
- Scrollable for small screens
- Touch-friendly button sizes
- Clear visual hierarchy

## 🎯 User Experience Features

1. **Auto-submit OTP**: When 6 digits are entered
2. **Visual feedback**: Loading states, colors, icons
3. **Clear instructions**: What to do at each step
4. **Timer countdown**: Know when OTP expires
5. **Resend option**: Easy to request new OTP
6. **Password strength**: Real-time feedback
7. **Match indicator**: Shows if passwords match
8. **Security tips**: Reminds users about security

## ✅ Testing Checklist

- [ ] Signup with valid email
- [ ] Receive OTP email
- [ ] Enter correct OTP
- [ ] Account created successfully
- [ ] Login with verified email
- [ ] Login with unverified email (should trigger OTP)
- [ ] Request forgot password OTP
- [ ] Verify password reset OTP
- [ ] Set new password
- [ ] Login with new password
- [ ] Test resend OTP functionality
- [ ] Test OTP expiry (wait 10 minutes)
- [ ] Test wrong OTP (5 attempts limit)
- [ ] Test rate limiting (too many requests)

## 🐛 Common Issues & Solutions

### Issue: OTP not received
- Check spam folder
- Verify SMTP credentials
- Check backend console logs
- In dev mode, OTP is logged to console

### Issue: "Email already registered"
- User should use login instead
- Or use forgot password if they forgot credentials

### Issue: Navigation not working
- Ensure all screens are in `app/` directory
- Check expo-router is properly configured
- Verify param names match exactly

### Issue: Token not saved
- Check `storeToken()` is called
- Verify AsyncStorage permissions
- Check token is valid JWT

## 🎉 You're All Set!

Your OTP authentication system is now fully integrated. Test thoroughly and deploy with confidence!
