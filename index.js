const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const session = require("express-session");

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

require("./utils/connectdb");

require("./strategies/JwtStrategy");
require("./strategies/LocalStrategy");
require("./authenticate");

const userRouter = require("./routes/userRoutes");

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET));

const domainsFromEnv = process.env.CORS_DOMAINS || ""


const whitelist = domainsFromEnv.split(",").map(item => item.trim())

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  preflightContinue: false,
};



app.use(
  session({
    secret: "cookie_secret",
    resave: true,
    saveUninitialized: true,
  })
);

passport.serializeUser(function (user, done) {
  console.log(user, "sup");
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  done(null, id);
});

app.use(cors(corsOptions));

app.use(passport.initialize());

app.use(passport.session());

app.use("/users", userRouter);

app.get("/", function (req, res) {
  res.send({ status: "success" });
});

const server = app.listen(process.env.PORT || 8081, function () {
  const port = server.address().port;

  console.log("App started at port:", port);
});
