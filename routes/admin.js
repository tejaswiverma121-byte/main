const express   = require('express');
const router    = express.Router();
const userModel = require('../models/user');
const { isAdmin } = require('../middlewares/auth');

router.get('/dashboard/admin', isAdmin, async (req, res) => {
    try {
        const user = await userModel.findById(req.userinfo.userid);
        const pendingInstructors = await userModel.find({ role: 'instructor', isApproved: { $ne: true } });
        const totalUsers = await userModel.countDocuments({ role: { $ne: 'admin' } });
        const totalInstructors = await userModel.countDocuments({ role: 'instructor' });
        const totalStudents = await userModel.countDocuments({ role: 'student' });
        const recentUsers = await userModel.find({ role: { $ne: 'admin' } }).sort({ _id: -1 }).limit(6);
        res.render('admin', { user, pendingInstructors, totalUsers, totalInstructors, totalStudents, recentUsers, activePage: 'dashboard' });
    } catch (err) {
        console.error('Error loading admin dashboard:', err);
        res.redirect('/admin/login');
    }
});

router.get('/admin/students', isAdmin, async (req, res) => {
    try {
        const user = await userModel.findById(req.userinfo.userid);
        const students = await userModel.find({ role: 'student' }).sort({ _id: -1 });
        const totalStudents = students.length;
        res.render('admin_students', { user, students, totalStudents, activePage: 'students' });
    } catch (err) {
        console.error('Error loading admin students page:', err);
        res.redirect('/dashboard/admin');
    }
});

router.get('/admin/instructors', isAdmin, async (req, res) => {
    try {
        const user = await userModel.findById(req.userinfo.userid);
        const instructors = await userModel.find({ role: 'instructor' }).sort({ _id: -1 });
        const pendingInstructors = instructors.filter(i => !i.isApproved);
        const approvedCount = instructors.filter(i => i.isApproved).length;
        res.render('admin_instructors', { 
            user, 
            instructors, 
            pendingInstructors, 
            totalInstructors: instructors.length, 
            approvedCount,
            activePage: 'instructors' 
        });
    } catch (err) {
        console.error('Error loading admin instructors page:', err);
        res.redirect('/dashboard/admin');
    }
});

router.post('/admin/approve/:id', isAdmin, async (req, res) => {
    try {
        await userModel.findByIdAndUpdate(req.params.id, { isApproved: true });
        if (req.headers['accept'] && req.headers['accept'].includes('application/json')) {
            return res.json({ success: true });
        }
        res.redirect('/dashboard/admin');
    } catch (err) {
        console.error('Error approving instructor:', err);
        if (req.headers['accept'] && req.headers['accept'].includes('application/json')) {
            return res.status(500).json({ success: false, error: 'DB error' });
        }
        res.redirect('/dashboard/admin');
    }
});

router.post('/admin/reject/:id', isAdmin, async (req, res) => {
    try {
        await userModel.findByIdAndDelete(req.params.id);
        if (req.headers['accept'] && req.headers['accept'].includes('application/json')) {
            return res.json({ success: true });
        }
        res.redirect('/dashboard/admin');
    } catch (err) {
        console.error('Error rejecting instructor:', err);
        if (req.headers['accept'] && req.headers['accept'].includes('application/json')) {
            return res.status(500).json({ success: false, error: 'DB error' });
        }
        res.redirect('/dashboard/admin');
    }
});

module.exports = router;
