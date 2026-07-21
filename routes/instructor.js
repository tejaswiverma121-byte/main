const express   = require('express');
const router    = express.Router();
const userModel = require('../models/user');
const courseModel = require('../models/course');
const { isLoggedIn } = require('../middlewares/auth');

router.get('/dashboard/instructor', isLoggedIn, async (req, res) => {
    if (req.userinfo.role !== 'instructor') return res.redirect('/');
    try {
        const user = await userModel.findById(req.userinfo.userid);
        const courses = await courseModel.find({ instructor: req.userinfo.userid }).sort({ _id: -1 });
        const allCoursesCount = courses.length;
        res.render('instructor', { user, courses, totalCourses: allCoursesCount });
    } catch (err) {
        console.error('Error loading instructor dashboard:', err);
        res.redirect('/');
    }
});

module.exports = router;
