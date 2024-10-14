require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const app = express();
const ShortUrls = require("./urlModels");
const shortid = require("shortid");

app.set("view engine", "ejs");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(req.path, req.method);
  next();
});

app.get("/", async (req, res) => {
  try {
    const shortUrls = await ShortUrls.find();
    res.render("index", { shortUrls: shortUrls });
  } catch (err) {
    res.status(500).json({ error: "Server Error" });
  }
});

app.post("/shorten", async (req, res) => {
  shortid.characters(
    "1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$@"
  );
  const { full } = req.body;
  if (!full)
    return res.status(400).json({ error: "Please enter a URL to shorten" });
  try {
    const urlExists = await ShortUrls.findOne({ full });
    const urlID = shortid.generate();
    const newShortUrl = await ShortUrls.create({
      full,
      short: urlID,
    });
    res.redirect("/");
  } catch (err) {
    res.status(500).json({ error: "Server Error" });
  }
});

app.get("/:short", async (req, res) => {
  const urlID = req.params.short;
  const shortUrl = await ShortUrls.findOne({ short: urlID });
  if (shortUrl == null) return res.sendStatus(404);
  shortUrl.clicks++;
  shortUrl.save();
  res.redirect(shortUrl.full);
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log(
        "Connected to DataBase & Server is running on port",
        process.env.PORT
      );
    });
  })
  .catch((err) => {
    console.log(err);
  });
