const { pool } = require('../../../Admin/backend/config/db');

// Add examination data
exports.addExaminationData = async (req, res) => {
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

    for (const record of records) {
      const {
        academic_year,
        dept_id,
        category_id,
        subcategory_id,
        gender_id,
        count,
        year,
        result_type,
        degree_level
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
        degree_level
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
        se.degree_level,
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
        result_type,
        degree_level
      } = record;

      // Only update if record exists
      const [existing] = await connection.query(
        `SELECT id FROM student_examination 
         WHERE academic_year = ? AND dept_id = ? AND category_id = ? AND subcategory_id = ? AND gender_id = ? AND year = ? AND result_type = ? AND degree_level = ?`,
        [academic_year, dept_id, category_id, subcategory_id, gender_id, year, result_type, degree_level]
      );

      if (existing.length > 0) {
        // Update existing record
        await connection.query(
          `UPDATE student_examination SET count = ? 
           WHERE id = ?`,
          [count, existing[0].id]
        );
      }
      // Do NOT insert new record if not exists during update
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

// Submit examination declaration
exports.submitExaminationDeclaration = async (req, res) => {
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
    res.json({ success: true, message: 'Examination declaration submitted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to submit declaration', error: error.message });
  }
};

// POST /student-examination/lock-declaration
exports.lockDeclaration = async (req, res) => {
  try {
    const { dept_id, year, type, degree_level } = req.body;
    if (!dept_id || !year || !type || !degree_level) {
      return res.status(400).json({ success: false, message: 'dept_id, year, type, and degree_level are required' });
    }
    await pool.query(
      `UPDATE submitted_data SET locked = 1 WHERE dept_id = ? AND year = ? AND type = ? AND degree_level = ?`,
      [dept_id, year, type, degree_level]
    );
    res.json({ success: true, message: 'Declaration locked successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to lock declaration', error: error.message });
  }
};

// Check if declaration is locked and submitted
exports.getDeclarationLockStatus = async (req, res) => {
  try {
    const { deptId, year, type, degree_level } = req.query;
    if (!deptId || !year || !type || !degree_level) {
      return res.status(400).json({ success: false, message: 'deptId, year, type, and degree_level are required' });
    }
    const [rows] = await pool.query(
      `SELECT locked FROM submitted_data WHERE dept_id = ? AND year = ? AND type = ? AND degree_level = ? ORDER BY submitted_at DESC LIMIT 1`,
      [deptId, year, type, degree_level]
    );
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