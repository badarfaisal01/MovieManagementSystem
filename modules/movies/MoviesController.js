const Person = require("../persons/Person");
const Review = require("../reviews/Reviews");
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const Movie = require("./Movie");
const { AdminSeller, User } = require("../adminSellerUser/AdminSellerUser");
const sendMail = require("../notification/EmailNotifications");
const { title } = require("process");

const movieStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, `${Date.now()}${path.extname(file.originalname)}`)
});

const coverPhotoStorage = multer.memoryStorage();

const uploadMovieMiddleware = multer({ storage: movieStorage }).single('file'); 
const uploadCoverPhotoMiddleware = multer({ storage: coverPhotoStorage }).single('file'); 


const uploadMovie = async (req, res) => {
    try {
        console.log("1")
        if (!req.file) {
            return res.status(400).json({ message: 'File is required for upload.' });
        }
        
        const movieData = {
            isApproved:false,
            sellerId: req.body.loggedInId, 
            title: req.body.fileName, 
            filePath: req.file.path,
            averageRating:0
        };

        const newMovie = new Movie(movieData);
        await newMovie.save();

        const users = await User.find();

        console.log(users)
        users.map((user) => {
            sendMail(user.email, "New Movie Added -> "+ title, "A new movie has been added to the platform");
        })

        return res.status(201).json({
            message: 'File and metadata uploaded successfully.',
            data: newMovie,
        });
    } catch (error) {
        console.error('Error uploading file:', error.message);
        return res.status(500).json({ message: 'Internal server error.' });
    }
};

const uploadMovieCoverPhoto = async (req, res) => {
    try {
        // Check if a cover photo was uploaded
        console.log(req.file)
        if (!req.file) {
            return res.status(400).json({ message: 'Photo is required.' });
        }

        const movieId = req.params.id;
        const movie = await Movie.findById(movieId);

        // Check if the movie exists
        if (!movie) {
            return res.status(404).json({ message: 'Movie not found.' });
        }

        // Store the file buffer in the `movieCoverPhoto` field
        movie.movieCoverPhoto = req.file.buffer;

        // Save the updated movie document
        const updatedMovie = await movie.save();

        console.log("Updated Data: ", updatedMovie)
        res.status(200).json({
            data: updatedMovie
        });
    } catch (error) {
        console.error('Error uploading cover photo:', error.message);
        res.status(500).json({ message: 'Internal server error.' });
    }
};


const streamMovie = async (req, res) => {
    try {
        const movie = await Movie.findById(req.params.id);
        if (!movie) return res.status(404).send('Movie not found');

        const filePath = path.join(__dirname, '..', movie.filePath);
        if (!fs.existsSync(filePath)) {
            return res.status(404).send('File not found');
        }

        const stat = fs.statSync(filePath);
        const fileSize = stat.size;
        const range = req.headers.range;

        if (range) {
            const parts = range.replace(/bytes=/, '').split('-');
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

            const chunkSize = end - start + 1;
            const file = fs.createReadStream(filePath, { start, end });

            res.writeHead(206, {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunkSize,
                'Content-Type': 'video/mp4',
            });

            file.pipe(res);
        } else {
            res.writeHead(200, {
                'Content-Length': fileSize,
                'Content-Type': 'video/mp4',
            });

            fs.createReadStream(filePath).pipe(res);
        }
    } catch (error) {
        res.status(500).send({ message: 'Error streaming movie' });
    }
};


const getAllForSeller = async (req, res) => {
    let id = req.params.id;
    try {
        console.log(id);
        const movies = await Movie.find({sellerId: id} ).select('-movieCoverPhoto')
           
            .populate('director')
            .populate('cast')
            
        console.log(movies) 


        res.status(200).json({

            movies
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

const getTopTenMovies = async (req, res) => {
   
    try {
        const movies = await Movie.find({isApproved:true} ).select('-movieCoverPhoto')
        .sort({popularity:-1})
        .limit(10);
           
        console.log(movies) 


        res.status(200).json({

            movies
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getMovies = async (req, res) => {
   
    try {
        const movies = await Movie.find({isApproved:true} ).select('-movieCoverPhoto')
        .sort({popularity:-1})
        .limit(10);
           
        console.log(movies) 


        res.status(200).json({

            movies
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getMoviesForAdmin = async (req, res) => {
   console.log("HEHE")
    try {
        const movies = await Movie.find().select('-movieCoverPhoto')
            // .populate('sellerId')
           
        console.log(movies) 


        res.status(200).json({

            movies
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getMoviesByFilter = async (req, res) => {
    try {
        const {
            title,
            genre,
            director,
            cast,
            minRating,
            maxRating,
            minPopularity,
            maxPopularity,
            releaseYear,
            releaseDecade,
            countryOfOrigin,
            language,
            keywords
        } = req.body;

        const movieSet = new Set();

        // Helper function to add movies to the set
        const addMoviesToSet = (movies) => {
            movies.forEach(movie => movieSet.add(movie._id.toString()));
        };

        // Fetch movies by title
        if (title) {
            const movies = await Movie.find({ title: title,isApproved:true });
            addMoviesToSet(movies);
        }

        if (genre) {
            const movies = await Movie.find({isApproved:true, genre: { $in: genre } });
            addMoviesToSet(movies);
        }

        if (director) {
            const movies = await Movie.find({isApproved:true, director });
            addMoviesToSet(movies);
        }

        if (cast) {
            const movies = await Movie.find({ isApproved:true,cast: { $in: cast } });
            addMoviesToSet(movies);
        }

        // Filter by exact rating
        if (minRating) {
            const movies = await Movie.find({ isApproved:true,averageRating: { $gt: minRating } });
            addMoviesToSet(movies);
        }
        if (maxRating) {
            const movies = await Movie.find({ isApproved:true,averageRating: { $lt: maxRating } });
            addMoviesToSet(movies);
        }

        // Filter by exact popularity
        if (maxPopularity || minPopularity) {
            const movies = await Movie.find({ isApproved:true,popularity: { $lt: maxPopularity, $gt: minPopularity } });
            addMoviesToSet(movies);
        }


        // Filter by release year
        if (releaseYear) {
            const movies = await Movie.find({isApproved:true,
                releaseDate: {
                    $gte: new Date(`${releaseYear}-01-01`),
                    $lte: new Date(`${releaseYear}-12-31`)
                }
            });
            addMoviesToSet(movies);
        }

        // Filter by release decade
        if (releaseDecade) {
            const startYear = parseInt(releaseDecade, 10);
            const endYear = startYear + 9;

            const movies = await Movie.find({isApproved:true,
                releaseDate: {
                    $gte: new Date(`${startYear}-01-01`),
                    $lte: new Date(`${endYear}-12-31`)
                }
            });
            addMoviesToSet(movies);
        }

        // Filter by country of origin
        if (countryOfOrigin) {
            const movies = await Movie.find({ isApproved:true,countryOfOrigin });
            addMoviesToSet(movies);
        }

        // Filter by language
        if (language) {
            const movies = await Movie.find({ isApproved:true,Language: language });
            addMoviesToSet(movies);
        }

        // Filter by keywords in synopsis
        if (keywords) {
            const movies = await Movie.find({ isApproved:true,keywords: { $in: keywords } });
            addMoviesToSet(movies);
        }

        const movieIds = Array.from(movieSet);
        const uniqueMovies = await Movie.find({isApproved:true, _id: { $in: movieIds } })
            .populate('director')
            .populate('cast')
            .populate('crew');

        res.status(200).json(uniqueMovies);
    } catch (error) {
        res.status(500).json({ data: null, message: error.message });
    }
};

const getTopMoviesByGenre = async (req, res) => {

   
    const { genre } = req.body;

    if (!genre) {
        return res.status(400).json({ message: 'Genre is required for this query' });
    }
    const movies = await Movie.find({ genre ,isApproved:true}).select('-movieCoverPhoto')
        .sort({ averageRating: -1 })
        .limit(10)
        .populate('director')
        .populate('cast')

    res.status(200).json(movies);
}

const getTopMoviesOfTheMonth = async (req, res) => {
    try {

       

        const movies = await Movie.find({
            releaseDate: {
                $lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
                $gt: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            },
            isApproved:true
        }).select('-movieCoverPhoto')
            .sort({ averageRating: -1, popularity: -1 })
            .limit(10)
            .populate('director')
            .populate('cast')
        

        res.status(200).json(movies);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
const getMostPopularMovies = async (req, res) => {
    try {

       

        const popularMovies = await Movie.find({isApproved:true}).select('-movieCoverPhoto')
            .sort({ popularity: -1 });

        res.status(200).json(popularMovies);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getMovieById = async (req, res) => {
    try {
        const movie = await Movie.findById(req.params.id);
        if (!movie) {
            return res.status(404).json({ message: 'Movie not found' });
        }

        const filePath = path.join("__dirname", '..', movie.filePath);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'Movie file not found' });
        }

        const filename = path.basename(movie.filePath); 
        res.setHeader('Content-Disposition', `attachment; filename="${movie.title}"`);
        res.setHeader('Content-Type', 'video/mp4');

        const fileBuffer = fs.readFileSync(filePath);
        res.end(fileBuffer);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


const updateMovie = async (req, res) => {
    try {
        console.log(req.body)
        console.log("Hell")
        const movie = await Movie.findById(req.params.id);
        if (!movie) {
            return res.status(404).json({ message: 'Movie not found' });
        }

      
        Object.assign(movie, req.body);

        const updatedMovie = await movie.save();
        res.status(200).json(updatedMovie);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
const getApprovedMoviesForSeller = async (req, res) => {

    const sellerId = req.params.id;

    const popularMovies = await Movie.find({isApproved:true}).select('-movieCoverPhoto');

    res.status(200).json(popularMovies);
}

const getNonApprovedMoviesForSeller = async (req, res) => {

    const sellerId = req.params.id;

    const popularMovies = await Movie.find({isApproved:false}).select('-movieCoverPhoto');

    res.status(200).json(popularMovies);
}


const deleteMovie = async (req, res) => {
    try {
        const movie = await Movie.findByIdAndDelete(req.params.id);
        if (!movie) {
            return res.status(404).json({ message: 'Movie not found' });
        }

        // Delete the file from the folder
        const filePath = path.join(__dirname, '..', movie.filePath);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Delete references from related models
        await deleteRelatedMovies(movie);

        res.status(200).json({ message: 'Movie deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


const deleteRelatedMovies = async (movie) => {
    await User.updateMany({
        $pull: { userActivity: movie._id, moviesWishlist: movie._id }
    });

    await Person.updateMany({
        $pull: { filmography: movie._id }
    });

    const reviewsToDel = await Review.find({ movie: movie._id });

    for (const rev of reviewsToDel) {
        await Review.findByIdAndDelete(rev._id);
    }


    // console.log("movie deleted from references")
}

const getTrendingGenres = async (req, res) => {
    try {
        const genreTrends = await Movie.aggregate([
            { $unwind: "$genre" },
            { $group: { _id: "$genre", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        res.status(200).json(genreTrends);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getMovieByName = async (req, res) => {
    const movies = await Movie.find({ title: req.params.movieName}).select('-movieCoverPhoto');
    res.status(200).json(movies);
}

const getActionMovies = async (req, res) => {
    const movies = await Movie.find({ genre: "Action" }).select('-movieCoverPhoto');
    res.status(200).json(movies);
}

const getComedyMovies = async (req, res) => {
    const movies = await Movie.find({ genre: "Comedy" }).select('-movieCoverPhoto');
    res.status(200).json(movies);
}


module.exports = {  
    uploadMovie,
    uploadMovieCoverPhoto,
    streamMovie,
    getMovies,
    getMoviesForAdmin,
    getMoviesByFilter,
    getTopMoviesByGenre,
    getTopMoviesOfTheMonth,
    getMostPopularMovies,
    getMovieById,
    updateMovie,
    deleteMovie,
    getTrendingGenres,
    uploadMovieMiddleware,
    uploadCoverPhotoMiddleware,
    getApprovedMoviesForSeller,
    getNonApprovedMoviesForSeller,
    getAllForSeller,
    getTopTenMovies,
    getMovieByName,
    getActionMovies,
    getComedyMovies
    
};