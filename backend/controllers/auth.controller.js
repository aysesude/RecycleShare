const bcrypt = require('bcrypt');
const { OAuth2Client } = require('google-auth-library');
const { query } = require('../config/database');
const { generateToken } = require('../utils/jwt.utils');
const { generateOTP, sendOTPEmail, sendWelcomeEmail } = require('../utils/email.utils');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const SALT_ROUNDS = 12;
const OTP_EXPIRY_MINUTES = 10;

// ==========================================
// STANDARD REGISTRATION (Email + OTP)
// ==========================================
const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone } = req.body;

    // Check if email already exists in users table
    const emailCheck = await query('SELECT user_id FROM users WHERE email = $1', [email]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists'
      });
    }

    // Check if phone already exists in users table
    const phoneCheck = await query('SELECT user_id FROM users WHERE phone = $1', [phone]);
    if (phoneCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'An account with this phone number already exists'
      });
    }

    // Delete any existing pending registration for this email or phone
    await query('DELETE FROM pending_registrations WHERE email = $1 OR phone = $2', [email, phone]);

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Insert into pending_registrations (NOT users table)
    await query(
      `INSERT INTO pending_registrations (first_name, last_name, email, password, phone, verification_code, verification_code_expires)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [firstName, lastName, email, hashedPassword, phone, otp, otpExpiry]
    );

    // Send OTP email (async - don't wait, user shouldn't wait for email)
    sendOTPEmail(email, firstName, otp).catch(err => {
      console.error('Failed to send OTP email:', err.message);
    });

    res.status(201).json({
      success: true,
      message: 'Please check your email for verification code.',
      data: {
        email: email,
        requiresVerification: true
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.'
    });
  }
};

// ==========================================
// VERIFY OTP
// ==========================================
const verifyOTP = async (req, res) => {
  try {
    const { email, code } = req.body;

    // Find pending registration
    const result = await query(
      `SELECT id, first_name, last_name, email, password, phone, verification_code, verification_code_expires
       FROM pending_registrations WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No pending registration found. Please register again.'
      });
    }

    const pending = result.rows[0];

    // Check if OTP matches
    if (pending.verification_code !== code) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }

    // Check if OTP is expired
    if (new Date() > new Date(pending.verification_code_expires)) {
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new one.'
      });
    }

    // Move from pending_registrations to users table
    const userResult = await query(
      `INSERT INTO users (first_name, last_name, email, password, phone, is_verified)
       VALUES ($1, $2, $3, $4, $5, TRUE)
       RETURNING user_id, first_name, last_name, email, phone, role, is_verified, created_at`,
      [pending.first_name, pending.last_name, pending.email, pending.password, pending.phone]
    );

    const user = userResult.rows[0];

    // Delete from pending_registrations
    await query('DELETE FROM pending_registrations WHERE id = $1', [pending.id]);

    // Generate JWT token
    const token = generateToken({
      user_id: user.user_id,
      email: user.email,
      role: user.role,
      is_verified: true
    });

    // Send welcome email (async, don't wait)
    sendWelcomeEmail(user.email, user.first_name);

    res.json({
      success: true,
      message: 'Email verified successfully! Welcome to RecycleShare!',
      data: {
        token,
        user: {
          userId: user.user_id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isVerified: true
        }
      }
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Verification failed. Please try again.'
    });
  }
};

// ==========================================
// RESEND OTP
// ==========================================
const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    // Check pending_registrations table
    const result = await query(
      'SELECT id, first_name FROM pending_registrations WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No pending registration found. Please register again.'
      });
    }

    const pending = result.rows[0];

    // Generate new OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Update OTP in pending_registrations
    await query(
      'UPDATE pending_registrations SET verification_code = $1, verification_code_expires = $2 WHERE id = $3',
      [otp, otpExpiry, pending.id]
    );

    // Send new OTP email
    await sendOTPEmail(email, pending.first_name, otp);

    res.json({
      success: true,
      message: 'New verification code sent! Please check your email.'
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend verification code. Please try again.'
    });
  }
};

// ==========================================
// STANDARD LOGIN
// ==========================================
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const result = await query(
      `SELECT user_id, first_name, last_name, email, password, phone, role, profile_picture, is_verified, is_active, google_id
       FROM users WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const user = result.rows[0];

    // Check if it's a Google-only account
    if (user.google_id && !user.password) {
      return res.status(400).json({
        success: false,
        message: 'This account uses Google login. Please sign in with Google.'
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated'
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if email is verified
    if (!user.is_verified) {
      // Generate and send new OTP
      const otp = generateOTP();
      const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
      
      await query(
        'UPDATE users SET verification_code = $1, verification_code_expires = $2 WHERE user_id = $3',
        [otp, otpExpiry, user.user_id]
      );
      
      await sendOTPEmail(user.email, user.first_name, otp);

      return res.status(403).json({
        success: false,
        message: 'Please verify your email to login. A new verification code has been sent.',
        data: {
          requiresVerification: true,
          email: user.email
        }
      });
    }

    // Generate token
    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Login successful!',
      data: {
        token,
        user: {
          userId: user.user_id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          profilePicture: user.profile_picture,
          isVerified: user.is_verified
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.'
    });
  }
};

// ==========================================
// GOOGLE AUTH - Initial
// ==========================================
const googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;

    // Verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, given_name, family_name, picture } = payload;

    // Check if user exists
    const existingUser = await query(
      `SELECT user_id, first_name, last_name, email, phone, role, profile_picture, is_verified, is_active, google_id
       FROM users WHERE google_id = $1 OR email = $2`,
      [googleId, email]
    );

    if (existingUser.rows.length > 0) {
      const user = existingUser.rows[0];

      // If user exists with email but no google_id, link accounts
      if (!user.google_id) {
        await query(
          'UPDATE users SET google_id = $1, profile_picture = COALESCE(profile_picture, $2), is_verified = TRUE WHERE user_id = $3',
          [googleId, picture, user.user_id]
        );
      }

      if (!user.is_active) {
        return res.status(403).json({
          success: false,
          message: 'Your account has been deactivated'
        });
      }

      // Check if phone number is set (required for Google users)
      if (!user.phone) {
        return res.status(200).json({
          success: true,
          message: 'Phone number required',
          data: {
            requiresPhone: true,
            googleId,
            email,
            firstName: user.first_name || given_name,
            lastName: user.last_name || family_name,
            profilePicture: picture
          }
        });
      }

      // Full login
      const token = generateToken({ ...user, is_verified: true });

      return res.json({
        success: true,
        message: 'Login successful!',
        data: {
          token,
          user: {
            userId: user.user_id,
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            profilePicture: user.profile_picture || picture,
            isVerified: true
          }
        }
      });
    }

    // New Google user - require phone number
    res.status(200).json({
      success: true,
      message: 'Phone number required to complete registration',
      data: {
        requiresPhone: true,
        googleId,
        email,
        firstName: given_name,
        lastName: family_name,
        profilePicture: picture
      }
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Google authentication failed. Please try again.'
    });
  }
};

// ==========================================
// GOOGLE AUTH - Complete with Phone
// ==========================================
const googleAuthComplete = async (req, res) => {
  try {
    const { googleId, email, firstName, lastName, profilePicture, phone } = req.body;

    // Check if phone already exists
    const phoneCheck = await query('SELECT user_id FROM users WHERE phone = $1', [phone]);
    if (phoneCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'This phone number is already associated with another account'
      });
    }

    // Check if user with this google_id or email already exists
    const existingUser = await query(
      'SELECT user_id FROM users WHERE google_id = $1 OR email = $2',
      [googleId, email]
    );

    let user;

    if (existingUser.rows.length > 0) {
      // Update existing user with phone
      const result = await query(
        `UPDATE users SET phone = $1, google_id = $2, profile_picture = COALESCE(profile_picture, $3), is_verified = TRUE
         WHERE (google_id = $2 OR email = $4)
         RETURNING user_id, first_name, last_name, email, phone, role, profile_picture, is_verified`,
        [phone, googleId, profilePicture, email]
      );
      user = result.rows[0];
    } else {
      // Create new user
      const result = await query(
        `INSERT INTO users (first_name, last_name, email, google_id, profile_picture, phone, is_verified)
         VALUES ($1, $2, $3, $4, $5, $6, TRUE)
         RETURNING user_id, first_name, last_name, email, phone, role, profile_picture, is_verified`,
        [firstName, lastName, email, googleId, profilePicture, phone]
      );
      user = result.rows[0];
    }

    // Generate token
    const token = generateToken(user);

    // Send welcome email
    sendWelcomeEmail(user.email, user.first_name);

    res.json({
      success: true,
      message: 'Registration complete! Welcome to RecycleShare!',
      data: {
        token,
        user: {
          userId: user.user_id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          profilePicture: user.profile_picture,
          isVerified: true
        }
      }
    });
  } catch (error) {
    console.error('Google auth complete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete registration. Please try again.'
    });
  }
};

// ==========================================
// GET CURRENT USER
// ==========================================
const getCurrentUser = async (req, res) => {
  try {
    const result = await query(
      `SELECT user_id, first_name, last_name, email, phone, role, profile_picture, is_verified, created_at
       FROM users WHERE user_id = $1`,
      [req.user.user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = result.rows[0];

    res.json({
      success: true,
      data: {
        user: {
          userId: user.user_id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          profilePicture: user.profile_picture,
          isVerified: user.is_verified,
          createdAt: user.created_at
        }
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user data'
    });
  }
};

module.exports = {
  register,
  verifyOTP,
  resendOTP,
  login,
  googleAuth,
  googleAuthComplete,
  getCurrentUser
};
