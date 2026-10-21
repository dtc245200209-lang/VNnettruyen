const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

router.get('/login', authController.getLogin);
router.post('/login', authLimiter, authController.postLogin);

router.get('/register', authController.getRegister);
router.post('/register', authLimiter, authController.postRegister);

router.get('/logout', authController.logout);

router.get('/profile', requireAuth, authController.getProfile);
router.post('/profile', requireAuth, authController.postProfile);

module.exports = router;
