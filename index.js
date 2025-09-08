require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

const { Schema } = mongoose;
const userSchema = new Schema({
  username: { type: String, required: true },
  log: [
    {
      description: { type: String, required: true },
      duration: { type: Number, required: true },
      date: { type: Date, default: Date.now }
    }
  ]
});

const User = mongoose.model('User', userSchema);

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

app.post('/api/users', async (req, res) => {
  try {
    const { username } = req.body;
    const newUser = new User({ username, log: [] });
    const savedUser = await newUser.save();
    res.json({ username: savedUser.username, _id: savedUser._id });
  } catch (err) {
    if (err.name === 'ValidationError') {
      res.status(400).json({ error: err.message });
    } else {
      res.status(500).json({ error: 'Server error' });
    }
  }
});

app.get("/api/users", async (req, res)=>{
  try{
    const userArray =  await User.find({});
    res.json(userArray)
  }
  catch(err)
  {
    console.log(err)
  }
})

app.post("/api/users/:_id/exercises", async (req, res)=>{
  try{
    const userId = req.params._id;
    const {description, duration} = req.body;

    const exerciseObj = {
      description: description,
      duration: duration,
    }
    if(req.body.date)
    {
      exerciseObj.date = new Date(req.body.date);
    }

    const user = await User.findById(userId)
    if(!user)
    {
      return res.json({error: "Not found"})
    }
    

    user.log.push(exerciseObj);
    await user.save()
    
    const addedLog = user.log[user.log.length - 1];

    res.json({
      _id: user._id,
      username: user.username,
      date: addedLog.date.toDateString(),
      duration: addedLog.duration,
      description: addedLog.description
    });
  }
  catch(err)
  {
    console.log(err)
  }
})

app.get("/api/users/:_id/logs", async (req, res)=>{
  try{
    const userId = req.params._id;
    const user = await User.findById(userId);
    if(!user){
      return res.json({error: "Not found"})
    }

    const userLogs = user.log;

    let LogObj = {
      username: user.username,
      count: userLogs.length,
      _id: user._id,
      log: userLogs
    }
    res.json(LogObj)
  }
  catch(err)
  {
    console.log(err)
  }
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
