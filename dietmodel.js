const mongoose = require('mongoose')

const diet = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "usermodel",
    },
    itemname: {
        type: String,
        required: true,
    },
    calorie: {
        type: Number,
        required: true,
    },
    protein: {
        type: Number,
        required: true
    }
})

module.exports = mongoose.model("diet", diet)