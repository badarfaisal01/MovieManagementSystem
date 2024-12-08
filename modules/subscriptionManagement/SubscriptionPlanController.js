const SubscriptionPlan = require('./SubscriptionPlan');
const { sendSubscriptionPlanNotification } = require('../notification/NotificationController');
const { User } = require('../adminSellerUser/AdminSellerUser');
const sendMail = require('../notification/EmailNotifications');
// Add a new subscription plan
const addSubscriptionPlan = async (req, res) => {
    try {
        const { name, price, duration, description } = req.body;

        const newPlan = new SubscriptionPlan({ name, price, duration, description });
        await newPlan.save();

        const users = await User.find();

        console.log(users)
        users.map((user) => {
            sendMail(user.email, "New Subscription Plan is Added -> ", `Hello ${user.name}, A new subscription plan is added for you in the platform!`);
        })

        await sendSubscriptionPlanNotification(newPlan);
        res.status(201).json({ message: 'Subscription plan created successfully!', plan: newPlan });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get all subscription plans
const getAllSubscriptionPlans = async (req, res) => {
    try {
        // Get pagination parameters from query with defaults
        const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
        const limit = parseInt(req.query.limit) || 10; // Default to limit 10 if not provided
        const skip = (page - 1) * limit; // Skip the appropriate number of records

        // Get total count of subscription plans for pagination info
        const totalPlans = await SubscriptionPlan.countDocuments();

        // Fetch paginated subscription plans
        const plans = await SubscriptionPlan.find()
            .skip(skip) // Skip records based on pagination
            .limit(limit) // Limit the number of records per page

        if (plans.length === 0) {
            return res.status(404).json({ message: "No subscription plans found" });
        }

        // Send response with subscription plans and pagination info
        res.status(200).json({
            plans,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalPlans / limit),
                totalItems: totalPlans,
                itemsPerPage: limit,
                hasNextPage: page * limit < totalPlans,
                hasPrevPage: page > 1,
            },
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Update a subscription plan
const updateSubscriptionPlan = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, price, duration, description } = req.body;

        const updatedPlan = await SubscriptionPlan.findByIdAndUpdate(
            id,
            { name, price, duration, description },
            { new: true }
        );

        if (!updatedPlan) return res.status(404).json({ message: 'Plan not found' });

        res.status(200).json({ message: 'Subscription plan updated successfully!', plan: updatedPlan });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete a subscription plan
const deleteSubscriptionPlan = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedPlan = await SubscriptionPlan.findByIdAndDelete(id);

        if (!deletedPlan) return res.status(404).json({ message: 'Plan not found' });

        res.status(200).json({ message: 'Subscription plan deleted successfully!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    addSubscriptionPlan,
    getAllSubscriptionPlans,
    updateSubscriptionPlan,
    deleteSubscriptionPlan,
};
