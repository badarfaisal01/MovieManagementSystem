const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const cors = require('cors')

const { loginUserSellerAdmin, authenticateToken,googleAuth } = require('./utility/util'); 
const { uploadMovieMiddleware,
    uploadCoverPhotoMiddleware, uploadMovie,uploadMovieCoverPhoto, streamMovie, getMovies, getMoviesByFilter, getTopMoviesByGenre, getTopMoviesOfTheMonth, getMostPopularMovies, getMovieById, updateMovie, deleteMovie, getTrendingGenres, getApprovedMoviesForSeller, getNonApprovedMoviesForSeller, 
    getAllForSeller,
    getMoviesForAdmin,
    getTopTenMovies,
    getMovieByName,
    getActionMovies,
    getComedyMovies} = require('./modules/movies/MoviesController');
const { registerAdminSeller,updateProfileAdminSeller, getProfileAdminSeller, getAllAdminSellers, getAllAdmins, getAllSellers, deleteAdminSeller, adminDashboard, sellerDashboard}=require('./modules/adminSellerUser/AdminSellerController');
const {registerUser, getProfile,getAllUsers,updateProfile,deleteUser,getUserWishlist,getMoviesBasedOnUserActivities}=require('./modules/adminSellerUser/UserController');
const {createPerson,getPersons,getPersonById,updatePerson,deletePerson}=require('./modules/persons/PersonController');
const {getReviewPieGraph,getReviewBarGraph,createReview, updateReview, getAllReviewsForMovie,getTopRatedReviewsForMovie,getMostDiscussedReviewsForMovie,deleteReviewByAdmin}=require('./modules/reviews/ReviewController')
const { getMoviesBasedOnGenreUserRatingAndUserActivity, getSimilarTitlesMovies, getTrendingMovies, getTopRatedMovies } = require('./modules/recomendation/RecomendationController');
const {getAllWatchHistory,addToWatchHistory,deleteFromWatchHistory} = require('./modules/watchHistory/WatchHistoryController');
const{ processPayment,addOrUpdateSubscriptionForUser,getAllSubscriptionsForUser}=require('./modules/subscriptionManagement/CustomerSubscriptionController');
const{ addSubscriptionPlan, getAllSubscriptionPlans,updateSubscriptionPlan,deleteSubscriptionPlan}=require('./modules/subscriptionManagement/SubscriptionPlanController');
const { addNotification, deleteNotification, getNotification, getAllNotifications } = require('./modules/notification/NotificationController');
const app = express();

app.use(cors());
app.use(express.json());
////////////////////////////////////////////only isApproved wali movies
//Routes where authentication is not needed
app.post('/adminseller/register', registerAdminSeller);
app.post('/user/register', registerUser);
app.post('/login/userSellerAdmin', loginUserSellerAdmin);
app.post('/auth/google', googleAuth);

//AdminSeller
app.get('/adminDashboard', authenticateToken, adminDashboard);
app.get('/sellerDashboard/:id', authenticateToken, sellerDashboard);
app.put('/adminseller/update', authenticateToken, updateProfileAdminSeller);
app.get('/adminseller/profile', authenticateToken, getProfileAdminSeller);
app.get('/adminseller/all', authenticateToken, getAllAdminSellers);
app.get('/adminseller/admins', authenticateToken, getAllAdmins);
app.get('/adminseller/sellers', authenticateToken, getAllSellers);
app.delete('/adminseller/delete/:id', authenticateToken, deleteAdminSeller);

//User
app.get('/user/profile', authenticateToken, getProfile);
app.get('/user/all', authenticateToken, getAllUsers);   
app.put('/user/update', authenticateToken, updateProfile);
app.delete('/user/delete/:userId', authenticateToken, deleteUser);
app.get('/user/wishlist/:userId', authenticateToken, getUserWishlist);
app.get('/user/activities/:userId', authenticateToken, getMoviesBasedOnUserActivities);

//Person
app.post('/persons', authenticateToken, createPerson); // Create a new person
app.get('/persons', authenticateToken, getPersons); // Get all persons with pagination
app.get('/persons/:id', authenticateToken, getPersonById); // Get a specific person by ID
app.put('/persons/:id', authenticateToken, updatePerson); // Update a specific person by ID
app.delete('/persons/:id', authenticateToken, deletePerson);

//Movie
app.get('/movie/getByName/:movieName',  authenticateToken, getMovieByName);
app.get('/movies/getAll', getMoviesForAdmin);
app.get('/movies/getAllAction',authenticateToken, getActionMovies );
app.get('/movies/getAllComedy',authenticateToken, getComedyMovies );
app.get('/movies/:id', authenticateToken, getMovieById);
app.post('/movies/upload', authenticateToken, uploadMovieMiddleware, uploadMovie);
app.post('/movies/:id/upload-cover', uploadCoverPhotoMiddleware,uploadMovieCoverPhoto);
app.put('/movies/:id', authenticateToken,  updateMovie);

// app.get('/movies/stream/:id', authenticateToken, streamMovie);
app.get('/movies', authenticateToken, getTopTenMovies);
app.get('/movies/filter', authenticateToken, getMoviesByFilter);
app.get('/movies/top/genre', authenticateToken, getTopMoviesByGenre);
app.get('/movies/top/month', authenticateToken, getTopMoviesOfTheMonth);
app.get('/movies/popular', authenticateToken, getMostPopularMovies);
app.delete('/movies/:id', authenticateToken,  deleteMovie);
app.get('/movies/trending/genres', authenticateToken, getTrendingGenres);
app.get('/movies/getAllForSeller/:id' , authenticateToken, getAllForSeller);
app.get('/movies/getApprovedMoviesForSeller/:sellerId', authenticateToken,  getApprovedMoviesForSeller);
app.get('/movies/getNonApprovedMoviesForSeller/:sellerId', authenticateToken, getNonApprovedMoviesForSeller);

//Review Routes   
app.post('/reviews', authenticateToken, createReview); // Create a review
app.put('/reviews/:reviewId', authenticateToken, updateReview); // Update a review
app.get('/reviews/movie/:movie', authenticateToken, getAllReviewsForMovie); // Get all reviews for a specific movie
app.get('/reviews/top/movie/:movie', authenticateToken, getTopRatedReviewsForMovie); // Get top-rated reviews for a movie
app.get('/reviews/most-discussed', authenticateToken, getMostDiscussedReviewsForMovie); // Get the most discussed movie reviews
app.get('/reviews/pie-graph/:movieId', authenticateToken, getReviewPieGraph); // Get pie chart of reviews for a movie
app.get('/reviews/bar-graph/:movieId', authenticateToken, getReviewBarGraph); // Get bar chart of reviews for a movie
app.delete('/reviews/:reviewId', authenticateToken, deleteReviewByAdmin); // Delete a review by admin

//Recomendation
app.get('/movies/genre-user-rating-activity/:userId',authenticateToken, getMoviesBasedOnGenreUserRatingAndUserActivity);// Route to get movies similar to a given movie (by genre, director, etc.)
app.get('/movies/similar/:movieId',authenticateToken,getSimilarTitlesMovies);// Route to get trending movies based on user ratings
app.get('/movies/trending/:userId',authenticateToken, getTrendingMovies);// Route to get top-rated movies based on user ratings and popularity
app.post('/movies/top-rated',authenticateToken, getTopRatedMovies);

//WatchHistory
app.get('/watch-history/:userId',authenticateToken, getAllWatchHistory);// Add a movie to watch history
app.post('/watch-history', authenticateToken,addToWatchHistory);// Delete a movie from watch history
app.delete('/watch-history/:userId/:movieId', authenticateToken,deleteFromWatchHistory);

// Customer Subscription Routes
app.post('/subscriptions/process-payment',authenticateToken, processPayment);
app.get('/subscriptions/:userId',authenticateToken,getAllSubscriptionsForUser);

// Subscription Plan Routes
app.post('/plans',authenticateToken, addSubscriptionPlan);
app.get('/plans',authenticateToken, getAllSubscriptionPlans);
app.put('/plans/:id',authenticateToken,updateSubscriptionPlan);
app.delete('/plans/:id',authenticateToken, deleteSubscriptionPlan);

//Notification
app.get('/notifications/:userId',authenticateToken, getAllNotifications);// Get a Specific Notification for a User
app.get('/notifications/:userId/:notificationId', authenticateToken,getNotification);// Add a Notification (can be used for manual testing)
app.post('/notifications/add',authenticateToken, addNotification);// Delete a Notification
app.delete('/notifications/:id',authenticateToken, deleteNotification);

mongoose.connect("mongodb+srv://i222524:ahsan1011@weblab11.x7sop.mongodb.net/webProject", {})
    .then(() => console.log("Connection built"))
    .catch((e) => console.log("Connection failed"));

app.listen(3213, () => {
    console.log(`Server is running on port 3213`);
});
