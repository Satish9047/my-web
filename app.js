require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");
const bcrypt = require("bcrypt");
const saltRounds = 8;
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();
app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

mongoose.connect('mongodb://127.0.0.1:27017/userDB', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB Connected'))
  .catch((err) => console.log(err));

const userSchema = new mongoose.Schema ({
   email: {
     type: String,
     required: true,
     unique: true
   },
   password:{
     type: String,
     required: true
   }
});

const User = new mongoose.model("User", userSchema);

//get request handler
  app.get("/", (req, res)=>{
    res.render("home");

  });

  app.get("/login", (req, res)=>{
    res.render("login");
  });

  app.get("/register", (req, res)=>{
    res.render("register");
  });

//post request handler
  app.post("/register", async (req, res) => {
    //if user already existed
    User.findOne({email: req.body.username})
    .then((user)=> {
      if(user){
        let error = [];
        error.push({text:"Email already exist"});
        res.render("register");
      } else {
        //if email not existed
        bcrypt.hash(req.body.password, saltRounds, function(err, hash){
          const newUser = new User({
            email: req.body.username,
            password: hash
          });
          newUser.save()
          res.render("login");
        })
      }
    })
  });



  app.post("/login", async(req, res) =>{
    try {
      const username = req.body.username;
      const pass = req.body.password;
      console.log(pass);

      const userEmail = await User.findOne({email: username});
      if (!userEmail) {
        return res.send("Invalid username or password.");
      }

      bcrypt.compare(pass, userEmail.password, function(err, result){
        if (err) {
          return res.send("An error occurred while processing your request.");
        }

        if (result === true){
          res.render("dashboard");
        } else {
          return res.send("Invalid username or password.");
        }
      });
    } catch (error) {
      res.send("An error occurred while processing your request.")
    }
  });



// app.post("/login", async(req, res) =>{
//   try {
//     const username = req.body.username;
//     const pass = req.body.password;
//     console.log(pass);
//
//     const userEmail = await User.findOne({email: username});
//     console.log(userEmail.password);
//     bcrypt.compare(pass, userEmail.password, function(err, result){
//       if (result === true){
//         res.render("dashboard");
//       } else {
//         res.send("invalid information !!!");
//       }
//     });
//   } catch (error) {
//     res.send("invalid information")
//   }
// });


//Logout
app.get("/Logout", (req, res)=>{
  res.redirect("/");
})

//service open for listning the request in port 3000!
app.listen(3000, ()=>{
  console.log("server is listning in port 3000 !!!");
});
