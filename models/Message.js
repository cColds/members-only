const format = require("date-fns/format");
const { Schema, model } = require("mongoose");

const messageSchema = new Schema({
    title: { type: String, required: true },
    date: { type: Date, default: Date.now },
    message: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, ref: "user", required: true },
});

messageSchema.virtual("formatDate").get(function () {
    const formatDate = format(new Date(this.date), "EEEE, MMMM d, y, h:mm a");

    return formatDate;
});

const Message = model("message", messageSchema);

module.exports = Message;
