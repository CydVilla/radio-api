const express = require("express");
const router = express.Router();
const User = require("../models/user");
const Song = require("../models/song")
const passport = require("passport");
const jwt = require("jsonwebtoken");
const ObjectId = require('mongodb').ObjectId;

var AWS = require("aws-sdk");
var fs = require('fs');
var path = require('path');

const {
  getToken,
  COOKIE_OPTIONS,
  getRefreshToken,
  verifyUser,
} = require("../authenticate");


AWS.config.getCredentials(function(err) {
  if (err) console.log(err.stack);
  else {
    console.log("Access key:", AWS.config.credentials.accessKeyId);
  }
});

router.post("/signup", (req, res, next) => {
  if (!req.body.firstName) {
    res.statusCode = 500;
    res.send({
      name: "FirstNameError",
      message: "The first name is required",
    });
  } else {
    User.register(
      new User({ username: req.body.username }),
      req.body.password,
      (err, user) => {
        if (err) {
          res.statusCode = 500;
          res.send(err);
        } else {
          user.firstName = req.body.firstName;
          user.lastName = req.body.lastName || "";
          const token = getToken({ _id: user._id });
          const refreshToken = getRefreshToken({ _id: user._id });
          user.refreshToken.push({ refreshToken });
          user.save((err, user) => {
            if (err) {
              res.statusCode = 500;
              res.send(err);
            } else {
              res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);
              res.send({ success: true, token });
            }
          });
        }
      }
    );
  }
});

router.post("/login", passport.authenticate("local"), (req, res, next) => {
  const token = getToken({ _id: req.user._id });
  const refreshToken = getRefreshToken({ _id: req.user._id });
  User.findById(req.user._id).then(
    (user) => {
      user.refreshToken.push({ refreshToken });
      user.save((err, user) => {
        if (err) {
          res.statusCode = 500;
          res.send(err);
        } else {
          res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);
          res.send({ success: true, token });
        }
      });
    },
    (err) => next(err)
  );
});

router.post("/refreshToken", (req, res, next) => {
  const { signedCookies = {} } = req;
  const { refreshToken } = signedCookies;

  if (refreshToken) {
    try {
      const payload = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET
      );
      const userId = payload._id;
      User.findOne({ _id: userId }).then(
        (user) => {
          if (user) {
            const tokenIndex = user.refreshToken.findIndex(
              (item) => item.refreshToken === refreshToken
            );

            if (tokenIndex === -1) {
              res.statusCode = 401;
              res.send("Unauthorized");
            } else {
              const token = getToken({ _id: userId });
              const newRefreshToken = getRefreshToken({ _id: userId });
              user.refreshToken[tokenIndex] = { refreshToken: newRefreshToken };
              user.save((err, user) => {
                if (err) {
                  res.statusCode = 500;
                  res.send(err);
                } else {
                  res.cookie("refreshToken", newRefreshToken, COOKIE_OPTIONS);
                  res.send({ success: true, token });
                }
              });
            }
          } else {
            res.statusCode = 401;
            res.send("Unauthorized");
          }
        },
        (err) => next(err)
      );
    } catch (err) {
      res.statusCode = 401;
      res.send("Unauthorized");
    }
  } else {
    res.statusCode = 401;
    res.send("Unauthorized");
  }
});

router.get("/me", verifyUser, (req, res, next) => {
  res.send(req.user);
});

router.get("/logout", verifyUser, (req, res, next) => {
  const { signedCookies = {} } = req;
  const { refreshToken } = signedCookies;
  User.findById(req.user._id).then(
    (user) => {
      const tokenIndex = user.refreshToken.findIndex(
        (item) => item.refreshToken === refreshToken
      );

      if (tokenIndex !== -1) {
        user.refreshToken.id(user.refreshToken[tokenIndex]._id).remove();
      }

      user.save((err, user) => {
        if (err) {
          res.statusCode = 500;
          res.send(err);
        } else {
          res.clearCookie("refreshToken", COOKIE_OPTIONS);
          res.send({ success: true });
        }
      });
    },
    (err) => next(err)
  );
});

router.get("/myUploads", verifyUser, (req, res) => {
  const song = new Song()
  const songs = Song.find({
    uploadedBy: req.user._id
  },(err, result) => {
    console.log(result) 
    res.send(result)
  })
})

router.get("/allUploads", verifyUser, (req, res) => {
  const song = new Song()
  const songs = Song.find({
  },(err, result) => {
    console.log(result) 
    res.send(result)
  })
})

router.get("/getSongs", (req, res) => {
  const songs = Song.find({
  },(err, result) => {
    console.log(result, 'yerrr') 
    res.send(result)
  })
})

router.put("/myUpdate", verifyUser, async (req, res) => {
  console.log(req.body.id, 'pp')
const field = req.body.field
  Song.findOneAndUpdate({'_id' : ObjectId(req.body.id)}, {
    $set: {
      [field] : req.body.value
    }
  }, {
    sort: {_id: -1},
    upsert: false
  }, (err, result) => {
    if (err) return res.send(err)
    res.send(result)
  })})

  router.delete("/trash", verifyUser, async (req, res) => {
    console.log(req.body, 'trash')
    const ids = req.body.ids.map(id => ObjectId(id))
    let myquery = { _id: { $in: ids } };
   Song.deleteMany(myquery, function(err, obj) {
      if (err) throw err;
      console.log(obj, 'ow')
      res.send({
        success : 'ok'
      })
    });
  })

router.post("/upload", verifyUser, async (req, res) => {
// Set the region 
AWS.config.update({region: 'us-east-1'});
console.log(req.user._id, 'seth')
// // Create S3 service object
var s3 = new AWS.S3({apiVersion: '2006-03-01'});

// // call S3 to retrieve upload file to specified bucket
var uploadParams = {Bucket: 'jetsetradio', Key: '', Body: ''};
var audioFileName = req.body.audio.fileName

var uploadParamsArt = {Bucket: 'jetsetradio', Key: '', Body: ''};
var artFileName = req.body.art.fileName

// // Configure the file stream and obtain the upload parameters
// var fileStream = fs.createReadStream(file);
// fileStream.on('error', function(err) {
//   console.log('File Error', err);
// });

uploadParams.Body = new Buffer.from(req.body.audio.file.replace(/^data:audio\/mpeg\/\w+;base64,/, ""), 'base64')
uploadParams.Key = path.basename(audioFileName);

uploadParamsArt.Body = new Buffer.from(req.body.art.file.replace(/^data:image\/\w+;base64,/, ""), 'base64')

uploadParamsArt.Key = path.basename(artFileName);

// // call S3 to retrieve upload file to specified bucket
let audioPath;
 s3.upload (uploadParams, function (err, data) {
  if (err) {
    console.log("Error", err);
  } if (data) {
    console.log("Upload Success", data.Location);
    audioPath = data.Location

let artPath;
 s3.upload (uploadParamsArt, function (err, data) {
  if (err) {
    console.log("Error", err);
  } if (data) {
    console.log("Upload Success", data.Location);
    artPath = data.Location
    const song = new Song(
      {
        uploadedBy: req.user._id,
        title: req.body.audio.fileName,
        artist: req.body.artist,
        year: req.body.year,
        albumArt: artPath,
        src: audioPath
      }
    )
    song.save(
      
    )
  }
})
  }
})

 
})




module.exports = router;