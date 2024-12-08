const Notification = require('./Notification');
const cron = require('node-cron');
const{User} = require('../adminSellerUser/AdminSellerUser');

// Add Notification
const addNotification = async (title, userId, body) => {
    try {
        const notification = new Notification({ title, userId, body });
        await notification.save();
        console.log('Notification added successfully!');
    } catch (error) {
        console.error('Error adding notification:', error.message);
        throw new Error(error.message);
    }
};

// Delete Notification
const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await Notification.findByIdAndDelete(id);

        if (!notification) return res.status(404).json({ message: 'Notification not found' });

        res.status(200).json({ message: 'Notification deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get Notification for User
const getNotification = async (req, res) => {
    try {
        const { userId, notificationId } = req.params;
        const notification = await Notification.findOne({ _id: notificationId, userId });

        if (!notification) return res.status(404).json({ message: 'Notification not found' });

        res.status(200).json(notification);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get All Notifications for User
const getAllNotifications = async (req, res) => {
    try {
        const { userId } = req.params;

        // Get pagination parameters from query with defaults
        const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
        const limit = parseInt(req.query.limit) || 10; // Default to limit 10 if not provided
        const skip = (page - 1) * limit; // Skip the appropriate number of records

        // Get total count of notifications for pagination info
        const totalNotifications = await Notification.countDocuments({ userId });

        // Fetch paginated notifications
        const notifications = await Notification.find({ userId })
            .skip(skip) // Skip records based on pagination
            .limit(limit) // Limit the number of records per page

        if (notifications.length === 0) {
            return res.status(404).json({ message: `No notifications found for user ${userId}` });
        }

        // Send response with notifications and pagination info
        res.status(200).json({
            notifications,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalNotifications / limit),
                totalItems: totalNotifications,
                itemsPerPage: limit,
                hasNextPage: page * limit < totalNotifications,
                hasPrevPage: page > 1,
            },
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Send Notifications for Movie Releases
const sendMovieReleaseNotifications = async () => {
    try {
        const moviesReleasingTomorrow = await Movie.find({
            releaseDate: new Date(new Date().setDate(new Date().getDate() + 1))
        });

        if (moviesReleasingTomorrow.length > 0) {
            const users = await User.find();
            for (const user of users) {
                for (const movie of moviesReleasingTomorrow) {
                    const title = `Movie Release Tomorrow: ${movie.title}`;
                    const body = `Don't forget to watch ${movie.title} tomorrow! Release Date: ${movie.releaseDate}`;
                    await addNotification(title, user._id, body);
                }
            }
        }
    } catch (error) {
        console.error('Error sending movie release notifications:', error.message);
    }
};

// Send Notification for Subscription Plan Added
const sendSubscriptionPlanNotification = async (plan) => {
    try {
        const users = await User.find();
        const title = 'New Subscription Plan Available!';
        const body = `A new subscription plan named "${plan.name}" is now available for you! Check it out!`;

        for (const user of users) {
            await addNotification(title, user._id, body);
        }
    } catch (error) {
        console.error('Error sending subscription plan notification:', error.message);
    }
};

// Schedule Movie Release Notifications (to be called once a day at 12 PM)
const scheduleMovieReleaseNotifications = () => {
    const job = cron.schedule('0 12 * * *', () => {
        sendMovieReleaseNotifications();
    });
    job.start();
};




module.exports = {
    addNotification,
    deleteNotification,
    getNotification,
    getAllNotifications,
    sendMovieReleaseNotifications,
    sendSubscriptionPlanNotification,
    scheduleMovieReleaseNotifications
};
