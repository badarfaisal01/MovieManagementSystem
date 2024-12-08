const mongoose = require('mongoose');

const watchHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    movies: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Movie'
    }]
}, { timestamps: true });

const WatchHistory = mongoose.model('WatchHistory', watchHistorySchema);

module.exports = WatchHistory;
