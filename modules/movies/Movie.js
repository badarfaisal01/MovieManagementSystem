const mongoose = require('mongoose');

const MovieSchema = new mongoose.Schema({
    title: String,
    genre: [String],
    filePath:String,
    director: { type: mongoose.Schema.Types.ObjectId, ref: 'Person' }, 
    cast: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Person' }],   
    releaseDate: Date,
    runtime: Number,
    popularity:Number,
    views:{type:Number,default:0},
    overview: String,
    averageRating: Number,
    movieCoverPhoto: { type: Buffer },
    ageRating: String,
    parentalGuidance: String,
    countryOfOrigin:String,
    Language: String,
    keywords:[String],
    isApproved:Boolean,
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminSeller' }
});

const Movie = mongoose.model('Movie', MovieSchema);
module.exports = Movie;
