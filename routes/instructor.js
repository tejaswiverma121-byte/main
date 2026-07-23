const express   = require('express');
const router    = express.Router();
const userModel = require('../models/user');
const courseModel = require('../models/course');
const enrollmentModel = require('../models/enrollment');
const { isLoggedIn } = require('../middlewares/auth');

router.get('/dashboard/instructor', isLoggedIn, async (req, res) => {
    if (req.userinfo.role !== 'instructor') return res.redirect('/');
    try {
        const user = await userModel.findById(req.userinfo.userid);
        const courses = await courseModel.find({ instructor: req.userinfo.userid }).sort({ _id: -1 });
        const allCoursesCount = courses.length;

        const courseIds = courses.map(c => c._id);
        const enrollments = await enrollmentModel.find({ course: { $in: courseIds } });

        res.render('instructor', { user, courses, totalCourses: allCoursesCount, enrollments });
    } catch (err) {
        console.error('Error loading instructor dashboard:', err);
        res.redirect('/');
    }
});

router.get('/dashboard/instructor/courses', isLoggedIn, async (req, res) => {
    if (req.userinfo.role !== 'instructor') return res.redirect('/');
    try {
        const user = await userModel.findById(req.userinfo.userid);
        const courses = await courseModel.find({ instructor: req.userinfo.userid }).sort({ _id: -1 });
        res.render('instructor-courses', { user, courses });
    } catch (err) {
        console.error(err);
        res.redirect('/dashboard/instructor');
    }
});
router.get('/dashboard/instructor/students', isLoggedIn, async (req, res) => {
    if (req.userinfo.role !== 'instructor') return res.redirect('/');
    try {
        const user = await userModel.findById(req.userinfo.userid);
        const instructorCourses = await courseModel.find({ instructor: req.userinfo.userid });
        const courseIds = instructorCourses.map(c => c._id);

        const enrollments = await enrollmentModel
            .find({ course: { $in: courseIds } })
            .populate("student", "username email")
            .populate("course", "title");

        res.render('instructor-students', { user, enrollments });
    } catch (err) {
        console.error('Error loading students:', err);
        res.redirect('/dashboard/instructor');
    }
});
const lectureModel = require('../models/lectures');
const upload = require('../middlewares/upload');

// Show all lectures for a specific course
router.get('/dashboard/instructor/courses/:courseId/lectures', isLoggedIn, async (req, res) => {
    if (req.userinfo.role !== 'instructor') return res.redirect('/');
    try {
        const user = await userModel.findById(req.userinfo.userid);
        const course = await courseModel.findById(req.params.courseId);

        if (!course || course.instructor.toString() !== req.userinfo.userid) {
            return res.send("Access denied — this isn't your course.");
        }

        const lectures = await lectureModel.find({ course: req.params.courseId }).sort({ order: 1 });

        res.render('instructor-lectures', { user, course, lectures });
    } catch (err) {
        console.error('Error loading lectures:', err);
        res.redirect('/dashboard/instructor/courses');
    }
});

// Add a new lecture (upload OR youtube link)
router.post('/dashboard/instructor/courses/:courseId/lectures/add', isLoggedIn, upload.single('videoFile'), async (req, res) => {
    if (req.userinfo.role !== 'instructor') return res.redirect('/');
    try {
        const course = await courseModel.findById(req.params.courseId);

        if (!course || course.instructor.toString() !== req.userinfo.userid) {
            return res.send("Access denied — this isn't your course.");
        }

        let videoType, videoUrl;

        if (req.body.youtubeLink && req.body.youtubeLink.trim() !== "") {
            videoType = "youtube";
            videoUrl = req.body.youtubeLink.trim();
        } else if (req.file) {
            videoType = "upload";
            videoUrl = "/uploads/videos/" + req.file.filename;
        } else {
            return res.send("Please either upload a video file or provide a YouTube link.");
        }

        await lectureModel.create({
            course: req.params.courseId,
            title: req.body.title,
            videoType: videoType,
            videoUrl: videoUrl
        });

        res.redirect(`/dashboard/instructor/courses/${req.params.courseId}/lectures`);
    } catch (err) {
        console.error('Error adding lecture:', err);
        res.send("Something went wrong while adding the lecture.");
    }
});

// Delete a lecture
router.post('/dashboard/instructor/lectures/delete/:id', isLoggedIn, async (req, res) => {
    if (req.userinfo.role !== 'instructor') return res.redirect('/');
    try {
        await lectureModel.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting lecture:', err);
        res.status(500).json({ success: false });
    }
});
module.exports = router;