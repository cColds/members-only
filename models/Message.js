const { Schema, model } = require("mongoose");

const messageSchema = new Schema({
  title: { type: String, required: true },
  date: { type: Date, default: Date.now },
  message: { type: Schema.Types.ObjectId, ref: "user", required: true },
});

const User = model("user", messageSchema);

module.exports = User;
