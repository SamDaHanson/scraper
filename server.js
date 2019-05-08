var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");
var axios = require("axios");
var cheerio = require("cheerio");

var db = require("./models");

var PORT = process.env.PORT || 8081; // 3000;

var app = express();

// Configure middleware

app.use(logger("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

//var uri = "mogolab-graceful-88747"; //process.env.MONGODB_URI
//var uri = "mongodb://heroku_ssr6jx1n:ttdsevnlejcpg5noi5ug6g8hsv@ds121105.mlab.com:21105/heroku_ssr6jx1n";
//var uri = "mongodb://heroku_ssr6jx1n:heroku_ssr6jx1n@ds121105.mlab.com:21105/heroku_ssr6jx1n";
//var MONGODB_URI = uri || "mongodb://localhost/mongoHeadline";
var MONGODB_URI = process.env.MonGODB_URI || "mongodb://localhost/mongoHeadline";

mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI);
// Routes

// A GET route for scraping the echoJS website
app.get("/scrape", function(req, res) {
  axios.get("https://www.nytimes.com").then(function(response) {

    var $ = cheerio.load(response.data);
    // db.Article.dropDatabase();
    db.Article.deleteMany({});
    db.Article.remove({});

    $("article").each(function(i, element) {

      var title = $(element).children().text();
      // console.log($(element));
      var children = $(element).children();
      console.log($(element).children());

      // console.log(children.text());
      for (var i = 0; i < children.length; i++) {
        console.log(i+": "+children[i]);
        var childs = children[i];
        console.log(childs);
      }
      var link = $(element).find("a").attr("href");

      var result = {};
      result.title = title;
      result.link = link;

      db.Article.create(result)
        .then(function(dbArticle) {
          //console.log(dbArticle);
        })
        .catch(function(err) {
          //console.log(err);
        });
    });
    res.send("Scrape Complete");
  });
});

// Route for getting all Articles from the db
app.get("/articles", function(req, res) {
  db.Article.find({})
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function(req, res) {
  db.Article.findOne({ _id: req.params.id })
    .populate("note")
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function(req, res) {
  db.Note.create(req.body)
    .then(function(dbNote) {
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
    })
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});
