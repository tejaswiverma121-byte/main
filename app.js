const express      = require('express');
const path         = require('path');
const bcrypt       = require('bcrypt');
const cookieParser = require('cookie-parser');
const userModel    = require('./models/user');
const messageModel = require('./models/message');
const { redirectIfLoggedIn } = require('./middlewares/auth');

const http = require('http');
const { Server } = require('socket.io');

// Import routes
const authRoutes       = require('./routes/auth');
const studentRoutes    = require('./routes/student');
const instructorRoutes = require('./routes/instructor');
const adminRoutes      = require('./routes/admin');
const courseRoutes     = require('./routes/course');
const chatRoutes       = require('./routes/chat');

const app  = express();
const PORT = process.env.PORT || 4000;

// Middlewares
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

// Homepage route
app.get('/', redirectIfLoggedIn, (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.render('index');
});

// Mount modular routes
app.use('/', authRoutes);
app.use('/', studentRoutes);
app.use('/', instructorRoutes);
app.use('/', adminRoutes);
app.use('/', courseRoutes);
app.use('/', chatRoutes);

// ================= SOCKET.IO SETUP =================
const server = http.createServer(app);
const io = new Server(server);

io.on('connection', (socket) => {

    socket.on('joinCourseRoom', (courseId) => {
        socket.join(courseId);
    });

    socket.on('sendMessage', async (data) => {
        try {
            const newMessage = await messageModel.create({
                course: data.courseId,
                sender: data.senderId,
                senderName: data.senderName,
                senderRole: data.senderRole,
                text: data.text
            });

            io.to(data.courseId).emit('receiveMessage', {
                _id: newMessage._id,
                senderId: data.senderId,
                senderName: newMessage.senderName,
                senderRole: newMessage.senderRole,
                text: newMessage.text,
                createdAt: newMessage.createdAt
            });
        } catch (err) {
            console.error('Error saving message:', err);
        }
    });

});

// Server startup & admin auto-seeding
server.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);

    try {
        const admin = await userModel.findOne({ role: 'admin' });
        if (!admin) {
            const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);
            await userModel.create({
                username:   process.env.ADMIN_USERNAME || 'SuperAdmin',
                email:      process.env.ADMIN_EMAIL    || 'admin@test.com',
                password:   hash,
                role:       'admin',
                isApproved: true
            });
            console.log('Auto-seeded admin account');
        }
    } catch (err) {
        console.error('Error auto-seeding admin:', err);
    }
});