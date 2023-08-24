const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
var fetchUser = require('../middleware/fetchUser');

//Create a user using: POST "/api/auth/". No login required
router.post('/createuser', [
    //Used express validator for parameters constraint 
    body('name', "Name should be more than 2 characters").isLength({ min: 3 }),
    body('email', "Enter a valid email").isEmail(),
    body('password', "Password must be atleast 5 characters").isLength({ min: 5 })
], async (req, res) => {
    //Check for error with express validator and return the error with status 400 if there are any or proceed further
    const result = validationResult(req);
    if (!result.isEmpty()) {
        return res.status(400).json({ errors: result.array() })
    }
    try { //Use try catch block for internal server error if they are mistakes on server side rather than on client side
        //Check whether email already exists in the database 
        let user = await User.findOne({ email: req.body.email })
        if (user) { //if yes then throw error with bad request
            return res.status(400).json({ error: "User with this email already exists" })
        }
        //Other continue by creating user

        //Create a hash for password for security before storing the hashed password in the db
        const salt = await bcrypt.genSalt(10);
        const secPass = await bcrypt.hash(req.body.password, salt);

        user = await User.create({
            name: req.body.name,
            email: req.body.email,
            password: secPass,
        })

        const data = {
            user: {
                id: user.id
            }
        }

        const authToken = jwt.sign(data, process.env.JWT_SECRET)
        // console.log(authToken)
        res.json({ authToken })
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal server error")
    }
    
})

//Authenticate User using: POST "api/auth/login". No login required
router.post('/login', [
    //Used express validator for parameters constraint 
    body('email', "Enter a valid email").isEmail(),
    body('password', "Password cannot be blank").exists(),
], async (req, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        return res.status(400).json({ errors: result.array() })
    }
    const {email, password} = req.body;
    try {
        let user = await User.findOne({email: email})
        if(!user){
            return res.status(400).json({error: "Please try to login with correct credentials"});
        }
        const passwordCompare = await bcrypt.compare(password, user.password);
        if(!passwordCompare){
            return res.status(400).json({ error: "Please try to login with correct credentials" });
        }
        const payload = {
            user: {
                id: user.id
            }
        }
        const authToken = jwt.sign(payload, process.env.JWT_SECRET)
        res.send({authToken})
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal server error");
    }
})

//Get loggedin User details using: POST "/api/auth/getuser" Login required
router.get('/getuser', fetchUser, async (req, res) => {
    try {
        const userId = req.user.id
        const user = await User.findById(userId).select('-password')
        res.send(user)
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal server error");
    }
})


module.exports = router