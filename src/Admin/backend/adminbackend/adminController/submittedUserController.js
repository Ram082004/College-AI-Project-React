const { pool } = require('../../config/db');

// Get all submitted data
exports.getAllSubmittedData = async (req, res) => {
  try {
    const { department, type, degree_level } = req.query;
    let query = `SELECT id, dept_id, department, name, year, type, hod, degree_level, submitted_at, locked FROM submitted_data WHERE 1=1`;
    const params = [];
    if (department) {
      query += ' AND department = ?';
      params.push(department);
    }
    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }
    if (degree_level) {
      query += ' AND degree_level = ?';
      params.push(degree_level);
    }
    query += ' ORDER BY submitted_at DESC';
    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch submitted data', error: error.message });
  }
};

// Lock/unlock submitted data
exports.toggleLockSubmittedData = async (req, res) => {
  try {
    const { id } = req.params;
    let { locked } = req.body;
    locked = locked ? 1 : 0;
    const [result] = await pool.query(
      'UPDATE submitted_data SET locked = ? WHERE id = ?',
      [locked, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }
    res.json({ success: true, message: `Submission ${locked ? 'locked' : 'unlocked'} successfully` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update lock status', error: error.message });
  }
};

// Delete submitted data
exports.deleteSubmittedData = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query(
      'DELETE FROM submitted_data WHERE id = ?',
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }
    res.json({ success: true, message: 'Submission deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete submission', error: error.message });
  }
};