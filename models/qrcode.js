const   mongoose = require('mongoose')

let Schema = new mongoose.Schema({
    username: {
        type: String
    },
    code: {
        type: String,
        unique: true,
        required: true
    },
    students: [{
        type: String
    }]
});

module.exports  = new mongoose.model('qrcode', Schema);