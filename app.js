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

app.get("/firstpage",(req,res)=>{
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
    bcrypt.genSalt(10,(err,salt)=>{
        bcrypt.hash(req.body.password,salt,async(err,hash)=>{
            
            //before creating check wether the user already exists or not 
            let user=await userModel.findOne({email:req.body.email});

            if(user){
                res.send("user already exists!!")
            }
            else{
                let user=await userModel.create({
                    username:req.body.username,
                    email:req.body.email,
                    password:hash,
                    age:req.body.age,
                    role:req.body.role
                })
                console.log("user created sucessfully");

                //create a cookie and send it to the browser
                let token=jwt.sign({userid:user._id,email:user.email,role:user.role},"shhh");
                res.cookie("token",token);
            }
            
        })
    })

})


app.get("/login",(req,res)=>{
    res.render("login");
})


app.post("/login",async(req,res)=>{
    /*req={
        method:post,
        headers:{____},
        body:{
            email:"aksharaguru123@gmail.com",
            password:"Vallalar999"
        }
        cookie:{
            token:"sgjdhgarchdletchwrt#%25dgwinmxiafr37493#....."
        }
    }*/
    
    //find the userdoc which has email id as "aksharaguru123@gmail.com"
    let user=await userModel.findOne({email:req.body.email});

    if(user){
        //verify the password
        bcrypt.compare(req.body.password,user.password,async(err,result)=>{
            if(result){
                if(user.role==="student"){
                    res.render("studentdashboard",{user:user});
                }
                else if(user.role==="instructor"){
                    res.render("instructor",{user:user});
                }
                else if(user.role==="admin"){
                    res.render("admin",{user:user});
                }
            }
            else{
                 res.send("you cannot login!!");
            }
        })
    }
    else{
        res.send("user does not exist!!");
    }

})


app.get("/logout",(req,res)=>{
    res.cookie("token","");
    res.redirect("/login");
})


function isLoggedIn(req,res,next){
    if(req.cookies.token===""){
        res.send("your are logged out,Please Login");
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
