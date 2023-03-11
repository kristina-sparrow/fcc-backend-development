require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose')
const bodyParser = require('body-parser');
const app = express();

// Basic Configuration
try {
  mongoose.connect(process.env.DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
} catch (err) {
  console.log(err);
}

const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())
app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Model
const schema = new mongoose.Schema(
  {
      original: { type: String, required: true },
      short: { type: Number, required: true }
  }
);
const Url = mongoose.model('Url', schema);

// Your first API endpoint
app.get('/api/shorturl/:input', async (req, res) => {
  const input = parseInt(req.params.input);

  try {
    const data = await Url.findOne({ short: input });
    if (data === null) {
      return res.json('URL NOT FOUND');
    }
    return res.redirect(data.original);
  } catch (err) {
    console.log(err);
    return res.json('SERVER ERROR');
  }
});

app.post('/api/shorturl', async (req, res) => {
  const bodyUrl = req.body.url;
  const urlRegex = new RegExp(
    /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&\/\/=]*)/
  );

  if (!bodyUrl.match(urlRegex)) {
    return res.json({ error: 'Invalid URL' });
  }

  try {
    const data = await Url.findOne().sort({ short: 'desc' }).exec();
    const index = data !== null ? data.short + 1 : 1;

    const newUrl = await Url.findOneAndUpdate(
      { original: bodyUrl },
      { original: bodyUrl, short: index },
      { new: true, upsert: true }
    );
    res.json({ original_url: bodyUrl, short_url: newUrl.short });
  } catch (err) {
    console.log(err);
    return res.json({ error: 'SERVER ERROR' });
  }
});

app.listen(port, function () {
    console.log(`Listening on port ${port}`);
});