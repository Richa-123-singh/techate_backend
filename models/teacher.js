const   mongoose = require('mongoose');

let Schema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    registration: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    section: {
        type: String,
        default: 'Not Alloted'
    },
    mobile: {
        type: String,
    },
    email: {
        type: String,
    }
});

module.exports = mongoose.model('teacher', Schema);