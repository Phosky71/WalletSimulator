const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController.js');
const auth = require('../routes/authRoutes.js');

router.put('/saveSettings', auth, userController.updateUserSettings);
router.get('/getSettings', auth, userController.getUserSettings);


module.exports = router;