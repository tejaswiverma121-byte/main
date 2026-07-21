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
        res.render('admin', { user, pendingInstructors, totalUsers, totalInstructors, totalStudents });
    } catch (err) {
        console.error('Error loading admin dashboard:', err);
        res.redirect('/admin/login');
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
