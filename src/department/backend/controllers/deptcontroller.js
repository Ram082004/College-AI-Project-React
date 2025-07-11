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

// Add new controller functions

exports.addEnrollmentData = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { records } = req.body;

    if (!Array.isArray(records)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid data format'
      });
    }

    // Debug: log incoming records
    console.log('Received enrollment records:', records);

    for (const record of records) {
      const {
        academic_year,
        dept_id,
        category_id,
        subcategory_id,
        gender_id,
        count,
        year,
        degree_level // <-- Add this
      } = record;

      // Debug: log each record before insert
      console.log('Inserting record:', record);

      if (
        count > 0 &&
        academic_year &&
        dept_id &&
        category_id &&
        subcategory_id &&
        gender_id &&
        year &&
        degree_level // <-- Validate degree_level
      ) {
        await connection.query(
          `INSERT INTO student_enrollment 
           (academic_year, dept_id, category_id, subcategory_id, gender_id, count, year, degree_level)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [academic_year, dept_id, category_id, subcategory_id, gender_id, count, year, degree_level]
        );
      } else {
        console.warn('Skipping invalid record:', record);
      }
    }

    await connection.commit();
    res.json({
      success: true,
      message: 'Enrollment data added successfully'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Add enrollment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add enrollment data',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// Get student details with category/subcategory names
exports.getStudentDetails = async (req, res) => {
  try {
    const { deptId } = req.params;
    if (!deptId) {
      return res.status(400).json({
        success: false,
        message: 'Department ID is required'
      });
    }

    const [rows] = await pool.query(
      `SELECT 
        sd.academic_year,
        sd.year,
        sd.degree_level, -- Add this line
        c.name as category,
        sc.name as subcategory,
        SUM(CASE WHEN g.name = 'Male' THEN sd.count ELSE 0 END) as male_count,
        SUM(CASE WHEN g.name = 'Female' THEN sd.count ELSE 0 END) as female_count,
        SUM(CASE WHEN g.name = 'Transgender' THEN sd.count ELSE 0 END) as transgender_count
      FROM student_enrollment sd
      JOIN category_master c ON sd.category_id = c.id
      JOIN category_master sc ON sd.subcategory_id = sc.id
      JOIN gender_master g ON sd.gender_id = g.id
      WHERE sd.dept_id = ?
      GROUP BY sd.academic_year, sd.year, sd.degree_level, c.name, sc.name -- Add sd.degree_level to GROUP BY
      ORDER BY sd.academic_year DESC, sd.year ASC, sd.degree_level ASC`, // Add sd.degree_level to ORDER BY
      [deptId]
    );

    res.json({
      success: true,
      details: rows || []
    });

  } catch (error) {
    console.error('Get student details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student details'
    });
  }
};

// Add examination data
exports.addExaminationData = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { records } = req.body;

    console.log('Received examination records:', records); // Add this line

    if (!Array.isArray(records)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid data format'
      });
    }

    // removed old logic without degree_level
    for (const record of records) {
      console.log('Processing record:', record); // Add this line

      const {
        academic_year,
        dept_id,
        category_id,
        subcategory_id,
        gender_id,
        count,
        year,
        result_type,
        degree_level // <-- Ensure this is present
      } = record;

      if (
        count > 0 &&
        academic_year &&
        dept_id &&
        category_id &&
        subcategory_id &&
        gender_id &&
        year &&
        result_type &&
        degree_level // <-- Validate degree_level
      ) {
        await connection.query(
          `INSERT INTO student_examination 
           (academic_year, dept_id, category_id, subcategory_id, gender_id, count, year, result_type, degree_level)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [academic_year, dept_id, category_id, subcategory_id, gender_id, count, year, result_type, degree_level]
        );
      }
    }

    await connection.commit();
    res.json({
      success: true,
      message: 'Examination data added successfully'
    });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({
      success: false,
      message: 'Failed to add examination data',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// Get examination details
exports.getExaminationDetails = async (req, res) => {
  try {
    const { deptId } = req.params;
    if (!deptId) {
      return res.status(400).json({
        success: false,
        message: 'Department ID is required'
      });
    }

    const [rows] = await pool.query(
      `SELECT 
        se.academic_year,
        se.year,
        se.degree_level, -- Add this line
        se.result_type,
        c.name as category,
        sc.name as subcategory,
        SUM(CASE WHEN g.name = 'Male' THEN se.count ELSE 0 END) as male_count,
        SUM(CASE WHEN g.name = 'Female' THEN se.count ELSE 0 END) as female_count,
        SUM(CASE WHEN g.name = 'Transgender' THEN se.count ELSE 0 END) as transgender_count
      FROM student_examination se
      JOIN category_master c ON se.category_id = c.id
      JOIN category_master sc ON se.subcategory_id = sc.id
      JOIN gender_master g ON se.gender_id = g.id
      WHERE se.dept_id = ?
      GROUP BY se.academic_year, se.year, se.degree_level, se.result_type, c.name, sc.name
      ORDER BY se.academic_year DESC, se.year ASC, se.result_type ASC, se.degree_level ASC`,
      [deptId]
    );

    res.json({
      success: true,
      details: rows || []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch examination details'
    });
  }
};

// Update status for all enrollment records for a dept and year
exports.updateEnrollmentStatus = async (req, res) => {
  try {
    const { dept_id, year, status } = req.body;
    if (!dept_id || !year || !status) {
      return res.status(400).json({ success: false, message: 'dept_id, year, and status are required' });
    }
    await pool.query(
      'UPDATE student_enrollment SET status = ? WHERE dept_id = ? AND year = ?',
      [status, dept_id, year]
    );
    res.json({ success: true, message: `Status updated to ${status}` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update status', error: error.message });
  }
};

// Update status for examination records
exports.updateExaminationStatus = async (req, res) => {
  try {
    const { dept_id, year, status } = req.body;
    if (!dept_id || !year || !status) {
      return res.status(400).json({ 
        success: false, 
        message: 'dept_id, year, and status are required' 
      });
    }
    await pool.query(
      'UPDATE student_examination SET status = ? WHERE dept_id = ? AND year = ?',
      [status, dept_id, year]
    );
    res.json({ success: true, message: `Status updated to ${status}` });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update status', 
      error: error.message 
    });
  }
};

// Submit enrollment declaration
exports.submitEnrollmentDeclaration = async (req, res) => {
  try {
    const { dept_id, name, department, year, type, hod, degree_level } = req.body;
    if (!dept_id || !name || !department || !year || !type || !hod || !degree_level) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    await pool.query(
      `INSERT INTO submitted_data 
       (dept_id, name, department, year, type, hod, degree_level, submitted_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [dept_id, name, department, year, type, hod, degree_level]
    );
    res.json({ success: true, message: 'Enrollment declaration submitted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to submit enrollment declaration', error: error.message });
  }
};

// Submit examination declaration
// Enhanced: include degree_level for Student Examination
exports.submitExaminationDeclaration = async (req, res) => {
  try {
    const { dept_id, name, department, year, type, hod, degree_level } = req.body;
    if (!dept_id || !name || !department || !year || !type || !hod || (type === 'Student Examination' && !degree_level)) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    if (type === 'Student Examination') {
      await pool.query(
        `INSERT INTO submitted_data 
         (dept_id, name, department, year, type, hod, degree_level, submitted_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [dept_id, name, department, year, type, hod, degree_level]
      );
    } else {
      await pool.query(
        `INSERT INTO submitted_data 
         (dept_id, name, department, year, type, hod, submitted_at) 
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [dept_id, name, department, year, type, hod]
      );
    }
    res.json({ success: true, message: 'Examination declaration submitted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to submit declaration', error: error.message });
  }
};

// Controller in deptcontroller.js
exports.getEnrollmentYearStatuses = async (req, res) => {
  try {
    const { deptId } = req.params;
    // Accept yearSlots as a query param: ?years=I%20Year,II%20Year,III%20Year
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
    // Ensure all yearSlots are present in the response
    yearSlots.forEach(y => {
      const key = normalizeYear(y);
      if (!statusMap[key]) statusMap[key] = 'incomplete';
    });
    res.json({ success: true, statuses: statusMap, academicYear });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch year statuses', error: error.message });
  }
};

// New controller for enrollment year completion status
exports.getEnrollmentYearCompletionStatus = async (req, res) => {
  try {
    const { deptId } = req.params;
    const { degree_level } = req.query;
    const yearSlots = req.query.years ? req.query.years.split(',') : ['I Year', 'II Year', 'III Year'];
    if (!deptId || !degree_level) {
      return res.status(400).json({ success: false, message: 'Department ID and degree_level are required' });
    }
    // Get latest academic year for this department
    const [years] = await pool.query(
      `SELECT academic_year FROM department_users WHERE dept_id = ? ORDER BY academic_year DESC LIMIT 1`,
      [deptId]
    );
    const academicYear = years[0]?.academic_year;
    if (!academicYear) {
      return res.json({ success: true, statuses: {}, academicYear: null });
    }
    // For each year, check if there is at least one record and status is 'finished' for the degree_level
    const result = {};
    for (const year of yearSlots) {
      const [rows] = await pool.query(
        `SELECT status FROM student_enrollment WHERE dept_id = ? AND academic_year = ? AND year = ? AND degree_level = ? LIMIT 1`,
        [deptId, academicYear, year, degree_level]
      );
      if (rows.length > 0 && rows[0].status && rows[0].status.trim().toLowerCase() === 'finished') {
        result[year] = 'completed';
      } else {
        result[year] = 'incomplete';
      }
    }
    res.json({ success: true, statuses: result, academicYear });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch year completion status', error: error.message });
  }
};

// Controller for examination year completion status
exports.getExaminationYearCompletionStatus = async (req, res) => {
  try {
    const { deptId } = req.params;
    const { degree_level } = req.query;
    const yearSlots = req.query.years ? req.query.years.split(',') : ['I Year', 'II Year', 'III Year'];
    if (!deptId || !degree_level) {
      return res.status(400).json({ success: false, message: 'Department ID and degree_level are required' });
    }
    // Get latest academic year for this department
    const [years] = await pool.query(
      `SELECT academic_year FROM department_users WHERE dept_id = ? ORDER BY academic_year DESC LIMIT 1`,
      [deptId]
    );
    const academicYear = years[0]?.academic_year;
    if (!academicYear) {
      return res.json({ success: true, statuses: {}, academicYear: null });
    }
    // For each year, check if there is at least one record and status is 'finished' for the degree_level
    const result = {};
    for (const year of yearSlots) {
      const [rows] = await pool.query(
        `SELECT status FROM student_examination WHERE dept_id = ? AND academic_year = ? AND year = ? AND degree_level = ? LIMIT 1`,
        [deptId, academicYear, year, degree_level]
      );
      if (rows.length > 0 && rows[0].status && rows[0].status.trim().toLowerCase() === 'finished') {
        result[year] = 'finished';
      } else {
        result[year] = 'incomplete';
      }
    }
    res.json({ success: true, statuses: result, academicYear });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch year completion status', error: error.message });
  }
};

// POST /student-enrollment/lock-declaration
// Enhanced: include degree_level for Student Examination
exports.lockDeclaration = async (req, res) => {
  try {
    const { dept_id, year, type, degree_level } = req.body;
    if (!dept_id || !year || !type || (type === 'Student Examination' && !degree_level)) {
      return res.status(400).json({ success: false, message: 'dept_id, year, type, and degree_level are required' });
    }
    let query, params;
    if (type === 'Student Examination') {
      query = `UPDATE submitted_data SET locked = 1 WHERE dept_id = ? AND year = ? AND type = ? AND degree_level = ?`;
      params = [dept_id, year, type, degree_level];
    } else {
      query = `UPDATE submitted_data SET locked = 1 WHERE dept_id = ? AND year = ? AND type = ?`;
      params = [dept_id, year, type];
    }
    await pool.query(query, params);
    res.json({ success: true, message: 'Declaration locked successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to lock declaration', error: error.message });
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

// In deptcontroller.js
exports.deleteEnrollmentByYear = async (req, res) => {
  const { dept_id, year, subcategories } = req.body;
  if (!dept_id || !year || !subcategories) {
    return res.status(400).json({ success: false, message: 'Missing parameters' });
  }
  await pool.query(
    `DELETE FROM student_enrollment WHERE dept_id = ? AND year = ? AND subcategory_id IN (?)`,
    [dept_id, year, subcategories]
  );
  res.json({ success: true });
};

// Update student enrollment data (update counts for existing records)
exports.updateEnrollmentData = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { records } = req.body;

    if (!Array.isArray(records)) {
      return res.status(400).json({ success: false, message: 'Invalid data format' });
    }

    for (const record of records) {
      const {
        academic_year,
        dept_id,
        category_id,
        subcategory_id,
        gender_id,
        count,
        year,
        degree_level // <-- Add this
      } = record;

      // Only update if record exists
      const [existing] = await connection.query(
        `SELECT id FROM student_enrollment 
         WHERE academic_year = ? AND dept_id = ? AND category_id = ? AND subcategory_id = ? AND gender_id = ? AND year = ? AND degree_level = ?`,
        [academic_year, dept_id, category_id, subcategory_id, gender_id, year, degree_level]
      );

      if (existing.length > 0) {
        // Update existing record
        await connection.query(
          `UPDATE student_enrollment SET count = ? 
           WHERE id = ?`,
          [count, existing[0].id]
        );
      } else if (count > 0) {
        // Insert new record if not exists and count > 0
        await connection.query(
          `INSERT INTO student_enrollment 
           (academic_year, dept_id, category_id, subcategory_id, gender_id, count, year, degree_level)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [academic_year, dept_id, category_id, subcategory_id, gender_id, count, year, degree_level]
        );
      }
    }

    await connection.commit();
    res.json({ success: true, message: 'Enrollment data updated successfully' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ success: false, message: 'Failed to update enrollment data', error: error.message });
  } finally {
    connection.release();
  }
};

// Update examination data
exports.updateExaminationData = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { records } = req.body;

    if (!Array.isArray(records)) {
      return res.status(400).json({ success: false, message: 'Invalid data format' });
    }

    for (const record of records) {
      const {
        academic_year,
        dept_id,
        category_id,
        subcategory_id,
        gender_id,
        count,
        year,
        result_type
      } = record;

      // Only update if record exists
      const [existing] = await connection.query(
        `SELECT id FROM student_examination 
         WHERE academic_year = ? AND dept_id = ? AND category_id = ? AND subcategory_id = ? AND gender_id = ? AND year = ? AND result_type = ?`,
        [academic_year, dept_id, category_id, subcategory_id, gender_id, year, result_type]
      );

      if (existing.length > 0) {
        // Update existing record
        await connection.query(
          `UPDATE student_examination SET count = ? 
           WHERE id = ?`,
          [count, existing[0].id]
        );
      } else if (count > 0) {
        // Insert new record if not exists and count > 0
        await connection.query(
          `INSERT INTO student_examination 
           (academic_year, dept_id, category_id, subcategory_id, gender_id, count, year, result_type)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [academic_year, dept_id, category_id, subcategory_id, gender_id, count, year, result_type]
        );
      }
    }

    await connection.commit();
    res.json({ success: true, message: 'Examination data updated successfully' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ success: false, message: 'Failed to update examination data', error: error.message });
  } finally {
    connection.release();
  }
};