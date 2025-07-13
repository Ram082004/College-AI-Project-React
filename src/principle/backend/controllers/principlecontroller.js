const jwt = require('jsonwebtoken');
const { pool } = require('../../../Admin/backend/config/db');
const nodemailer = require('nodemailer');

// Add createTransporter function
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

// Login controller
exports.principleLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Input validation
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required',
      });
    }

    // Fetch principle from admin table
    const [rows] = await pool.query(
      'SELECT * FROM admin WHERE username = ? AND role = ?',
      [username, 'principle']
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password',
      });
    }

    const user = rows[0];

    // Verify password (assuming plain text for simplicity)
    if (password !== user.password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password',
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username },
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
      },
    });
  } catch (error) {
    console.error('Principle login error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during login',
    });
  }
};

// Get principle profile
exports.getProfile = async (req, res) => {
  try {
    const [user] = await pool.query(
      'SELECT id, username, email, name, role FROM admin WHERE id = ?',
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    res.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get dashboard statistics
exports.getStatistics = async (req, res) => {
  try {
    // Get department count from department_users table
    const [departments] = await pool.query('SELECT COUNT(DISTINCT dept_id) as count FROM department_users');
    // Get faculty count from department_users table (if you have a role/column for faculty, otherwise set to 0)
    const [faculty] = await pool.query('SELECT COUNT(*) as count FROM department_users WHERE role = "faculty"');
    // Get student count from student_enrollment table
    const [students] = await pool.query('SELECT SUM(count) as count FROM student_enrollment');

    res.json({
      success: true,
      statistics: {
        departmentCount: departments[0].count,
        facultyCount: faculty[0]?.count || 0,
        studentCount: students[0]?.count || 0
      }
    });

  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update principle profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    
    await pool.query(
      'UPDATE admin SET name = ?, email = ? WHERE id = ?',
      [name, email, req.user.id]
    );

    res.json({
      success: true,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Add forgot password controller
exports.forgotPrinciplePassword = async (req, res) => {
  console.log('Forgot password request received:', req.body);

  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Username is required',
      });
    }

    // Find user in database
    const [rows] = await pool.query(
      'SELECT * FROM admin WHERE username = ? AND role = ?',
      [username, 'principle']
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this username',
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
            <p>As requested, here is your password for the AISHE Principal Portal:</p>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; font-size: 18px; color: #1e40af;">${user.password}</p>
            </div>
            <p>For security reasons, we recommend changing your password after logging in.</p>
            <p>If you didn't request this, please contact the administrator immediately.</p>
          </div>
        `,
      });

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

// Get departments list
exports.getDepartmentsList = async (req, res) => {
  try {
    // Get all department names and ids from department_master (or similar), fallback to department_users if not available
    let departments;
    try {
      // Try to get from department_master (recommended for full list)
      [departments] = await pool.query('SELECT id as dept_id, name as department FROM department_master');
    } catch (e) {
      // Fallback to department_users
      [departments] = await pool.query('SELECT DISTINCT dept_id, department FROM department_users');
    }
    res.json({ success: true, departments });
  } catch (error) {
    console.error('Get departments list error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get department details
exports.getDepartmentDetails = async (req, res) => {
  try {
    const { deptId } = req.params;
    // Enrollment details
    const [enrollmentDetails] = await pool.query(
      `SELECT 
        se.year,
        se.degree_level,
        cm.name as category,
        scm.name as subcategory,
        SUM(CASE WHEN gm.name = 'Male' THEN se.count ELSE 0 END) as male_count,
        SUM(CASE WHEN gm.name = 'Female' THEN se.count ELSE 0 END) as female_count,
        SUM(CASE WHEN gm.name = 'Transgender' THEN se.count ELSE 0 END) as transgender_count
      FROM student_enrollment se
      JOIN category_master cm ON se.category_id = cm.id
      JOIN category_master scm ON se.subcategory_id = scm.id
      JOIN gender_master gm ON se.gender_id = gm.id
      WHERE se.dept_id = ?
      GROUP BY se.year, se.degree_level, cm.name, scm.name`,
      [deptId]
    );

    // Examination details
    const [examinationDetails] = await pool.query(
      `SELECT 
        se.year,
        se.degree_level,
        cm.name as category,
        scm.name as subcategory,
        se.result_type,
        SUM(CASE WHEN gm.name = 'Male' THEN se.count ELSE 0 END) as male_count,
        SUM(CASE WHEN gm.name = 'Female' THEN se.count ELSE 0 END) as female_count,
        SUM(CASE WHEN gm.name = 'Transgender' THEN se.count ELSE 0 END) as transgender_count
      FROM student_examination se
      JOIN category_master cm ON se.category_id = cm.id
      JOIN category_master scm ON se.subcategory_id = scm.id
      JOIN gender_master gm ON se.gender_id = gm.id
      WHERE se.dept_id = ?
      GROUP BY se.year, se.degree_level, cm.name, scm.name, se.result_type`,
      [deptId]
    );

    res.json({
      success: true,
      enrollmentDetails,
      examinationDetails
    });
  } catch (error) {
    console.error('Get department details error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

