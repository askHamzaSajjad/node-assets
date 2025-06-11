const express = require('express');
const router = express.Router();

// Import all modules
const authRoutes = require('./authRoute');
const s3Routes = require('./s3Route');






// authenticator
const authenticate = require('../middlewares/authMiddleware');
 

// authentication routes
router.use('/auth', authRoutes);
router.use('/s3', s3Routes);



module.exports = router;
