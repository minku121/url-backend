const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const shortid = require('shortid');
const app = express();
const cors = require('cors');
app.use(bodyParser.json());
const dotenv = require('dotenv');
dotenv.config();

app.use(cors({
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  origin: '*'
}));

async function connectToDB() {
  try {
    await mongoose.connect(process.env.MONGOURL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

connectToDB();

const urlSchema = new mongoose.Schema({
  longUrl: { type: String, required: true },
  shortUrl: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  pageViews: { type: Number, default: 0 }
});

const UrlMapping = mongoose.model('link', urlSchema);

app.post('/v1/pageview/:shortUrl', async (req, res) => {
  const { shortUrl } = req.params;
  try {
    const urlMapping = await UrlMapping.findOne({ shortUrl });
    if (!urlMapping) {
      return res.status(404).json({ error: 'Short URL not found' });
    }
    urlMapping.pageViews++;
    await urlMapping.save();
    res.json({ pageViews: urlMapping.pageViews });
  } catch (error) {
    console.error("Error incrementing page views:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/v1/short-url', async (req, res) => {
  const { longUrl } = req.body;
  const { customLink } = req.body;

  if (!customLink) {

    try {
      const shortUrl = shortid.generate(); // Generate a unique short URL using shortid
      const existingMapping = await UrlMapping.findOne({ shortUrl });
      if (existingMapping) {
        // Handle the case where the generated short URL already exists
        return res.status(409).json({ error: 'Short URL already exists' });
      }
      const newMapping = new UrlMapping({ longUrl, shortUrl });
      await newMapping.save();
      res.status(201).json({ shortUrl });
    } catch (error) {
      console.error("Error creating short URL:", error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (customLink) {

    try {
      const shortUrl = customLink;
      const existingMapping = await UrlMapping.findOne({ shortUrl });
      if (existingMapping) {
        return res.status(409).json({ error: 'Short custom URL already exists' });
      }
      const newMapping = new UrlMapping({ longUrl, shortUrl });
      await newMapping.save();
      res.status(201).json({ shortUrl });
    } catch (error) {
      console.error("Error creating short custom URL:", error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});