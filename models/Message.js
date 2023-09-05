const { Schema, model } = require("mongoose");

const messageSchema = new Schema({
  title: { type: String, required: true },
  date: { type: Date, default: Date.now },
  message: { type: String, required: true },
  author: { type: Schema.Types.ObjectId, ref: "user", required: true },
});

const Message = model("message", messageSchema);

module.exports = Message;
