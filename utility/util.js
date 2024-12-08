const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const { AdminSeller, User } = require('../modules/adminSellerUser/AdminSellerUser');

const SECRET_KEY = "feb8e351373cdad70c1ec8f514b49acb66592dfd6f0127f9f2cbd0219445d3d3553a035a50ff183ab56433d54adf7150c4f155ab0c1de9ecc84441cf405dc27e7f8b8db104131410510016ad68871eeb486221537ccdb4929f626284bb0dd3fb72d9c332f477dff55283a24a2705ca98dd352003b25d7aaa561e13331031c5a2e99c770b4fffedf8ec3223b5e704c5d7fd1c7bf2ccfc2a6664081d55cff37018b30f3a7ecafe06e3cd7d4af2887ad6a68cf54c429dc049e0429141a67f31a83f794862e8fe800ad26d82757360e0114843492e93c62341a8106312b209dd7d209878ad9fd924e4f8e02eb020f8ade18c6402a68b6569432807f1a1e84bf1a917";

const app = express();
app.use(express.json());

// Function to login user
const loginUserSellerAdmin = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });

        if(user)
        {
            console.log(user)
            if (user && await bcrypt.compare(password, user.password)) {
                const token = jwt.sign({ id: user._id, role: user.role }, SECRET_KEY, { expiresIn: '1h' });
                return res.status(200).json({
                    token,
                    id: user._id,
                    role: "user"
                });
            } else {
                return res.status(401).json({ message: 'Invalid credentials' });
            }
        }
        else
        {
            const adminSeller = await AdminSeller.findOne({ email });
            if (adminSeller && await bcrypt.compare(password, adminSeller.password)) {
                const token = jwt.sign({ id: adminSeller._id, role: adminSeller.role }, SECRET_KEY, { expiresIn: '1h' });
                return res.status(200).json({
                    token,
                    id: adminSeller._id,
                    role: adminSeller.role,
                });
            } else {
                return res.status(401).json({ message: 'Invalid credentials' });
            }
        }
       
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(403).json({ message: 'Access denied, token missing' });
    }
    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid token' });
        }
        req.user = user; // Attach user details to the request
        next();
    });
};

// Middleware to authorize based on role
// const authorizeRoles = (...roles) => {
//     return (req, res, next) => {
//         if (!roles.includes(req.user.role)) {
//             return res.status(403).json({ message: 'Access denied' });
//         }
//         next();
//     };
// };

// Routes

const GOOGLE_CLIENT_ID = 'your-google-client-id.apps.googleusercontent.com';

// JWT secret for signing tokens
const JWT_SECRET = 'your_jwt_secret';

const client = new OAuth2Client(GOOGLE_CLIENT_ID);

// Middleware to verify Google token and issue a JWT
const googleAuth = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ message: 'Token is required' });
        }

        // Verify the Google token
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { sub, email, name, picture } = payload;

        // Optionally, store or update user in your database here
        // Example: Create or update user in the database
        // const user = await User.findOneAndUpdate(
        //     { googleId: sub },
        //     { email, name, picture },
        //     { upsert: true, new: true }
        // );

        // Create a JWT for the authenticated user
        const jwtToken = jwt.sign(
            {
                id: sub,
                email,
                name,
                picture,
            },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(200).json({ jwtToken });
    } catch (error) {
        console.error('Error in Google Authentication:', error.message);
        res.status(401).json({ message: 'Invalid token', error: error.message });
    }
};


const uploadMovieCoverPhoto = async (req, res) => {
    try {
        console.log(req.file)
        if (!req.file) {
            return res.status(400).json({ message: 'Photo is required.' });
        }

        const movieId = req.params.id;
        const movie = await Movie.findById(movieId);

        if (!movie) {
            return res.status(404).json({ message: 'Movie not found.' });
        }

        // Store the file buffer in the `movieCoverPhoto` field
        console.log("The buffer: ", req.file.buffer)
        movie.movieCoverPhoto = req.file.buffer;

        // Save the updated movie document
        const updatedMovie = await movie.save();
        console.log(updatedMovie.movieCoverPhoto)
        res.status(200).json({
            data: updatedMovie
        });
    } catch (error) {
        console.error('Error uploading cover photo:', error.message);
        res.status(500).json({ message: 'Internal server error.' });
    }
};


module.exports = {
    loginUserSellerAdmin,
    authenticateToken,
    googleAuth
    // authorizeRoles
}