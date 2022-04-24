const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema({
    movie: {type: String, required: true},
    reviewerName: {type: String},
    quote: {type: String, required: true},
    rating: {type: Number, min: 1, max: 5, required: true},
});

module.exports = mongoose.model("Review", ReviewSchema);
