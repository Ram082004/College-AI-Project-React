const { pool } = require('../../config/db');

// Get all submitted data
exports.getAllSubmittedData = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, dept_id, department, name, year, type, hod, submitted_at, locked
       FROM submitted_data
       ORDER BY submitted_at DESC`
    );
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