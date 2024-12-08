const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
    rating: { type: Number, min: 1, max: 5, required: true }, 
    content: { type: String }
});

const Review = mongoose.model('Review', ReviewSchema);
module.exports = Review;
