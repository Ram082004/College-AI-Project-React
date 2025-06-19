const { pool } = require('../../config/db');

// Fetch all admins (include password)
exports.getAllAdmins = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, username, email, name, mobile, role, password FROM admin');
    res.json({ success: true, admins: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch admins', error: error.message });
  }
};

// Fetch admin by ID (include password)
exports.getAdminById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT id, username, email, name, mobile, role, password FROM admin WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Admin not found' });
    res.json({ success: true, admin: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch admin', error: error.message });
  }
};

// Add a new admin (with password)
exports.addAdmin = async (req, res) => {
  try {
    const { username, email, name, mobile, role, password } = req.body;

    // Validate input
    if (!username || !email || !name || !mobile || !role || !password) {
      return res.status(400).json({ success: false, message: 'All fields including password are required' });
    }

    // Check for duplicate username or email
    const [exists] = await pool.query('SELECT id FROM admin WHERE username = ? OR email = ?', [username, email]);
    if (exists.length > 0) {
      return res.status(409).json({ success: false, message: 'Username or Email already exists' });
    }

    // Insert new admin
    const [result] = await pool.query(
      'INSERT INTO admin (username, email, name, mobile, role, password) VALUES (?, ?, ?, ?, ?, ?)',
      [username, email, name, mobile, role, password]
    );

    if (result.affectedRows > 0) {
      res.json({ success: true, message: 'Admin added successfully' });
    } else {
      res.status(500).json({ success: false, message: 'Failed to add admin' });
    }
  } catch (error) {
    console.error('Error adding admin:', error);
    res.status(500).json({ success: false, message: 'An error occurred while adding the admin', error: error.message });
  }
};

// Update admin (optionally update password)
exports.updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, name, mobile, role, password } = req.body;
    if (!username || !email || !name || !mobile || !role) {
      return res.status(400).json({ success: false, message: 'All fields except password are required' });
    }

    let query = 'UPDATE admin SET username = ?, email = ?, name = ?, mobile = ?, role = ?';
    let params = [username, email, name, mobile, role];

    if (password && password.trim() !== '') {
      query += ', password = ?';
      params.push(password);
    }

    query += ' WHERE id = ?';
    params.push(id);

    const [result] = await pool.query(query, params);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Admin not found' });
    res.json({ success: true, message: 'Admin updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update admin', error: error.message });
  }
};

// Delete admin
exports.deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM admin WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Admin not found' });
    res.json({ success: true, message: 'Admin deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete admin', error: error.message });
  }
};


