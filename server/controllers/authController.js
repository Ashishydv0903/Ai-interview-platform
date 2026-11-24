const authService = require('../services/authService');

/**
 * Register candidate account with hashed password and return JWT token
 */
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Name, email, and password are required." });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters long." });
    }

    const user = await authService.createUser({ name, email, password });
    const { password: _, ...userWithoutPass } = user;

    // Generate JWT Token
    const token = authService.generateToken(userWithoutPass);

    return res.status(201).json({
      success: true,
      message: "Registration successful.",
      data: {
        ...userWithoutPass,
        token,
        user: userWithoutPass
      }
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

/**
 * Candidate Login with password verification and return signed JWT token
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required." });
    }

    const user = await authService.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    const isMatch = await authService.validatePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    const { password: _, ...userWithoutPass } = user;

    // Generate JWT Token
    const token = authService.generateToken(userWithoutPass);

    return res.json({
      success: true,
      message: "Login successful.",
      data: {
        ...userWithoutPass,
        token,
        user: userWithoutPass
      }
    });
  } catch (err) {
    console.error("Login controller error:", err);
    return res.status(500).json({ success: false, message: "Login processing error." });
  }
};

/**
 * Get profile by User ID
 */
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

/**
 * Verify current JWT token and return authenticated user details
 */
exports.verifyMe = async (req, res) => {
  try {
    // req.user is set by authMiddleware protect
    return res.json({
      success: true,
      data: {
        user: req.user,
        authenticated: true
      }
    });
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid token session." });
  }
};

/**
 * Save candidate parsed resume to profile
 */
exports.saveResume = async (req, res) => {
  try {
    const { userId, resumeText } = req.body;
    const targetUserId = (req.user && req.user.id) || userId;
    const updated = await authService.updateUserResume(targetUserId, resumeText);
    if (!updated) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    const { password: _, ...userWithoutPass } = updated;
    return res.json({ success: true, data: userWithoutPass });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error saving resume." });
  }
};
