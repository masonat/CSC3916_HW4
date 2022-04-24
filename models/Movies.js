const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//Movie schema
const MovieSchema = new Schema({
    title: {type: String, required: true},
    year: {type: String, required: true},
    genre: {type: String, required: true},
    actors: {type: [{actorName: String, characterName: String}], required: true}
});


//return the model to server
module.exports = mongoose.model('Movie', MovieSchema);