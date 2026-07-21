const express   = require('express');
const router    = express.Router();
const userModel = require('../models/user');
const { isLoggedIn } = require('../middlewares/auth');

router.get('/dashboard/student', isLoggedIn, async (req, res) => {
    if (req.userinfo.role !== 'student') return res.redirect('/');
    try {
        const user = await userModel.findById(req.userinfo.userid);
        res.render('studentdashboard', { user });
    } catch (err) {
        console.error('Error loading student dashboard:', err);
        res.redirect('/');
    }
});

module.exports = router;
