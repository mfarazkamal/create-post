const express = require("express");
const coockieParser = require("cookie-parser");
const postModel = require("./models/post");
const userModel = require("./models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(coockieParser());

app.get('/', (req, res) => {
    res.render("index")
})

app.post('/register', async (req, res) => {
    const { username, name, email, password, age } = req.body;

    let checkUser = await userModel.findOne({ email });

    if (checkUser) {
        return res.status(400).send("User already exists");
    }
    else {
        bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(password, salt, async (err, hash) => {
                if (err) throw err;
                let user = await userModel.create({
                    username,
                    name,
                    email,
                    password: hash,
                    age
                })

                let token = jwt.sign({ email: user.email, userid: user._id }, 'shhhhhs');
                res.cookie("token", token);
                res.render("successfull");
            })
        })
    }


})

app.get('/login', (req, res) => {
    res.render("login")
})

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    let checkUser = await userModel.findOne({ email });

    if (!checkUser) {
        return res.status(404).render("error");
    }
    else {
        bcrypt.compare(password, checkUser.password, (err, result) => {
            console.log(result);
            if (result) {
                let token = jwt.sign({ email: checkUser.email, userid: checkUser._id }, 'shhhhhs');
                res.cookie("token", token);
                res.status(200).redirect("/profile");
            }

            else res.redirect("/login");
        })
    }


})

app.get('/like/:id', isLoggedIn, async (req, res) => {
    let post = await postModel.findOne({_id: req.params.id}).populate("user");

    if(post.likes.indexOf(req.user.userid) === -1){

        post.likes.push(req.user.userid);
    } 
    else{
        post.likes.splice(post.likes.indexOf(req.user.userid), 1);
    }
    await post.save();
    res.redirect("/profile");
})


app.get('/edit/:id', isLoggedIn, async (req, res) => {
    let post = await postModel.findOne({_id: req.params.id}).populate("user");
    res.render("edit", {post});
})

app.get('/profile', isLoggedIn, async (req, res) => {
    let user = await userModel.findOne({email: req.user.email}).populate("posts");
    res.render("profile", {user});
})

app.post('/post', isLoggedIn, async (req, res) => {
    let user = await userModel.findOne({email: req.user.email})
    let {content} = req.body;
    let post = await postModel.create({
        user: user._id,
        content,
    })
    
    user.posts.push(post._id);
    await user.save();
    res.redirect("/profile");
})

app.post('/update/:id', isLoggedIn, async (req, res) => {
    let post = await postModel.findOneAndUpdate({_id: req.params.id}, {content: req.body.content});
    res.redirect("/profile");
})

app.get('/logout', (req, res) => {
    res.clearCookie("token");
    res.render("logout");
})


function isLoggedIn(req, res, next) {
    if (req.cookies.token === "") { 
        res.redirect("/login"); }
    else {
        let data = jwt.verify(req.cookies.token, 'shhhhhs');
        req.user = data;
        next();
    }
}



app.listen(port, () => {
    console.log("Server is running on specified port");

})