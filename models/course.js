const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: true 
    },
    description: { 
        type: String, 
        required: true 
    },
    category: { 
        type: String, 
        default: 'Development' 
    },
    price: { 
        type: Number, 
        default: 0 
    },
    thumbnail: { 
        type: String, 
        default: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500' 
    },
    status: { 
        type: String, 
        enum: ['Published', 'Draft'], 
        default: 'Published' 
    },
    instructor: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'user' 
    },
    instructorName: { 
        type: String, 
        default: 'Instructor' 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('course', courseSchema);
