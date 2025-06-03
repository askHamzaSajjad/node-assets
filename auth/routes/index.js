const express = require('express');
const router = express.Router();

// Import all modules
const authRoutes = require('./authRoute');





// authenticator
const authenticate = require('../middlewares/authMiddleware');


// authentication routes
router.use('/auth', authRoutes);




module.exports = router;
