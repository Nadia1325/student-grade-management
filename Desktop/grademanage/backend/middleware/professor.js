const professor = (req, res, next) => {
  try {
    // Check if user is authenticated (auth middleware should run first)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check if user is a professor
    if (req.user.role !== 'professor') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Professor role required'
      });
    }

    next();
  } catch (error) {
    console.error('Professor middleware error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error in role authorization'
    });
  }
};

module.exports = professor;