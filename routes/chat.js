const express = require('express');
const router = express.Router();
const userModel = require('../models/user');
const courseModel = require('../models/course');
const enrollmentModel = require('../models/enrollment');
const messageModel = require('../models/message');
const { isLoggedIn } = require('../middlewares/auth');

// ── GET /messages — main chat entry ──────────────────────────────────────────
router.get('/messages', isLoggedIn, async (req, res) => {
    try {
        const user = await userModel.findById(req.userinfo.userid);
        let userCourses = [];

        if (user.role === 'student') {
            // Fetch enrolled / purchased courses for student
            const enrollments = await enrollmentModel.find({ student: user._id }).populate('course');
            userCourses = enrollments.map(e => e.course).filter(Boolean);

            // Also check purchasedCourses array on user
            if (user.purchasedCourses && user.purchasedCourses.length > 0) {
                const purchased = await courseModel.find({ _id: { $in: user.purchasedCourses } });
                purchased.forEach(p => {
                    if (!userCourses.some(c => c._id.toString() === p._id.toString())) {
                        userCourses.push(p);
                    }
                });
            }
        } else if (user.role === 'instructor') {
            // Fetch courses created by instructor
            userCourses = await courseModel.find({ instructor: user._id }).sort({ createdAt: -1 });
        } else if (user.role === 'admin') {
            userCourses = await courseModel.find({}).sort({ createdAt: -1 });
        }

        if (userCourses.length > 0) {
            return res.redirect(`/messages/${userCourses[0]._id}`);
        }

        res.render('messages', {
            user,
            activeCourse: null,
            userCourses: [],
            messages: []
        });
    } catch (err) {
        console.error('Error opening messages:', err);
        res.redirect('/');
    }
});

// ── GET /messages/:courseId — chat room for specific course ──────────────────
router.get('/messages/:courseId', isLoggedIn, async (req, res) => {
    try {
        const user = await userModel.findById(req.userinfo.userid);
        const { courseId } = req.params;

        const activeCourse = await courseModel.findById(courseId);
        if (!activeCourse) {
            return res.redirect('/messages');
        }

        // Fetch all courses accessible to user for the course switcher list
        let userCourses = [];

        if (user.role === 'student') {
            const enrollments = await enrollmentModel.find({ student: user._id }).populate('course');
            userCourses = enrollments.map(e => e.course).filter(Boolean);

            if (user.purchasedCourses && user.purchasedCourses.length > 0) {
                const purchased = await courseModel.find({ _id: { $in: user.purchasedCourses } });
                purchased.forEach(p => {
                    if (!userCourses.some(c => c._id.toString() === p._id.toString())) {
                        userCourses.push(p);
                    }
                });
            }
        } else if (user.role === 'instructor') {
            userCourses = await courseModel.find({ instructor: user._id }).sort({ createdAt: -1 });
        } else if (user.role === 'admin') {
            userCourses = await courseModel.find({}).sort({ createdAt: -1 });
        }

        // Fetch message history for this course
        const messages = await messageModel.find({ course: courseId }).sort({ createdAt: 1 });

        res.render('messages', {
            user,
            activeCourse,
            userCourses,
            messages
        });
    } catch (err) {
        console.error('Error loading course chat:', err);
        res.redirect('/messages');
    }
});

module.exports = router;
