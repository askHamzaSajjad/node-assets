const express = require('express');
const router = express.Router();

// Import all modules
const authRoutes = require('./authRoute');
const profileRoutes = require('./profileRoute');
const questionaireRoutes = require('./questionnaireRoute');
const subscriptionRoutes = require('./subscriptionRoute');
const workoutPlanRoutes = require('./workoutPlanRoute');
const workoutDayRoutes = require('./workoutDayRoute');
const workoutExerciseRoutes = require('./workoutExerciseRoute');
const postRoutes = require('./postRoute');
const commentRoutes = require('./commentRoute');
const reactionRoutes = require('./reactionRoute');
const planRequestRoutes = require('./planRequestRoute');
const termRoutes = require('./termRoute');
const privacyPolicyRoutes = require('./privacyPolicyRoute');




// authenticator
const authenticate = require('../middlewares/authMiddleware');


// authentication routes
router.use('/auth', authRoutes);
// profile routes
router.use('/profile',authenticate, profileRoutes);
// questionnaire routes
router.use('/questionnaire',authenticate, questionaireRoutes);
// subscription routes actual plans showing
router.use('/subscription', subscriptionRoutes);
// workout routes
router.use('/workout-plans',authenticate, workoutPlanRoutes);
router.use('/workout-days',authenticate, workoutDayRoutes);
router.use('/workout-exercises',authenticate, workoutExerciseRoutes);
// community routes
router.use('/posts',authenticate, postRoutes);
router.use('/comments',authenticate, commentRoutes);
router.use('/reactions',authenticate, reactionRoutes);
// plan request routes
router.use('/plan-requests',authenticate, planRequestRoutes);
// terms routes
router.use('/terms', termRoutes);
// privacy policy routes
router.use('/privacy-policy', privacyPolicyRoutes);



module.exports = router;
