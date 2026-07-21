const express = require('express');
const router = express.Router();
const messageModel = require('../models/message');
const userModel = require('../models/user');
const { isLoggedIn } = require('../middlewares/auth');

// Only students and instructors can access chat
function canChat(req, res, next) {
    if (!req.userinfo || (req.userinfo.role !== 'student' && req.userinfo.role !== 'instructor')) {
        return res.redirect('/');
    }
    next();
}

// GET /chat - Render chat page
router.get('/chat', isLoggedIn, canChat, async (req, res) => {
    try {
        const currentUser = await userModel.findById(req.userinfo.userid);
        const messages = await messageModel.find()
            .sort({ createdAt: 1 })
            .limit(100);
        res.render('chat', { user: currentUser, messages });
    } catch (err) {
        console.error('Error loading chat:', err);
        res.redirect('/');
    }
});

// POST /chat/send - Send a message
router.post('/chat/send', isLoggedIn, canChat, async (req, res) => {
    try {
        const { content } = req.body;
        if (!content || !content.trim()) {
            return res.status(400).json({ success: false, error: 'Message cannot be empty' });
        }

        const user = await userModel.findById(req.userinfo.userid);
        if (!user) return res.status(404).json({ success: false, error: 'User not found' });

        const message = await messageModel.create({
            sender: user._id,
            senderName: user.username,
            senderRole: user.role,
            senderPic: user.profilePic || '',
            content: content.trim().substring(0, 1000)
        });

        return res.json({
            success: true,
            message: {
                _id: message._id,
                senderName: message.senderName,
                senderRole: message.senderRole,
                senderPic: message.senderPic,
                content: message.content,
                createdAt: message.createdAt,
                isOwn: true
            }
        });
    } catch (err) {
        console.error('Error sending message:', err);
        return res.status(500).json({ success: false, error: 'Failed to send message' });
    }
});

// GET /chat/messages?since=<timestamp> - Poll for new messages
router.get('/chat/messages', isLoggedIn, canChat, async (req, res) => {
    try {
        const since = req.query.since ? new Date(req.query.since) : new Date(0);
        const userId = req.userinfo.userid;

        const messages = await messageModel.find({ createdAt: { $gt: since } })
            .sort({ createdAt: 1 })
            .limit(50);

        const formatted = messages.map(m => ({
            _id: m._id,
            senderName: m.senderName,
            senderRole: m.senderRole,
            senderPic: m.senderPic,
            content: m.content,
            createdAt: m.createdAt,
            isOwn: m.sender.toString() === userId.toString()
        }));

        return res.json({ success: true, messages: formatted });
    } catch (err) {
        console.error('Error polling messages:', err);
        return res.status(500).json({ success: false, error: 'Failed to fetch messages' });
    }
});

module.exports = router;
