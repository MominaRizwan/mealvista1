const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  otp: {
    type: String,
    required: true,
  },
  purpose: {
    type: String,
    enum: ['email_verification', 'password_reset'],
    required: true,
  },
  attempts: {
    type: Number,
    default: 0,
    max: 5, // Maximum 5 attempts to prevent brute force
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 }, // TTL index - MongoDB will automatically delete expired documents
  },
  verified: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for faster queries
otpSchema.index({ email: 1, purpose: 1, verified: 1 });

// Method to check if OTP is expired
otpSchema.methods.isExpired = function() {
  return Date.now() > this.expiresAt;
};

// Method to check if max attempts reached
otpSchema.methods.hasExceededAttempts = function() {
  return this.attempts >= 3;
};

// Static method to generate 6-digit OTP
otpSchema.statics.generateOTP = function() {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Static method to create new OTP
otpSchema.statics.createOTP = async function(email, purpose, expiryMinutes = 1) {
  // Delete any existing unverified OTPs for this email and purpose
  await this.deleteMany({ email, purpose, verified: false });

  const otp = this.generateOTP();
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

  const otpDoc = await this.create({
    email,
    otp,
    purpose,
    expiresAt,
  });

  return otpDoc;
};

// Static method to verify OTP
otpSchema.statics.verifyOTP = async function(email, otp, purpose) {
  const otpDoc = await this.findOne({
    email,
    purpose,
    verified: false,
  }).sort({ createdAt: -1 }); // Get the most recent OTP

  if (!otpDoc) {
    return { success: false, message: 'OTP not found or already used' };
  }

  if (otpDoc.isExpired()) {
    await otpDoc.deleteOne();
    return { success: false, message: 'OTP has expired. Please request a new one' };
  }

  if (otpDoc.hasExceededAttempts()) {
    await otpDoc.deleteOne();
    return { success: false, message: 'Too many failed attempts. Please request a new OTP' };
  }

  // Check if OTP matches FIRST before incrementing attempts
  if (otpDoc.otp !== otp) {
    // Increment attempts only for wrong OTP
    otpDoc.attempts += 1;
    await otpDoc.save();
    
    return { 
      success: false, 
      message: `Invalid OTP. ${3 - otpDoc.attempts} attempts remaining`,
      attemptsRemaining: 3 - otpDoc.attempts
    };
  }

  // OTP is correct - Mark as verified
  otpDoc.verified = true;
  otpDoc.attempts += 1; // Count this final successful attempt
  await otpDoc.save();

  return { success: true, message: 'OTP verified successfully' };
};

module.exports = mongoose.model('OTP', otpSchema);
