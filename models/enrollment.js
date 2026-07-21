const mongoose = require('mongoose');

let enrollmentSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "course",
        required: true
    },
    enrolledAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("enrollment", enrollmentSchema);