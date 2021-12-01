const   mongoose = require('mongoose')

let Schema = new mongoose.Schema({
    students: [{
        type: String
    }]
});

module.exports  = new mongoose.model('store', Schema);