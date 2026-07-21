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
        res.render('studentdashboard', { user, courses });
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
        res.render('student_my_courses', { user, courses: user.purchasedCourses || [] });
    } catch (err) {
        console.error('Error loading my courses:', err);
        res.redirect('/');
    }
});

// Watch a course (view lectures)
router.get('/student/course/:courseId', isLoggedIn, async (req, res) => {
    if (req.userinfo.role !== 'student') return res.redirect('/');
    try {
        const user = await userModel.findById(req.userinfo.userid);
        const course = await courseModel.findById(req.params.courseId);

        if (!course) return res.redirect('/student/my-courses');

        // Check if user owns the course (via purchasedCourses or enrollment)
        const hasPurchased = user.purchasedCourses && user.purchasedCourses.map(id => id.toString()).includes(req.params.courseId);
        if (!hasPurchased) {
            return res.redirect('/student/my-courses');
        }

        const lectureModel = require('../models/lectures');
        const lectures = await lectureModel.find({ course: req.params.courseId }).sort({ order: 1 });

        res.render('student-course-watch', { user, course, lectures });
    } catch (err) {
        console.error('Error loading course watch page:', err);
        res.redirect('/student/my-courses');
    }
});

module.exports = router;
