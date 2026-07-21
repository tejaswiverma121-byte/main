const express      = require('express');
const path         = require('path');
const bcrypt       = require('bcrypt');
const cookieParser = require('cookie-parser');
const userModel    = require('./models/user');
const { redirectIfLoggedIn } = require('./middlewares/auth');

// Import routes
const authRoutes       = require('./routes/auth');
const studentRoutes    = require('./routes/student');
const instructorRoutes = require('./routes/instructor');
const adminRoutes      = require('./routes/admin');
const courseRoutes     = require('./routes/course');

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

// Server startup & admin auto-seeding
app.listen(PORT, async () => {
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
