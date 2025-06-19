const { pool } = require('../../../Admin/backend/config/db');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// Create email transporter function
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
};

// Office forgot password controller
exports.forgotOfficePassword = async (req, res) => {
  console.log('Forgot password request received:', req.body);

  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Username is required'
      });
    }

    // Find user in database
    const [rows] = await pool.query(
      'SELECT * FROM office_users WHERE username = ? AND locked = 0',
      [username]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No active account found with this username'
      });
    }

    const user = rows[0];

    try {
      const transporter = createTransporter();
      await transporter.sendMail({
        from: `"AISHE Portal" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: 'Your Password Recovery',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Password Recovery</h2>
            <p>Hello ${user.name},</p>
            <p>As requested, here is your password for the AISHE Office Portal:</p>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; font-size: 18px; color: #1e40af;">${user.password}</p>
            </div>
            <p>For security reasons, we recommend changing your password after logging in.</p>
            <p>If you didn't request this, please contact the administrator immediately.</p>
          </div>
        `
      });

      res.json({
        success: true,
        message: 'Password has been sent to your email'
      });

    } catch (emailError) {
      console.error('Email sending error:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send password recovery email'
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process password recovery request'
    });
  }
};

exports.officeLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required',
      });
    }

    const [rows] = await pool.query(
      'SELECT * FROM office_users WHERE username = ?',
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password',
      });
    }

    const user = rows[0];

    if (user.locked) {
      return res.status(403).json({
        success: false,
        message: 'Account locked by Nodel',
      });
    }

    if (password !== user.password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password',
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        type: 'office',
        office_id: user.office_id,
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        office_id: user.office_id,
        type: 'office',
      },
    });
  } catch (error) {
    console.error('Office login error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during login',
    });
  }
};