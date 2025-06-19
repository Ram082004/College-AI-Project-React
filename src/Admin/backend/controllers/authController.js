const { pool } = require('../config/db');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Update the createTransporter function
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    console.log('Attempting login for:', username); // Debug log

    // Get user from database
    const [rows] = await pool.query(
      'SELECT * FROM admin WHERE username = ?',
      [username]
    );

    console.log('Found users:', rows.length); // Debug log

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    const user = rows[0];

    // Since password is stored as plain text in database
    // Compare directly instead of using bcrypt
    if (password !== user.password) {
      console.log('Password mismatch'); // Debug log
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Send successful response
    console.log('Login successful for:', username); // Debug log
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during login'
    });
  }
};

// Update the forgotPassword function with better error handling
exports.forgotPassword = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    // Get admin email from database
    const [admins] = await connection.query(
      'SELECT email FROM admin LIMIT 1'
    );

    if (admins.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No admin account found'
      });
    }

    const adminEmail = admins[0].email;
    // Mask email for privacy (e.g., j***@gmail.com)
    const maskedEmail = adminEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3');

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiryTime = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await connection.beginTransaction();

    // Delete existing OTPs
    await connection.query(
      'DELETE FROM password_resets WHERE email = ?',
      [adminEmail]
    );

    // Save new OTP
    await connection.query(
      'INSERT INTO password_resets (email, otp, expires_at) VALUES (?, ?, ?)',
      [adminEmail, otp, expiryTime]
    );

    // Send email
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"Aishe System" <${process.env.EMAIL_USER}>`,
      to: adminEmail,
      subject: 'Password Reset Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a365d;">Password Reset Code</h2>
          <p>Your verification code is:</p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h1 style="color: #1a365d; letter-spacing: 5px; font-size: 32px; margin: 0;">${otp}</h1>
          </div>
          <p>This code will expire in 10 minutes.</p>
        </div>
      `
    });

    await connection.commit();

    res.json({
      success: true,
      message: 'Reset code sent successfully',
      maskedEmail: maskedEmail
    });

  } catch (error) {
    await connection.rollback();
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send reset code'
    });
  } finally {
    connection.release();
  }
};

const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return password.length >= minLength && 
         hasUpperCase && 
         hasLowerCase && 
         hasNumber && 
         hasSpecialChar;
};

exports.resetPassword = async (req, res) => {
  try {
    const { otp, newPassword } = req.body;

    if (!otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'OTP and new password are required'
      });
    }

    if (!validatePassword(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Password does not meet security requirements'
      });
    }

    // Get admin email from database
    const [admins] = await pool.query(
      'SELECT email FROM admin LIMIT 1'
    );

    if (admins.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Admin account not found'
      });
    }

    const adminEmail = admins[0].email;

    // Verify OTP
    const [resets] = await pool.query(
      'SELECT * FROM password_resets WHERE email = ? AND otp = ? AND expires_at > NOW() AND used = 0',
      [adminEmail, otp]
    );

    if (resets.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Update password in admin table
    await pool.query(
      'UPDATE admin SET password = ? WHERE email = ?',
      [newPassword, adminEmail]
    );

    // Mark OTP as used
    await pool.query(
      'UPDATE password_resets SET used = 1 WHERE email = ? AND otp = ?',
      [adminEmail, otp]
    );

    res.json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while resetting your password'
    });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: 'OTP is required'
      });
    }

    // Get admin email
    const [admins] = await pool.query(
      'SELECT email FROM admin LIMIT 1'
    );

    if (admins.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Admin account not found'
      });
    }

    const adminEmail = admins[0].email;

    // Check OTP validity
    const [resets] = await pool.query(
      'SELECT * FROM password_resets WHERE email = ? AND otp = ? AND expires_at > NOW() AND used = 0',
      [adminEmail, otp]
    );

    if (resets.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    res.json({
      success: true,
      message: 'OTP verified successfully'
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP'
    });
  }
};
