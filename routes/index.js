const express = require("express");
const bcrypt = require("bcryptjs");
const passport = require("passport");
const { body, validationResult } = require("express-validator");
const mongoose = require("mongoose");
const User = require("../models/User");
const Message = require("../models/Message");
const router = express.Router();

/* GET home page. */
router.get("/", async (req, res) => {
    const messages = await Message.find().populate("author").sort({ date: -1 });

    console.log(messages);

    res.render("index", { title: "Members Only", messages });
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

        bcrypt.hash(
            req.body.password,
            10,
            async function (err, hashedPassword) {
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
            }
        );
    }
);

router.get("/login", (req, res) => {
    res.render("login", { title: "Members Only", errors: {} });
});

router.post("/login", (req, res, next) => {
    passport.authenticate("local", (err, user, options) => {
        if (err) return next(err);
        if (!user) {
            res.render("login", {
                title: "Members Only",
                errors: options.errors,
            });
            return;
        }

        req.login(user, (err) => {
            if (err) return next(err);

            return res.redirect("/");
        });
    })(req, res, next);
});

router.get("/logout", (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);

        res.redirect("/");
    });
});

router.get("/join", (req, res, next) => {
    res.render("join-club", { title: "Join Club", errors: {} });
});

router.post("/join", async (req, res, next) => {
    const isSecretCode = process.env.SECRET_CODE === req.body.secret;

    if (!isSecretCode) {
        res.render("join-club", {
            title: "Join Club",
            errors: { secret: "Secret code is incorrect" },
        });
        return;
    }

    const { id } = req.user;
    await User.findByIdAndUpdate(id, { member: true });

    res.redirect("/");
});

router.get("/new", (req, res, next) => {
    res.render("new-message", { title: "New Message", errors: {}, body: {} });
});

router.post(
    "/new",
    body("title").trim().notEmpty().withMessage("Title cannot be empty"),
    body("message").trim().notEmpty().withMessage("Message cannot be empty"),

    async (req, res, next) => {
        const result = validationResult(req);

        if (!result.isEmpty()) {
            const { errors } = result;
            let errorsObj = {};
            for (let i = 0; i < errors.length; i++) {
                errorsObj[errors[i].path] = errors[i];
            }

            res.render("new-message", {
                title: "New Message",
                errors: errorsObj,
                body: req.body,
            });
            return;
        }

        try {
            const { user } = req;
            const { title, message } = req.body;

            const newMessage = new Message({
                title,
                message,
                author: { _id: new mongoose.Types.ObjectId(user.id) },
            });

            await newMessage.save();

            res.redirect("/");
        } catch (e) {
            console.error("Error: ", e);
            next(e);
        }
    }
);

module.exports = router;
