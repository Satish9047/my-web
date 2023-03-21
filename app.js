const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const app = express();
app.use(express.static("public"));
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


app.get("/", (req, res)=>{
  res.sendFile(__dirname+"/views/home.html");
});

app.get("/login", (req, res)=>{
  res.sendFile(__dirname+"/views/login.html");
});

app.get("/register", (req, res)=>{
  res.sendFile(__dirname+"/views/register.html");
});



app.post("/register", async (req, res)=>{
    const newUser = new User({
      email: req.body.username,
      password: req.body.password
    });
//  await newUser.save()
res.sendFile(__dirname+ "/views/login.html");
});



app.post("/login", async(req, res) =>{
  try {
    const username = req.body.username;
    const pass = req.body.password;
    console.log(pass);

    const userEmail = await User.findOne({email: username});
    console.log(userEmail.password);
    if(userEmail.password === pass){
      res.sendFile(__dirname+"/views/dashboard.html");
    } else {
      res.send("invalid information !");
    }
  } catch (error) {
    res.send("invalid information")
  }
});




//Logout
app.get("/Logout", (req, res)=>{
  res.sendFile(__dirname+"/views/home.html");
})

//service open for listning the request in port 3000!
app.listen(3000, ()=>{
  console.log("server is listning in port 3000 !!!");
});
