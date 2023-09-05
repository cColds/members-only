const express = require("express");
const bcrypt = require("bcryptjs");
const passport = require("passport");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const router = express.Router();

/* GET home page. */
router.get("/", (req, res) => {
  res.render("index", { title: "Members Only" });
});

router.get("/sign-up", (req, res) => {
  res.render("sign-up", { title: "Members Only", errors: {}, body: {} });
});

router.post(
  "/sign-up",
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ max: 50 })
    .withMessage("Name must be 50 characters or less")
    .escape(),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isLength({ max: 75 })
    .withMessage("Email must be 75 characters or less")
    .matches(/^\S+@\S+\.\S+$/)
    .withMessage("Email must be in the format of example@gmail.com")
    .custom(async (email) => {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) throw new Error("Email already in use");

      return true;
    })
    .escape(),
  body("password")
    .trim()
    .notEmpty()
    .withMessage("Password is required")
    .isStrongPassword({
      minLength: 8,
      minNumbers: 1,
      minSymbols: 1,
      minLowercase: 1,
      minUppercase: 1,
    })
    .withMessage(
      "Password must include at least 8 characters, a number, a symbol, a lowercase and uppercase character"
    ),
  body("confirm-password")
    .custom((value, { req }) => value === req.body.password)
    .withMessage("Passwords do not match"),

  (req, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      const { errors } = result;
      let errorsObj = {};
      for (let i = 0; i < errors.length; i++) {
        errorsObj[errors[i].path] = errors[i];
      }

      res.render("sign-up", {
        title: "Members Only",
        errors: errorsObj,
        body: req.body,
      });
      return;
    }

    bcrypt.hash(req.body.password, 10, async function (err, hashedPassword) {
      try {
        const user = new User({
          name: req.body.name,
          email: req.body.email,
          password: hashedPassword,
          member: false,
        });
        await user.save();

        req.login(user, (err) => {
          if (err) return next(err);

          return res.redirect("/");
        });
      } catch (e) {
        console.error("Error: ", e);
        return next(e);
      }
    });
  }
);

router.get("/login", (req, res) => {
  res.render("login", { title: "Members Only", errors: {}, body: {} });
});

router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
  })
);

router.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);

    res.redirect("/");
  });
});

module.exports = router;
