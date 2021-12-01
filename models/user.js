const   mongoose = require('mongoose'),
        passportLocalMongoose = require('passport-local-mongoose')

let Schema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    password: {
        type: String
    }
});

mongoose.plugin(passportLocalMongoose);
module.exports  = new mongoose.model('user', Schema);