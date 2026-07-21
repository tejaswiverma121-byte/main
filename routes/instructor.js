const express   = require('express');
const router    = express.Router();
const userModel = require('../models/user');
const { isLoggedIn } = require('../middlewares/auth');

router.get('/dashboard/instructor', isLoggedIn, async (req, res) => {
    if (req.userinfo.role !== 'instructor') return res.redirect('/');
    try {
        const user = await userModel.findById(req.userinfo.userid);
        res.render('instructor', { user });
    } catch (err) {
        console.error('Error loading instructor dashboard:', err);
        res.redirect('/');
    }
});

module.exports = router;
