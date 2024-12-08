const mongoose = require('mongoose');

const AdminSellerSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    refreshToken: String,
    role: String
    
});


const UserPreferencesSchema = new mongoose.Schema({
    favoriteGenre: [String],
    favoriteActorsOrDirectors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Person' }]
});

const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    refreshToken: String,
    moviesWishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }],
    userPreferences: UserPreferencesSchema,
    userActivity: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }], 
})

const AdminSeller = mongoose.model('Admin', AdminSellerSchema);
const User = mongoose.model('User', UserSchema);


module.exports = {
    User,
    AdminSeller
};
