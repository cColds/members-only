const { Schema, model } = require("mongoose");

const userSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    member: { type: Boolean, required: true },
    admin: Boolean,
});

const User = model("user", userSchema);

module.exports = User;
