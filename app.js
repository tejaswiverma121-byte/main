const express=require('express');
const path=require('path');
const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken')
const cookieParser = require('cookie-parser');
//require the user model
const userModel=require('./models/user');

const app=express();

//middlewares
app.set("view engine","ejs");
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname,'public')));
app.use(cookieParser());

//routes

app.get("/",(req,res)=>{
    res.render("index");
})

app.get("/create",(req,res)=>{
    res.render("createaccount");
})


app.post("/create",(req,res)=>{
    /*  req={
            methd:"post",
            headers:{},
            body:{
                username:"akshara",
                email:"aksharaguru123@gmail.com",
                password:"Vallalar999",
                age:19,
                role:student
            }
        }
    */
   if(req.body.role!=="student"&&req.body.role!=="instructor"){
    return res.send("Invalid Role Selected");
   }
    bcrypt.genSalt(10,(err,salt)=>{
        bcrypt.hash(req.body.password,salt,async(err,hash)=>{
            
            //before creating check wether the user already exists or not 
            let user=await userModel.findOne({email:req.body.email});

            if(user){
                //res.send("user already exists!!")
                res.render("user_already_exists");
            }
            else{
                let user=await userModel.create({
                    username:req.body.username,
                    email:req.body.email,
                    password:hash,
                    age:req.body.age,
                    role:req.body.role
                })
                //console.log("user created sucessfully");
                res.render("creationsucessfull");

                //create a cookie and send it to the browser
                let token=jwt.sign({userid:user._id,email:user.email,role:user.role},"shhh");
                res.cookie("token",token);
                res.redirect("/login/" + user.role);
            }
            
        })
    })

})
//student+instructor login
 app.get("/login/:role",(req,res)=>{
    const role=req.params.role;
    if(role!=="student"&&role!=="instructor"){
        return res.send("Invalid login type");
    }
    res.render("login",{role:role});
 })

app.post("/login/:role",async(req,res)=>{
    const expectedRole = req.params.role;

    if(expectedRole !== "student" && expectedRole !== "instructor"){
        return res.send("Invalid login type");
    }
    /*req={
        method:post,
        headers:{____},
        body:{
            email:"aksharaguru123@gmail.com",
            password:"Vallalar999"
        }
        
    }*/

    
    //find the userdoc which has email id as "aksharaguru123@gmail.com"

    let user=await userModel.findOne({email:req.body.email});
    if(!user){
        return res.render("usernotfound");
    }

    if(user.role !== expectedRole){
        return res.send(`This account is registered as ${user.role}, please use the ${user.role} login`);
    }
    if(user){
        //verify the password
        bcrypt.compare(req.body.password,user.password,async(err,result)=>{
            if(!result){
            return res.send("you cannot login!!");
            }
            if(result){
                if(user.role==="instructor"&&!user.isApproved){
                    return res.send("Your instructor account is pending admin approval.");
                }
                if(user.role==="student"){
                    res.render("studentdashboard",{user:user});
                }
                else if(user.role === "instructor"){
                    res.render("instructor",{user:user});
                }
                else if(user.role==="admin"){
                    res.render("admin",{user:user});
                }
                //create a token and send a cookie
                let token=jwt.sign({userid:user._id,email:user.email,role:user.role},"shhh");
                res.cookie("token",token);

            }
            else{
                //res.send("you cannot login!!");
                res.render("loginfailed");
            }
        })
    }

})

//admin login

app.get("/admin/login",(req,res)=>{
    res.render("adminlogin");
})
app.post("/adminlogin",async(req,res)=>{
    let user = await userModel.findOne({email:req.body.email, role:"admin"});

    if(!user){
        return res.send("Invalid admin credentials");
    }

    bcrypt.compare(req.body.password, user.password, async(err,result)=>{
        if(!result){
            return res.send("Invalid admin credentials");
        }
        let pendingInstructors = await userModel.find({role:"instructor", isApproved:false});
        res.render("admin", { user:user, pendingInstructors:pendingInstructors });
    })
})

app.post("/admin/approve/:id", async(req,res)=>{
    await userModel.findByIdAndUpdate(req.params.id, { isApproved:true });
    res.redirect("/admin/login");
})

//logout
app.get("/logout",(req,res)=>{
    res.cookie("token","");
    res.redirect("/login");
})


function isLoggedIn(req,res,next){
    if(req.cookies.token===""){
        //res.send("your are logged out,Please Login");
        res.render("notloggedin");
    }
    else{
        let data=jwt.verify(req.cookies.token,"shhh");
        req.userinfo=data;
        next();
    }


}

app.listen(4000,(req,res)=>{
    console.log("the server is waiting for requests in port 4000!!!");
})
