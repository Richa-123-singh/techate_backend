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
        default: '123456'
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

module.exports = mongoose.model('student', Schema);