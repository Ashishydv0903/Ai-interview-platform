const authService = require('../services/authService');

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Name, email, and password are required." });
    }

    const user = await authService.createUser({ name, email, password });
    const { password: _, ...userWithoutPass } = user;
    return res.json({ success: true, data: userWithoutPass });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required." });
    }

    const user = await authService.findUserByEmail(email);

    if (!user || user.password !== password) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    const { password: _, ...userWithoutPass } = user;
    return res.json({ success: true, data: userWithoutPass });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Login error." });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await authService.findUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    const { password: _, ...userWithoutPass } = user;
    return res.json({ success: true, data: userWithoutPass });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error fetching user profile." });
  }
};

exports.saveResume = async (req, res) => {
  try {
    const { userId, resumeText } = req.body;
    const updated = await authService.updateUserResume(userId, resumeText);
    if (!updated) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    const { password: _, ...userWithoutPass } = updated;
    return res.json({ success: true, data: userWithoutPass });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error saving resume." });
  }
};
