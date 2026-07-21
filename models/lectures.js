const mongoose = require('mongoose');

let lectureSchema = new mongoose.Schema({
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "course",
        required: true
    },
    title: {
        type: String,
        required: true
    },
    videoType: {
        type: String,
        enum: ["upload", "youtube"],
        required: true
    },
    videoUrl: {
        type: String,
        required: true
    },
    order: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("lecture", lectureSchema);