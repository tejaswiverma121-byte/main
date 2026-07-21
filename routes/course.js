const express = require('express');
const router = express.Router();
const courseModel = require('../models/course');
const userModel = require('../models/user');
const { isLoggedIn } = require('../middlewares/auth');

// Middleware to verify Admin or Instructor role
function canManageCourses(req, res, next) {
    if (!req.userinfo || (req.userinfo.role !== 'admin' && req.userinfo.role !== 'instructor')) {
        return res.status(403).render('loginfailed', {
            title: 'Access Denied',
            message: 'Only Administrators and Instructors can manage courses.',
            retryUrl: '/'
        });
    }
    next();
}

// ── Create Course ─────────────────────────────────────────────────────────────
router.post('/courses/create', isLoggedIn, canManageCourses, async (req, res) => {
    try {
        const user = await userModel.findById(req.userinfo.userid);
        const { title, description, category, price, thumbnail, status, instructorName } = req.body;

        const newCourse = await courseModel.create({
            title: title || 'Untitled Course',
            description: description || '',
            category: category || 'Development',
            price: Number(price) || 0,
            thumbnail: thumbnail && thumbnail.trim() !== '' 
                ? thumbnail 
                : 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500',
            status: status || 'Published',
            instructor: user ? user._id : null,
            instructorName: instructorName && instructorName.trim() !== '' 
                ? instructorName 
                : (user ? user.username : 'Instructor')
        });

        if (req.headers['accept'] && req.headers['accept'].includes('application/json')) {
            return res.json({ success: true, course: newCourse });
        }

        const redirectUrl = req.userinfo.role === 'admin' ? '/admin/courses' : '/dashboard/instructor/courses';
        res.redirect(redirectUrl);
    } catch (err) {
        console.error('Error creating course:', err);
        if (req.headers['accept'] && req.headers['accept'].includes('application/json')) {
            return res.status(500).json({ success: false, error: 'Database error creating course' });
        }
        res.redirect('back');
    }
});

// ── Edit Course ───────────────────────────────────────────────────────────────
router.post('/courses/edit/:id', isLoggedIn, canManageCourses, async (req, res) => {
    try {
        const { title, description, category, price, thumbnail, status, instructorName } = req.body;

        const updatedData = {
            title,
            description,
            category,
            price: Number(price) || 0,
            status: status || 'Published'
        };

        if (thumbnail && thumbnail.trim() !== '') {
            updatedData.thumbnail = thumbnail;
        }

        if (instructorName && instructorName.trim() !== '') {
            updatedData.instructorName = instructorName;
        }

        const course = await courseModel.findByIdAndUpdate(req.params.id, updatedData, { new: true });

        if (req.headers['accept'] && req.headers['accept'].includes('application/json')) {
            return res.json({ success: true, course });
        }

        const redirectUrl = req.userinfo.role === 'admin' ? '/admin/courses' : '/dashboard/instructor/courses';
        res.redirect(redirectUrl);
    } catch (err) {
        console.error('Error updating course:', err);
        if (req.headers['accept'] && req.headers['accept'].includes('application/json')) {
            return res.status(500).json({ success: false, error: 'Database error updating course' });
        }
        res.redirect('back');
    }
});

// ── Delete Course ──────────────────────────────────────────────────────────────
router.post('/courses/delete/:id', isLoggedIn, canManageCourses, async (req, res) => {
    try {
        await courseModel.findByIdAndDelete(req.params.id);

        if (req.headers['accept'] && req.headers['accept'].includes('application/json')) {
            return res.json({ success: true });
        }

        const redirectUrl = req.userinfo.role === 'admin' ? '/admin/courses' : '/dashboard/instructor/courses';
        res.redirect(redirectUrl);
    } catch (err) {
        console.error('Error deleting course:', err);
        if (req.headers['accept'] && req.headers['accept'].includes('application/json')) {
            return res.status(500).json({ success: false, error: 'Database error deleting course' });
        }
        res.redirect('back');
    }
});

module.exports = router;
