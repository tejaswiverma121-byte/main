const mongoose=require('mongoose');

mongoose.connect(`mongodb://127.0.0.1:27017/LearnHub`)
let userschema=new mongoose.Schema({
    username:String,
    email:String,
    password:String,
    age:Number,
    role:String,
    isApproved: { type: Boolean, default: false },
    purchasedCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'course' }],
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'course' }]
})

module.exports=mongoose.model("user",userschema);
