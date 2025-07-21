require("dotenv").config();
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;
const path = require("path");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const Drama = require("./models/drama.js");

// Cors
const corsOptions = {
  origin: process.env.ALLOWED_CLIENTS.split(","),
};

app.use(cors(corsOptions));
app.use(express.static("public"));

app.use(express.urlencoded({ extended: false }));

const connectDB = require("./config/db");
connectDB();

app.use(express.json());
app.use(cookieParser());

app.set("views", path.join(__dirname, "/views"));
app.set("view engine", "ejs");

async function waitFor20Sec() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve("done");
    }, 1500);
  });
}

app.use(express.json());

app.get("/search", async (req, res) => {
  if (req.query.id) {
    try {
      if (Number(req.query.id)) {
        return res.status(400).json({ msg: "id not found" });
      }

      const drama = await Drama.findById(req.query.id);
      if (drama) {
        return res
          .status(200)
          .json({ msg: "result founded.", htmlTable: drama.linksTable });
      } else {
        return res.status(400).json({ msg: "result not found." });
      }
    } catch (error) {
      return res.status(400).json({ msg: "id not found" });
    }
  } else {
    return res.status(400).json({ msg: "id not found" });
  }
});

app.get("/add", async (req, res) => {
  if (req.query.key) {
    if(req.query.key != "drama"){
      return res.end("Cannot GET /add")
    }
    return res.send(`<form action="/add" method="post">
    <input type="text" name="title" placeholder="title">
  <input type="text" name="linksTable" placeholder="linksTable">
  <button type="submit">Submit</button>
</form>`);
  } else {
    return res.status(400).json({ msg: "id not found" });
  }
});
app.post("/add", async (req, res) => {
    const { title, linksTable } = req.body;

    if(!linksTable){
      return res.status(400).json({msg:"table not available"})
    }

    const drama = new Drama({
      title,
      linksTable,
    });
    const response = await drama.save();

    return res.status(200).json({ response: response });
  
});

app.listen(PORT, console.log(`Listening on port ${PORT}.`));
