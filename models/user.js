const mongoose=require('mongoose');

mongoose.connect(`mongodb://127.0.0.1:27017/LearnHub`)
let userschema=new mongoose.Schema({
    username:String,
    email:String,
    password:String,
    age:Number,
    role:String
})

module.exports=mongoose.model("user",userschema);

/* user class will get created and it will have the user schema 

    class user{
        username:string,
        email:string,
        password:String,
        age:Number
    }

    in mongo-db users collection will get created

    module.exports will export the user (class/model) to the app.js file

*/ 