const mongoose = require('mongoose')

const data = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "usermodel",
    },
    date: {
        type: Date,
        required: true
    },
    caloriecount: {
        type: Number,
        require: true
    },
    proteincount: {
        type: Number,
        require: true
    }
})

module.exports = mongoose.model('record', data)