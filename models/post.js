const mongoose = require("mongoose");

const postSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
    },
    content: String,
    date: {
        type: Date,
        default: Date.now,
        get: (date) => date.toLocaleDateString()

    },
    likes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user"
        }
    ]
})

module.exports = mongoose.model("post", postSchema)