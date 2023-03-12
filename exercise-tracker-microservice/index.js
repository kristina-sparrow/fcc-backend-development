const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose');
const { Schema } = mongoose
const bodyParser = require('body-parser');
require('dotenv').config()

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(cors())
app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

main().catch(err => console.log(err))

async function main() {
  await mongoose.connect(process.env.DB_URI)
}

const userSchema = new Schema({
  username: { type: String, required: true, unique: true },
  exercises: [{
    description: String,
    duration: Number,
    date: Date
  }]
}, { versionKey: false })

const User = mongoose.model('User', userSchema)
const ERROR = { error: "There was an error while getting the users." };

app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({})
    res.json(users)
  } catch (error) {
    res.status(500).json(ERROR)
  }
})

app.get('/api/users/:id/logs', async (req, res) => {
  const id = req.params.id;
  const dateFrom = new Date(req.query.from);
  const dateTo = new Date(req.query.to);
  const limit = parseInt(req.query.limit);

  try {
    const user = await User.findById(id)
    if (!user) return res.status(404).json(ERROR)

    let log = user.exercises.filter(exercise =>
      new Date(exercise.date).getTime() > dateFrom.getTime()
      && new Date(exercise.date).getTime() < dateTo.getTime()
    )

    log = log.map(exercise => ({
      description: exercise.description,
      duration: exercise.duration,
      date: new Date(exercise.date).toDateString()
    }))

    if (limit) log = log.slice(0, limit)

    res.json({
      _id: user._id,
      username: user.username,
      count: log.length,
      log: log
    })
  } catch (error) {
    res.status(500).json(ERROR)
  }
})

app.post('/api/users', async (req, res) => {
  const username = req.body.username;

  try {
    const user = await User.create({ username: username })
    res.json({ _id: user._id, username: user.username })
  } catch (error) {
    res.status(500).json(ERROR)
  }
})

app.post('/api/users/:id/exercises', async (req, res) => {
  const id = req.params.id;
  let { description, duration, date } = req.body;

  const newExercise = {
    description: description,
    duration: duration,
    date: date ? new Date(date).toDateString() : new Date().toDateString()
  };

  try {
    const user = await User.findById(id)
    if (!user) return res.status(404).json(ERROR)

    user.exercises.push(newExercise);
    await user.save()

    const response = {
      username: user.username,
      description: newExercise.description,
      duration: newExercise.duration,
      date: new Date(newExercise.date).toDateString(),
      _id: user._id
    };

    res.json(response)
  } catch (error) {
    res.status(500).json(ERROR)
  }
})

const listener = app.listen(process.env.PORT || 3000, () => {
    console.log('Your app is listening on port ' + listener.address().port)
})