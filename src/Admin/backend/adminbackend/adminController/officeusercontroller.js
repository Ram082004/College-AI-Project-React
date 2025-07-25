const { pool } = require('../../config/db');

// Fetch all office users
exports.getAllOfficeUsers = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, username, email, mobile, office_id, password, academic_year, locked FROM office_users'
    );
    res.json({ success: true, users: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch office users', error: error.message });
  }
};

// Add office user
exports.addOfficeUser = async (req, res) => {
  try {
    const { name, username, email, mobile, office_id, password, academic_year } = req.body;
    if (!name || !username || !email || !mobile || !office_id || !password || !academic_year) {
      return res.status(400).json({ success: false, message: 'All fields including academic year are required' });
    }
    const [exists] = await pool.query(
      'SELECT id FROM department_users WHERE username = ? OR email = ?',
      [username, email]
    );
    if (exists.length > 0) {
      return res.status(409).json({ success: false, message: 'Username or Email already exists' });
    }
    const [result] = await pool.query(
      'INSERT INTO office_users (name, username, email, mobile, office_id, password, academic_year, locked) VALUES (?, ?, ?, ?, ?, ?, ?, 0)',
      [name, username, email, mobile, office_id, password, academic_year]
    );
    if (result.affectedRows > 0) {
      res.json({ success: true, message: 'Office user added successfully' });
    } else {
      res.status(500).json({ success: false, message: 'Failed to add office user' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'An error occurred while adding the user', error: error.message });
  }
};

// Update office user
exports.updateOfficeUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, username, email, mobile, office_id, password, academic_year } = req.body;
    if (!name || !username || !email || !mobile || !office_id || !academic_year) {
      return res.status(400).json({ success: false, message: 'All fields except password are required' });
    }
    const [existing] = await pool.query('SELECT id FROM office_users WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const [duplicates] = await pool.query(
      'SELECT id FROM office_users WHERE (username = ? OR email = ?) AND id != ?',
      [username, email, id]
    );
    if (duplicates.length > 0) {
      return res.status(409).json({ success: false, message: 'Username or Email already exists' });
    }
    if (password && password.trim() !== '') {
      await pool.query(
        'UPDATE office_users SET name = ?, username = ?, email = ?, mobile = ?, office_id = ?, password = ?, academic_year = ? WHERE id = ?',
        [name, username, email, mobile, office_id, password, academic_year, id]
      );
    } else {
      await pool.query(
        'UPDATE office_users SET name = ?, username = ?, email = ?, mobile = ?, office_id = ?, academic_year = ? WHERE id = ?',
        [name, username, email, mobile, office_id, academic_year, id]
      );
    }
    res.json({ success: true, message: 'Office user updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update office user', error: error.message });
  }
};

// Delete office user
exports.deleteOfficeUser = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM office_users WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'Office user deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete office user', error: error.message });
  }
};

// Lock/unlock office user
exports.toggleLockOfficeUser = async (req, res) => {
  try {
    const { id } = req.params;
    let { locked } = req.body;
    locked = locked ? 1 : 0;
    const [existing] = await pool.query('SELECT id FROM office_users WHERE id = ?', [id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const [result] = await pool.query(
      'UPDATE office_users SET locked = ? WHERE id = ?',
      [locked, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({
      success: true,
      message: `Office user ${locked ? 'locked' : 'unlocked'} successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update lock status',
      error: error.message
    });
  }
};