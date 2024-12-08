const Movie = require("../movies/Movie");
const Person = require("../persons/Person");
const Review = require("../reviews/Reviews");
const { getMoviesBasedOnUserActivities } = require("../adminSellerUser/UserController");
const { User } = require("../adminSellerUser/AdminSellerUser");

const getMoviesBasedOnGenreUserRatingAndUserActivity = async (req, res) => {
    try {
        const userId = req.params.userId;

        const user = await User.findById(userId).populate('userActivity');
        if (!user || !user.userPreferences) {
            // return res.status(404).json({ message: 'User or preferences not found' });
        }

        const moviesBasedOnUserRatings = await Review.find({ user: userId })
            .populate('movie');

        const favGenreMovies = await Movie.find({
            genre: { $in: user.userPreferences.favoriteGenre }
        });

        const movieIds = new Set([
            ...moviesBasedOnUserRatings.map(review => review.movie._id),
        ]);

        // Add favorite genre movie IDs to the Set
        favGenreMovies.forEach(mov => {
            movieIds.add(mov._id); 
        });

        // Convert Set of unique IDs back to an array
        const uniqueMovieIds = Array.from(movieIds);

        const uniqueMovies = await Movie.find({ _id: { $in: uniqueMovieIds } });

        console.log(uniqueMovies); 

        res.status(200).send(uniqueMovies);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getSimilarTitlesMovies = async (req, res) => {
    try {
        const movieId = req.params.movieId;

        const movie = await Movie.findById(movieId);
        if (!movie) {
            return res.status(404).json({ message: 'Movie not found' });
        }

        const moviesWithSimilarGenre = await Movie.find({ genre: { $in: movie.genre } });


        const movieIds = new Set([
            ...moviesWithSimilarGenre.map(mov => mov._id),
            // ...moviesBasedOnUserActivity.map(mov => mov._id)
        ]);

        const uniqueMovieIds = Array.from(movieIds);

        const uniqueMovies = await Movie.find({ _id: { $in: uniqueMovieIds } });

        const returnedMovies = uniqueMovies.filter(mov => mov._id.toString() !== movieId);

        res.status(200).json(returnedMovies);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getTrendingMovies = async (req, res) => {
    const userId = req.params.userId;
    const moviesBasedOnUserRatings = await Review.find({ user: userId })
        .sort({ rating: -1 })
        .populate('movie')
        .select('movie')
        .limit(10);

    // const moviesbasedOnUserActivity = await User.find({ user: userId })
    //     .sort({ rating: -1 })
    //     .populate('userActivity')
    //     .select('userActivity')
    //     .limit(10);

    const movies = new Set([
        ...moviesBasedOnUserRatings
        // ...moviesBasedOnUserActivity
    ]);
    
    const uniqueMoviesArray = Array.from(movies);
    
    res.status(200).json(uniqueMoviesArray);
};

const getTopRatedMovies = async (req, res) => {
    const userId = req.body.userId;
    const moviesBasedOnUserRatings = await Review.find({ user: userId })
        .populate('movie')
        .select('movie')
        .sort({ popularity: -1 })
        .limit(10);

    // const moviesbasedOnUserActivity = await User.find({ user: userId })
    //     .populate('userActivity')
    //     .select('userActivity')
    //     .sort({ popularity: -1 })
    //     .limit(10);

    const movies = new Set([
        ...moviesBasedOnUserRatings
        // , ...moviesbasedOnUserActivity
    ]);

    const uniqueMoviesArray = Array.from(movies);
        
    res.status(200).json(uniqueMoviesArray);
};

module.exports = {
    getMoviesBasedOnGenreUserRatingAndUserActivity,
    getSimilarTitlesMovies,
    getTrendingMovies,
    getTopRatedMovies
};
