const { pool } = require('../../config/db');

// Fetch all department users
exports.getAllDepartmentUsers = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, username, email, mobile, department, dept_id, academic_year, degree_level, duration, password, locked, hod FROM department_users'
    );
    res.json({ success: true, users: rows });
  } catch (error) {
    console.error('Error fetching department users:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch department users', error: error.message });
  }
};

// Fetch a department user by ID
exports.getDepartmentUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      'SELECT id, name, username, email, mobile, department, dept_id, academic_year, password, degree_level, duration, locked, hod FROM department_users WHERE id = ?',
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user: rows[0] });
  } catch (error) {
    console.error('Error fetching department user:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user', error: error.message });
  }
};

// Add a new department user
exports.addDepartmentUser = async (req, res) => {
  try {
    const { name, username, email, mobile, department, dept_id, academic_year, degree_level, password, hod } = req.body;

    if (!name || !username || !email || !mobile || !department || !dept_id || !academic_year || !degree_level || !password || !hod) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    if (!['UG', 'PG'].includes(degree_level)) {
      return res.status(400).json({ success: false, message: 'Degree level must be UG or PG' });
    }

    const [exists] = await pool.query(
      'SELECT id FROM department_users WHERE username = ? OR email = ?',
      [username, email]
    );
    if (exists.length > 0) {
      return res.status(409).json({ success: false, message: 'Username or Email already exists' });
    }

    const [result] = await pool.query(
      'INSERT INTO department_users (name, username, email, mobile, department, dept_id, academic_year, degree_level, password, locked, hod) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)',
      [name, username, email, mobile, department, dept_id, academic_year, degree_level, password, hod]
    );

    if (result.affectedRows > 0) {
      res.json({ success: true, message: 'Department user added successfully' });
    } else {
      res.status(500).json({ success: false, message: 'Failed to add department user' });
    }
  } catch (error) {
    console.error('Error adding department user:', error);
    res.status(500).json({ success: false, message: 'An error occurred while adding the user', error: error.message });
  }
};

// Update an existing department user
exports.updateDepartmentUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, username, email, mobile, department, dept_id, academic_year, degree_level, password, hod } = req.body;

    if (!name || !username || !email || !mobile || !department || !dept_id || !academic_year || !degree_level || !hod) {
      return res.status(400).json({ success: false, message: 'All fields except password are required' });
    }

    if (!['UG', 'PG'].includes(degree_level)) {
      return res.status(400).json({ success: false, message: 'Degree level must be UG or PG' });
    }

    const [existing] = await pool.query('SELECT id FROM department_users WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (password && password.trim() !== '') {
      await pool.query(
        'UPDATE department_users SET name = ?, username = ?, email = ?, mobile = ?, department = ?, dept_id = ?, academic_year = ?, degree_level = ?, password = ?, hod = ? WHERE id = ?',
        [name, username, email, mobile, department, dept_id, academic_year, degree_level, password, hod, id]
      );
    } else {
      await pool.query(
        'UPDATE department_users SET name = ?, username = ?, email = ?, mobile = ?, department = ?, dept_id = ?, academic_year = ?, degree_level = ?, hod = ? WHERE id = ?',
        [name, username, email, mobile, department, dept_id, academic_year, degree_level, hod, id]
      );
    }

    res.json({ success: true, message: 'Department user updated successfully' });
  } catch (error) {
    console.error('Error updating department user:', error);
    res.status(500).json({ success: false, message: 'Failed to update department user', error: error.message });
  }
};

// Delete a department user
exports.deleteDepartmentUser = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM department_users WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'Department user deleted successfully' });
  } catch (error) {
    console.error('Error deleting department user:', error);
    res.status(500).json({ success: false, message: 'Failed to delete department user', error: error.message });
  }
};

// Lock or unlock a department user
exports.toggleLockDepartmentUser = async (req, res) => {
  try {
    const { id } = req.params;
    let { locked } = req.body;

    locked = locked ? 1 : 0;

    const [existing] = await pool.query('SELECT id FROM department_users WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const [result] = await pool.query(
      'UPDATE department_users SET locked = ? WHERE id = ?',
      [locked, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, message: `Department user ${locked ? 'locked' : 'unlocked'} successfully` });
  } catch (error) {
    console.error('Error locking/unlocking department user:', error);
    res.status(500).json({ success: false, message: 'Failed to update lock status', error: error.message });
  }
};

// Fetch distinct academic years
exports.getDistinctAcademicYears = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT DISTINCT academic_year FROM department_users ORDER BY academic_year DESC');
    res.json({ success: true, years: rows.map(r => r.academic_year) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch academic years' });
  }
};

exports.getStudentEnrollmentSummary = async (req, res) => {
  try {
    const { department, category, subcategory, year, degree_level, academic_year } = req.query;
    let query = `
      SELECT 
        se.degree_level,
        c.name as category,
        sc.name as subcategory,
        se.year,
        se.academic_year,
        SUM(CASE WHEN g.name = 'Male' THEN se.count ELSE 0 END) as male_count,
        SUM(CASE WHEN g.name = 'Female' THEN se.count ELSE 0 END) as female_count,
        SUM(CASE WHEN g.name = 'Transgender' THEN se.count ELSE 0 END) as transgender_count
      FROM student_enrollment se
      JOIN department_users du ON se.dept_id = du.dept_id
      JOIN category_master c ON se.category_id = c.id
      JOIN category_master sc ON se.subcategory_id = sc.id
      JOIN gender_master g ON se.gender_id = g.id
      WHERE 1=1
    `;
    const params = [];
    if (department) {
      query += ' AND du.department = ?';
      params.push(department);
    }
    if (category) {
      query += ' AND c.name = ?';
      params.push(category);
    }
    if (subcategory) {
      query += ' AND sc.name = ?';
      params.push(subcategory);
    }
    if (year) {
      query += ' AND se.year = ?';
      params.push(year);
    }
    if (degree_level) {
      query += ' AND se.degree_level = ?';
      params.push(degree_level);
    }
    if (academic_year) {
      query += ' AND se.academic_year = ?';
      params.push(academic_year);
    }
    query += ' GROUP BY se.degree_level, se.year, se.academic_year, c.name, sc.name ORDER BY se.degree_level, se.year, se.academic_year, c.name, sc.name';
    const [rows] = await pool.query(query, params);
    res.json({ success: true, summary: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch summary' });
  }
};

exports.getStudentExaminationSummary = async (req, res) => {
  try {
    const { department, category, subcategory, year, degree_level } = req.query;
    let query = `
      SELECT 
        se.degree_level,
        se.year,
        c.name as category,
        sc.name as subcategory,
        SUM(CASE WHEN g.name = 'Male' THEN se.count ELSE 0 END) as male_count,
        SUM(CASE WHEN g.name = 'Female' THEN se.count ELSE 0 END) as female_count,
        SUM(CASE WHEN g.name = 'Transgender' THEN se.count ELSE 0 END) as transgender_count
      FROM student_examination se
      JOIN department_users du ON se.dept_id = du.dept_id
      JOIN category_master c ON se.category_id = c.id
      JOIN category_master sc ON se.subcategory_id = sc.id
      JOIN gender_master g ON se.gender_id = g.id
      WHERE 1=1
    `;
    const params = [];
    if (department) {
      query += ' AND du.department = ?';
      params.push(department);
    }
    if (category) {
      query += ' AND c.name = ?';
      params.push(category);
    }
    if (subcategory) {
      query += ' AND sc.name = ?';
      params.push(subcategory);
    }
    if (year) {
      query += ' AND se.year = ?';
      params.push(year);
    }
    if (degree_level) {
      query += ' AND se.degree_level = ?';
      params.push(degree_level);
    }
    query += ' GROUP BY se.degree_level, se.year, c.name, sc.name ORDER BY se.degree_level, se.year, c.name, sc.name';
    const [rows] = await pool.query(query, params);
    res.json({ success: true, summary: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch examination summary' });
  }
};