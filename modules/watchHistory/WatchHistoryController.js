const Movie = require('../movies/Movie');
const WatchHistory = require('./WatchHistory'); // Update with the actual path to your model

// Get all watch history for a user
const getAllWatchHistory = async (req, res) => {
    try {
        const { userId } = req.params;

        // Pagination parameters from query
        const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
        const limit = parseInt(req.query.limit) || 10; // Default to limit 10 if not provided
        const skip = (page - 1) * limit; // Skip the appropriate number of records

        // Find the watch history for the given userId
        const watchHistory = await WatchHistory.findOne({ userId })
        
            .populate({
                path: 'movies', // Populate movies
                options: {
                    skip: skip,  // Skip records based on pagination
                    limit: limit  // Limit the number of records per page
                }
            });

        if (!watchHistory) {
            return res.status(404).json({ message: 'Watch history not found' });
        }

        // Get total count of movies for pagination info
        const totalMovies = await WatchHistory.countDocuments({ userId });

        // Send response with watch history and pagination info
        res.status(200).json({
            watchHistory,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalMovies / limit),
                totalItems: totalMovies,
                itemsPerPage: limit,
                hasNextPage: page * limit < totalMovies,
                hasPrevPage: page > 1
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Add a movie to watch history
const addToWatchHistory = async (req, res) => {
    try {
        const { userId } = req.body;
        const { movieId } = req.body;

        let watchHistory = await WatchHistory.findOne({ userId });
        const movie = await Movie.findById(movieId);
        movie.views += 1;
        console.log(movie.view);
        await movie.save();
        if (!watchHistory) {
            // Create a new watch history document if it doesn't exist
            watchHistory = new WatchHistory({ userId, movies: [movieId] });
        } else {
            // Check if movie already exists in the history
            // if (watchHistory.movies.includes(movieId)) {
            //     return res.status(400).json({ message: 'Movie already in watch history' });
            // }

            // Add the movie to the history
            watchHistory.movies.push(movieId);

            // Ensure the limit is 10
            if (watchHistory.movies.length > 10) {
                watchHistory.movies.shift(); // Remove the first movie
            }
        }

        await watchHistory.save();
        res.status(200).json(watchHistory);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete a movie from watch history
const deleteFromWatchHistory = async (req, res) => {
    try {
        const { userId, movieId } = req.params;

        const watchHistory = await WatchHistory.findOne({ userId });

        if (!watchHistory) {
            return res.status(404).json({ message: 'Watch history not found' });
        }

        // Remove the movie from the array
        let deleted = false;
        watchHistory.movies = watchHistory.movies.filter((movie) => 
            {
                if(movie._id == movieId && !deleted)
                {
                    deleted = true;
                    return ''
                }
                return movie;
                
            });

        await watchHistory.save();
        res.status(200).json(watchHistory);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getAllWatchHistory,
    addToWatchHistory,
    deleteFromWatchHistory
};
