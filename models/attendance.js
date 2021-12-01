const   mongoose = require('mongoose')

let Schema = new mongoose.Schema({
    username: {
        type: String
    },
    date: {
        type: String
    },
    students: [{
        type: String
    }]
});

module.exports  = new mongoose.model('attendance', Schema);