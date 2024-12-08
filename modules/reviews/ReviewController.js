const Movie = require('../movies/Movie');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const Review = require('./Reviews');
const mongoose = require('mongoose');


const createReview = async (req, res) => {
    try {
        const { user,movie, rating, content } = req.body;

        if(rating > 5 && rating < 1)
            return res.status(400).json({ message: 'Wrong Rating, please enter between 1-5' });

        const foundMovie = await Movie.findById(movie);
        if (!foundMovie) return res.status(404).json({ message: 'Movie not found' });

        const review = new Review({user: user, movie:movie, rating: rating, content:content});
        await review.save();

        const reviews = await Review.find({movie:movie});
        let sum = 0;
        reviews.forEach((review) => {
            sum += review.rating;
        })

        let avgRating = sum / reviews.length;
        foundMovie.averageRating = avgRating;

        await foundMovie.save();

        res.status(201).json(review);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update a review
const updateReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { user, movie, rating, content } = req.body;

        // Update the review
        const review = await Review.findOneAndUpdate(
            { _id: reviewId, user: user }, // Ensure the user matches the review owner
            { rating, content },
            { new: true }
        );

        // Check if the review was found and updated
        if (!review) {
            return res.status(404).json({ message: 'Review not found or unauthorized' });
        }

        // Find the movie
        const foundMovie = await Movie.findById(movie);
        if (!foundMovie) {
            return res.status(404).json({ message: 'Movie not found' });
        }

        // Calculate the new average rating
        const reviews = await Review.find({ movie: movie });
        let sum = 0;

        reviews.forEach((review) => {
            sum += review.rating;
        });

        let avgRating = reviews.length > 0 ? sum / reviews.length : 0; 
        foundMovie.averageRating = avgRating;

        // Save the updated movie
        await foundMovie.save();

        // Respond with the updated review
        res.status(200).json(review);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getAllReviewsForMovie = async (req, res) => {
    try {
        const { movie } = req.params;

        // Get pagination parameters from query, with defaults
        const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
        const limit = parseInt(req.query.limit) || 10; // Default to limit 10 if not provided
        const skip = (page - 1) * limit; // Skip the appropriate number of records

        // Find reviews for the given movie and apply pagination
        const reviews = await Review.find({ movie: movie })
            .populate('movie') // Populate the movie details if needed
            .skip(skip) // Skip records based on pagination
            .limit(limit); // Limit the number of reviews per page

        // Get total count of reviews for pagination info
        const totalReviews = await Review.countDocuments({ movie: movie });

        if (reviews.length === 0) {
            return res.status(404).json({ message: 'No reviews found for this movie' });
        }

        // Send response with reviews and pagination info
        res.status(200).json({
            reviews,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalReviews / limit),
                totalItems: totalReviews,
                itemsPerPage: limit,
                hasNextPage: page * limit < totalReviews,
                hasPrevPage: page > 1
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


const getTopRatedReviewsForMovie = async (req, res) => {
    try {
        const { movie } = req.params;

        const reviews = await Review.find({ movie: movie })
            .populate('movie')
            .sort({ rating: -1 }) 
            .limit(5); 
        
        res.status(200).json(reviews);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getMostDiscussedReviewsForMovie = async (req, res) => {
    try {
        const movies = await Movie.find();
        let mostDiscussedMovie = null;
        let maxNum = -1;
        // console.log(movies)
        for (const movie of movies) {
            const reviews = await Review.find({ movie: movie._id });
            // console.log(reviews.length)
            if (reviews.length > maxNum) {
                mostDiscussedMovie = movie;
                // console.log(movie)
                maxNum = reviews.length;
            }
        }

        if (!mostDiscussedMovie) {
            return res.status(404).json({ message: 'No reviews found for any movie.' });
        }

        const reviews = await Review.find({ movie: mostDiscussedMovie._id })
            .populate( 'movie'); 

        res.status(200).json({
            movie: mostDiscussedMovie,
            reviews: reviews,
            reviewCount: maxNum
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getReviewPieGraph = async (req, res) => {
    try {
        const movieId = req.params.movieId;

        console.log(movieId)

        const reviews = await Review.aggregate([
            { $match: { movie: new mongoose.Types.ObjectId(movieId) } },
            { $group: { _id: "$rating", count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        console.log(reviews);

        const chartData = {
            labels: reviews.map((r) => `Rating ${r._id}`),
            datasets: [
                {
                    label: 'Review Counts',
                    data: reviews.map((r) => r.count),
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
                }
            ]
        };

        const width = 800;
        const height = 600;
        const chartCallback = (ChartJS) => {  };
        const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, chartCallback });
        const imageBuffer = await chartJSNodeCanvas.renderToBuffer({
            type: 'pie',
            data: chartData
        });

        res.set('Content-Type', 'image/png');
        res.send(imageBuffer);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


const getReviewBarGraph = async (req, res) => {
    try {
        const movieId = req.params.movieId;

        console.log(movieId)

        const reviews = await Review.aggregate([
            { $match: { movie: new mongoose.Types.ObjectId(movieId) } },
            { $group: { _id: "$rating", count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        console.log(reviews);

        const chartData = {
            labels: reviews.map((r) => `Rating ${r._id}`),
            datasets: [
                {
                    label: 'Review Counts',
                    data: reviews.map((r) => r.count),
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
                }
            ]
        };

        const width = 800;
        const height = 600;
        const chartCallback = (ChartJS) => {  };
        const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, chartCallback });
        const imageBuffer = await chartJSNodeCanvas.renderToBuffer({
            type: 'bar',
            data: chartData
        });

        res.set('Content-Type', 'image/png');
        res.send(imageBuffer);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteReviewByAdmin = async (req, res) => {
    const { reviewId } = req.params;

    try {
        const review = await Review.findById(reviewId);

        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        await Review.findByIdAndDelete(reviewId);

        res.status(200).json({ message: 'Review deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getReviewPieGraph,
    getReviewBarGraph,
    createReview,
    updateReview,
    getAllReviewsForMovie,
    getTopRatedReviewsForMovie,
    getMostDiscussedReviewsForMovie,
    deleteReviewByAdmin
};
