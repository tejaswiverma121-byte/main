const express   = require('express');
const router    = express.Router();
const userModel = require('../models/user');
const courseModel = require('../models/course');
const { isLoggedIn } = require('../middlewares/auth');

router.get('/dashboard/student', isLoggedIn, async (req, res) => {
    if (req.userinfo.role !== 'student') return res.redirect('/');
    try {
        const user = await userModel.findById(req.userinfo.userid);
        const courses = await courseModel.find({ status: 'Published' });
        res.render('studentdashboard', { user, courses, activePage: 'dashboard' });
    } catch (err) {
        console.error('Error loading student dashboard:', err);
        res.redirect('/');
    }
});

// Enroll / Buy course
router.post('/student/buy/:courseId', isLoggedIn, async (req, res) => {
    if (req.userinfo.role !== 'student') return res.status(403).json({ success: false, error: 'Unauthorized' });
    try {
        const userId = req.userinfo.userid;
        const courseId = req.params.courseId;

        const course = await courseModel.findById(courseId);
        if (!course) {
            return res.status(404).json({ success: false, error: 'Course not found' });
        }

        await userModel.findByIdAndUpdate(userId, {
            $addToSet: { purchasedCourses: courseId }
        });

        if (req.headers['accept'] && req.headers['accept'].includes('application/json')) {
            return res.json({ success: true });
        }
        res.redirect('/dashboard/student');
    } catch (err) {
        console.error('Error purchasing course:', err);
        if (req.headers['accept'] && req.headers['accept'].includes('application/json')) {
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
        res.redirect('/dashboard/student');
    }
});

// View purchased courses
router.get('/student/my-courses', isLoggedIn, async (req, res) => {
    if (req.userinfo.role !== 'student') return res.redirect('/');
    try {
        const user = await userModel.findById(req.userinfo.userid).populate('purchasedCourses');
        res.render('student_my_courses', { user, courses: user.purchasedCourses || [], activePage: 'mycourses' });
    } catch (err) {
        console.error('Error loading my courses:', err);
        res.redirect('/');
    }
});

// Toggle course in wishlist
router.post('/student/wishlist/toggle/:courseId', isLoggedIn, async (req, res) => {
    if (req.userinfo.role !== 'student') return res.status(403).json({ success: false, error: 'Unauthorized' });
    try {
        const userId = req.userinfo.userid;
        const courseId = req.params.courseId;

        const user = await userModel.findById(userId);
        if (!user) return res.status(404).json({ success: false, error: 'User not found' });

        const isWishlisted = user.wishlist && user.wishlist.some(id => id.toString() === courseId);

        if (isWishlisted) {
            await userModel.findByIdAndUpdate(userId, {
                $pull: { wishlist: courseId }
            });
        } else {
            await userModel.findByIdAndUpdate(userId, {
                $addToSet: { wishlist: courseId }
            });
        }

        if (req.headers['accept'] && req.headers['accept'].includes('application/json')) {
            return res.json({ success: true, wishlisted: !isWishlisted });
        }
        res.redirect('back');
    } catch (err) {
        console.error('Error toggling wishlist:', err);
        if (req.headers['accept'] && req.headers['accept'].includes('application/json')) {
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
        res.redirect('back');
    }
});

// View wishlist courses
router.get('/student/wishlist', isLoggedIn, async (req, res) => {
    if (req.userinfo.role !== 'student') return res.redirect('/');
    try {
        const user = await userModel.findById(req.userinfo.userid).populate('wishlist');
        res.render('student_wishlist', { user, courses: user.wishlist || [], activePage: 'wishlist' });
    } catch (err) {
        console.error('Error loading wishlist:', err);
        res.redirect('/');
    }
});

module.exports = router;
