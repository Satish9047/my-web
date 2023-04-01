require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");

const app = express();
app.use(express.json());
app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

//sid signature
app.use(session({
  secret: "My Secret",
  resave: false,
  saveUninitialized: false
}));
//added
app.use(passport.authenticate('session'));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://127.0.0.1:27017/userDB', { useNewUrlParser: true})
  .then(() => console.log('MongoDB Connected'))
  .catch((err) => console.log(err));


const userSchema = new mongoose.Schema ({
   email: String,
   password: String,
   googleId: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    cb(null, { id: user.id, username: user.username, name: user.name });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRATE,
    callbackURL: "http://localhost:3000/auth/google/dashboard",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);

    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));



//get request handler
  app.get("/", (req, res)=>{
    res.render("home");
  });

  app.get("/auth/google",
    passport.authenticate("google", { scope: ["profile"] })
  );

  app.get("/auth/google/dashboard",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    res.redirect("/dashboard");
  });

  app.get("/login", (req, res)=>{
    res.render("login");
  });

  app.get("/register", (req, res)=>{
    res.render("register", {message: ""});
  });


//register
app.post('/register', async (req, res) => {
  const email = req.body.username;
  const password = req.body.password;

  const user = await User.findOne({ email: email }).exec();
  if (user) {
    console.log("user already exists !!!!!");
    res.render("register", { message: "User Already exist, Try login !" });
  } else {
    User.register({username: email}, req. body.password)
      .then(user => {
        passport.authenticate("local")(req, res, function(){
          res.render("register", {message: "User registered successfully."})
        })
      })
      .catch(err =>{
        console.log(err);
        res.redirect("/register")
      })
  }
});


  app.get("/dashboard",(req, res)=>{
    if (req.isAuthenticated()){
      res.render("dashboard");
    } else {
      res.redirect("/login");
    }
  });


//Login
app.post("/login", (req, res)=>{
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });
    req.login(user, function(err){
      if(err){
        console.log(err);
        res.redirect("/login");
      } else{
        passport.authenticate("local")(req, res, function(){
          res.redirect("/dashboard");
        });
      }
    });
  });

app.get("/change-password", (req, res)=>{
  if (req.isAuthenticated()){
    res.render("change-password", {message:""});
  } else{
    res.redirect("/login");
  }
})

//change password
app.post('/change-password', async (req, res) => {
  const email = req.body.username;
  const oldPassword = req.body.oldPassword;
  const newPassword = req.body.newPassword;

  console.log(req.body);

  // Find the user
  const user = await User.findByUsername(email);
  if (!user) {
    console.log("Invalid User Name!");
    res.render("change-password", { message: "User not found!" });
    return;
  }

  if (oldPassword === newPassword){
    console.log("old password cannot be the new password!");
    res.render("change-password", { message: "old password cannot be the new password!" });
    return;
  }

  // Check if old password is correct
  user.authenticate(oldPassword, function(err, authenticated) {
    if (err) {
      console.log(err);
      res.render("change-password", { message: "An error occurred while changing your password." });
      return;
    }

    if (!authenticated) {
      console.log("Incorrect old password!");
      res.render("change-password", { message: "Incorrect old password!" });
      return;
    }

    // Set the new password
    user.setPassword(newPassword, function(err) {
  if (err) {
    console.log(err);
    res.render("change-password", { message: "An error occurred while changing your password." });
    return;
  }

    user.save().then(function() {
      console.log("Password changed successfully!");
      res.render("change-password", { message: "Password changed successfully!" });
      }).catch(function(err) {
      console.log(err);
      res.render("change-password", { message: "An error occurred while changing your password." });
    });
  });
});
});



//Logout
app.get('/logout', function(req, res) {
  req.session.destroy(function(err) {
    if(err) {
      console.log(err);
    } else {
      res.redirect('/');
    }
  });
});


//service open for listning the request in port 3000!
app.listen(3000, ()=>{
  console.log("server is listning in port 3000 !!!");
});
