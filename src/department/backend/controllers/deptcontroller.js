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

// Department forgot password controller
exports.forgotDepartmentPassword = async (req, res) => {
  console.log('Forgot password request received:', req.body); // Debug log

  try {
    const { username } = req.body;

    // Validate username
    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Username is required',
      });
    }

    // Find user in database
    const [rows] = await pool.query(
      'SELECT * FROM department_users WHERE username = ?',
      [username]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this username',
      });
    }

    const user = rows[0];

    try {
      // Create transporter
      const transporter = createTransporter();

      // Send password recovery email
      await transporter.sendMail({
        from: `"AISHE Portal" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: 'Your Password Recovery',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Password Recovery</h2>
            <p>Hello ${user.name},</p>
            <p>As requested, here is your password for the AISHE Department Portal:</p>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; font-size: 18px; color: #1e40af;">${user.password}</p>
            </div>
            <p>For security reasons, we recommend changing your password after logging in.</p>
            <p>If you didn't request this, please contact the administrator immediately.</p>
            <p style="color: #6b7280; font-size: 0.875rem; margin-top: 20px;">
              This is an automated message, please do not reply.
            </p>
          </div>
        `,
      });

      // Send success response
      res.json({
        success: true,
        message: 'Password has been sent to your email',
      });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send password recovery email',
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process password recovery request',
    });
  }
};

// Department login controller
exports.departmentLogin = async (req, res) => {
  console.log('Login request received:', { ...req.body, password: '***' }); // Debug log

  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required',
      });
    }

    // Find user
    const [rows] = await pool.query(
      'SELECT * FROM department_users WHERE username = ?',
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password',
      });
    }

    const user = rows[0];

    // Check if locked
    if (user.locked) {
      return res.status(403).json({
        success: false,
        message: 'Account locked by Nodel',
      });
    }

    // Verify password
    if (password !== user.password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password',
      });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Send success response
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        department: user.department,
        dept_id: user.dept_id,
        name: user.name, // <-- This line is correct
      },
    });
  } catch (error) {
    console.error('Department login error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during login',
    });
  }
};

// Controller to get HOD name for a department
exports.getHodName = async (req, res) => {
  try {
    const { deptId } = req.params;
    if (!deptId) {
      return res.status(400).json({ success: false, message: 'Department ID is required' });
    }
    // Use the correct column name 'hod'
    const [rows] = await pool.query(
      'SELECT hod FROM department_users WHERE dept_id = ? ORDER BY academic_year DESC LIMIT 1',
      [deptId]
    );
    if (rows.length === 0 || !rows[0].hod) {
      return res.json({ success: false, hod_name: null, message: 'HOD name not found' });
    }
    res.json({ success: true, hod_name: rows[0].hod });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch HOD name', error: error.message });
  }
};

// Check if declaration is locked and submitted
// Enhanced: include degree_level for Student Examination
exports.getDeclarationLockStatus = async (req, res) => {
  try {
    const { deptId, year, type, degree_level } = req.query;
    if (!deptId || !year || !type || (type === 'Student Examination' && !degree_level)) {
      return res.status(400).json({ success: false, message: 'deptId, year, type, and degree_level are required' });
    }
    let query, params;
    if (type === 'Student Examination') {
      query = `SELECT locked FROM submitted_data WHERE dept_id = ? AND year = ? AND type = ? AND degree_level = ? ORDER BY submitted_at DESC LIMIT 1`;
      params = [deptId, year, type, degree_level];
    } else {
      query = `SELECT locked FROM submitted_data WHERE dept_id = ? AND year = ? AND type = ? ORDER BY submitted_at DESC LIMIT 1`;
      params = [deptId, year, type];
    }
    const [rows] = await pool.query(query, params);
    if (rows.length > 0 && rows[0].locked === 1) {
      return res.json({ success: true, locked: true });
    }
    res.json({ success: true, locked: false });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to check lock status', error: error.message });
  }
};

// Controller to get examination year statuses
exports.getExaminationYearStatuses = async (req, res) => {
  try {
    const { deptId } = req.params;
    const yearSlots = req.query.years ? req.query.years.split(',') : ['I Year', 'II Year', 'III Year'];
    if (!deptId) {
      return res.status(400).json({ success: false, message: 'Department ID is required' });
    }
    const [years] = await pool.query(
      `SELECT academic_year FROM department_users WHERE dept_id = ? ORDER BY academic_year DESC LIMIT 1`,
      [deptId]
    );
    const academicYear = years[0]?.academic_year;
    if (!academicYear) {
      return res.json({ success: false, statuses: [] });
    }
    const [rows] = await pool.query(
      `SELECT year, status FROM student_examination WHERE dept_id = ? AND academic_year = ?`,
      [deptId, academicYear]
    );
    const normalizeYear = (year) => year.trim().replace(/\s+/g, ' ').toLowerCase();
    const normalizeStatus = (status) => status.trim().toLowerCase();
    const statusMap = {};
    rows.forEach(r => {
      statusMap[normalizeYear(r.year)] = normalizeStatus(r.status);
    });
    yearSlots.forEach(y => {
      const key = normalizeYear(y);
      if (!statusMap[key]) statusMap[key] = 'incomplete';
    });
    res.json({ success: true, statuses: statusMap, academicYear });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch year statuses', error: error.message });
  }
};