const express = require('express')
const mongoose = require('mongoose')
const user = require('./usermodel')
const jwt = require('jsonwebtoken')
const middleware = require('./middleware')
const diet = require('./dietmodel')
const cors = require('cors')
const record = require('./recordmodel')
const bcrypt = require('bcrypt');

const app = express()
app.use(express.json())
app.use(cors({origin:'*'}))

mongoose.connect('mongodb+srv://pranahith:pranahith@cluster0.jd7j7zy.mongodb.net/?retryWrites=true&w=majority').then(
    () => console.log('DB Connected')
)

app.get('/',(req,res)=>{
    return res.send('Hello')
})

app.post('/register', async (req,res)=>{
    try{
        const {name, email, password, confirmpassword} = req.body
        const exist = await user.findOne({email})
        if(exist){
            return res.status(400).send('User Already Registered')
        }
        if(password != confirmpassword) {
            return res.status(403).send(`Passwords doesn't match`)
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        let newUser = new user({
            name, email, password:hashedPassword
        })
        newUser.save()
        return res.status(200).send('User Registered')
    } catch(err) {
        console.log(err)
        return res.status(500).send('Server Error')
    }
})

app.post('/login', async (req,res) => {
    try{
        const {email,password} = req.body
        const exist = await user.findOne({email})
        
        if(!exist) {
            return res.status(400).send('User Not Found')
        }
        const checkPassword = await bcrypt.compare(password, exist.password);
        if(!checkPassword) {
            return res.status(403).send('Invalid Credentials')
        }
        let payload = {
            userdetails: {
                id: exist.id
            }
        }
        jwt.sign(payload,'jwtPassword',{expiresIn:360000000},
        (err,token)=>{
            if(err) throw err
            return res.json({token})
        })
    } catch(err) {
        console.log(err)
        res.status(500).send('Server Error')
    }
})

app.get('/allprofiles', middleware, async (req,res) => {
    try {
        let profile = await user.find()
        return res.json(profile)
    } catch(err) {
        console.log(err)
        return res.status(500).send('Server Error')
    }
})

app.post('/dashboard/:userId', middleware, async (req,res) => {
    try{
        const temp = req.params.userId
        const {itemname, calorie, protein} = req.body
        const itemExist = await diet.findOne({userId: temp, itemname})
        if(itemExist) {
            return res.status(401).send("Item Exists")
        }
        const newItem = new diet({
            userId: temp,
            itemname, calorie, protein
        })
        newItem.save()            
        return res.status(200).send("New Item Added")
    } catch(err) {
        console.log(err)
        res.status(500).send("Server Error")
    }
})

app.get('/dashboard/:userId', middleware, async(req,res) => {
    try {
        const temp = req.params.userId;
        let items = await diet.find({userId: temp})
        return res.json(items)
    } catch(err) {
        console.log(err)
        return res.status(500).send('Server Error')
    }
})

//Delete single item
app.delete('/dashboard/:userId', middleware, async (req,res) => {
    try {
        const id = req.params.userId
        const {_id} = req.body
        const dt = await diet.findOneAndDelete({userId:id, _id})
        if(!dt) {
            return res.status(400).send("Item Not Found")
        }
        // console.log(dt)
        return res.status(200).send("Item Deleted")
    } catch (err) {
        console.log(err);
        res.status(500).send('Server Error')
    }
})

//Delete Profile & Items
app.delete('/myprofile/:userId', middleware, async (req,res) => {
    try {
        const temp = req.params.userId
        await diet.deleteMany({userId: temp})
        await record.deleteMany({userId: temp})
        await user.findByIdAndDelete(temp)
        return res.status(200).send(`Deleted All Records of ${temp}`)
    } catch (err) {
        console.log(err);
        res.status(500).send('Server Error')
    }
})

app.get('/myprofile/:userId', middleware, async (req,res) => {
    try {
        const temp = req.params.userId
        const userExists = await user.findById(temp)
        if(!userExists){
            return res.status(400).send('User Not Found')
        }
        return res.json(userExists)
    } catch(err) {
        console.log(err)
        return res.status(500).send('Server Error')
    }
})

app.put('/myprofile/:userId', middleware, async (req,res) => {
    try {
        const userId = req.params.userId
        const {name, email, password, confirmpassword} = req.body
        const exist = await user.findOne({email})
        if(exist) {
            return res.status(400).send('User Exists')
        }
        if(password!=confirmpassword) {
            return res.status(400).send("Password doesn't match")
        }
        const hashedPassword = await bcrypt.hash(password, 10)
        await user.findByIdAndUpdate(userId,{name,email,password:hashedPassword})
        return res.status(200).send('User Details Updated')
    } catch(err) {
        console.log(err)
        return res.status(500).send('Server Error')
    }
})

app.put('/dashboard/:userId', middleware, async (req, res) => {
    try {
        const id = req.params.userId
        const {date, caloriecount, proteincount, _id} = req.body
        const findItem = await diet.findById(_id)
        const findDate = await record.findOne({date, userId:id})
        if(findDate){
            await record.findOneAndUpdate({userId:id, date}, {caloriecount: findItem.calorie+findDate.caloriecount,
                proteincount: findItem.protein+findDate.proteincount}, req.body)
            return res.json(findDate)
        }
        let newRecord = new record({
            date, caloriecount, proteincount, userId:id
        })
        newRecord.save()
        return res.json(newRecord)
    } catch (error) {
        console.error(error);
        res.status(500).json('Server Error');
    }
});

app.patch('/dashboard/:userId', middleware, async (req,res) => {
    const id = req.params.userId
    const dateInp = req.body.date
    const allDate = await record.find({userId: id})
    const specificDate = await record.findOne({userId: id, date: dateInp})
    const data = {
        allDate: allDate,
        specificDate: specificDate
    }
    return res.json(data)
})

app.listen(5000, ()=>console.log('Server started...'))
