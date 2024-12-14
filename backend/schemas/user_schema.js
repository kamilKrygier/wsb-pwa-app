const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    login_hash: {
        type:String,
        required: false,
        unique: false,

    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
    }
})

const User = mongoose.model('User', userSchema)

module.exports = User