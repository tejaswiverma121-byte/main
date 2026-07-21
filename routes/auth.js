const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const userModel            = require('../models/user');
const { redirectIfLoggedIn } = require('../middlewares/auth');

const JWT_SECRET = process.env.JWT_SECRET || "shhh";

// ── Create Account ─────────────────────────────────────────────────────────────

router.get('/create', redirectIfLoggedIn, (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.render('createaccount');
});

router.post('/create', (req, res) => {
    if (req.body.role !== 'student' && req.body.role !== 'instructor') {
        return res.render('loginfailed', {
            title: 'Invalid Role',
            message: 'Please select a valid role (Student or Instructor) to create an account.',
            retryUrl: '/create'
        });
    }

    bcrypt.genSalt(10, (saltErr, salt) => {
        if (saltErr) {
            return res.render('loginfailed', {
                title: 'Registration Error',
                message: 'Error generating password salt. Please try again.',
                retryUrl: '/create'
            });
        }

        bcrypt.hash(req.body.password, salt, async (hashErr, hash) => {
            if (hashErr) {
                return res.render('loginfailed', {
                    title: 'Registration Error',
                    message: 'Error hashing password. Please try again.',
                    retryUrl: '/create'
                });
            }

            try {
                let existing = await userModel.findOne({ email: req.body.email });
                if (existing) return res.render('user_already_exists');

                let user = await userModel.create({
                    username: req.body.username,
                    email:    req.body.email,
                    password: hash,
                    age:      req.body.age,
                    role:     req.body.role
                });

                let token = jwt.sign({ userid: user._id, email: user.email, role: user.role }, JWT_SECRET);
                res.cookie('token', token);
                res.render('creationsucessfull', { role: user.role });

            } catch (dbErr) {
                console.error('DB error on create:', dbErr);
                res.render('loginfailed', {
                    title: 'Database Error',
                    message: 'Something went wrong while creating your account. Please try again.',
                    retryUrl: '/create'
                });
            }
        });
    });
});

// ── Student / Instructor Login ──────────────────────────────────────────────────

router.get('/login', (req, res) => {
    res.redirect('/');
});

router.get('/login/:role', redirectIfLoggedIn, (req, res) => {
    const role = req.params.role;
    if (role !== 'student' && role !== 'instructor') {
        return res.render('loginfailed', {
            title: 'Invalid Login Type',
            message: 'Please select a valid login type (Student, Instructor, or Admin).',
            retryUrl: '/'
        });
    }
    res.set('Cache-Control', 'no-store');
    res.render('login', { role });
});

router.post('/login/:role', async (req, res) => {
    const expectedRole = req.params.role;
    if (expectedRole !== 'student' && expectedRole !== 'instructor') {
        return res.render('loginfailed', {
            title: 'Invalid Login Type',
            message: 'Please select a valid login type (Student, Instructor, or Admin).',
            retryUrl: '/'
        });
    }

    try {
        let user = await userModel.findOne({ email: req.body.email });
        if (!user) return res.render('usernotfound');

        if (user.role !== expectedRole) {
            return res.render('loginfailed', {
                title: 'Role Mismatch',
                message: `This account is registered as a ${user.role}. Please use the ${user.role} login page to sign in.`,
                retryUrl: `/login/${user.role}`
            });
        }

        bcrypt.compare(req.body.password, user.password, (err, result) => {
            if (err || !result) {
                return res.render('loginfailed', {
                    title: 'Login Failed',
                    message: 'The email or password you entered is incorrect. Please check your credentials and try again.',
                    retryUrl: `/login/${expectedRole}`
                });
            }
            if (user.role === 'instructor' && !user.isApproved) return res.render('pendingapproval');

            let token = jwt.sign({ userid: user._id, email: user.email, role: user.role }, JWT_SECRET);
            res.cookie('token', token);

            if (user.role === 'student')    return res.redirect('/dashboard/student');
            if (user.role === 'instructor') return res.redirect('/dashboard/instructor');
        });

    } catch (err) {
        console.error('Login error:', err);
        res.render('loginfailed', {
            title: 'Server Error',
            message: 'Something went wrong while processing your request. Please try again.',
            retryUrl: `/login/${expectedRole}`
        });
    }
});

// ── Logout ─────────────────────────────────────────────────────────────────────

router.get('/logout', (req, res) => {
    res.cookie('token', '');
    res.redirect('/');
});

// ── Admin Login ────────────────────────────────────────────────────────────────

router.get('/admin/login', (req, res) => {
    res.render('login', { role: 'admin' });
});

router.post('/adminlogin', async (req, res) => {
    try {
        let user = await userModel.findOne({ email: req.body.email, role: 'admin' });
        if (!user) {
            return res.render('loginfailed', {
                title: 'Invalid Admin Credentials',
                message: 'The admin email or password you entered is incorrect. Please check your credentials and try again.',
                retryUrl: '/admin/login'
            });
        }

        bcrypt.compare(req.body.password, user.password, (err, result) => {
            if (err || !result) {
                return res.render('loginfailed', {
                    title: 'Invalid Admin Credentials',
                    message: 'The admin email or password you entered is incorrect. Please check your credentials and try again.',
                    retryUrl: '/admin/login'
                });
            }
            let token = jwt.sign({ userid: user._id, email: user.email, role: user.role }, JWT_SECRET);
            res.cookie('token', token);
            res.redirect('/dashboard/admin');
        });

    } catch (err) {
        console.error('Admin login error:', err);
        res.render('loginfailed', {
            title: 'Admin Login Error',
            message: 'An unexpected error occurred while logging in as admin. Please try again.',
            retryUrl: '/admin/login'
        });
    }
});

module.exports = router;
