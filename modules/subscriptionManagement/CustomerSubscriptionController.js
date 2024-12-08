const CustomerSubscription = require('./CustomerSubscription');
const SubscriptionPlan = require('./SubscriptionPlan');
const stripe = require('stripe')('your-secret-key'); // Replace with your actual Stripe secret key

// Process Payment
const processPayment = async (req, res) => {
    try {
        const { amount, currency, userId, planId } = req.body;

        // Create a payment intent using Stripe
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency,
            payment_method_types: ['card'],
        });

        const paymentId = paymentIntent.id;

        // If payment is successful, update subscription
        await addOrUpdateSubscriptionForUser(userId, planId, paymentId);

        res.status(200).json({ message: 'Payment successful!', paymentId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Add or Update Subscription for a User
const addOrUpdateSubscriptionForUser = async (userId, planId, paymentId) => {
    try {
        const plan = await SubscriptionPlan.findById(planId);
        if (!plan) throw new Error('Invalid subscription plan');

        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + plan.duration);

        let subscription = await CustomerSubscription.findOne({ userId });

        if (subscription) {
            // Update existing subscription
            subscription.planId = planId;
            subscription.startDate = startDate;
            subscription.endDate = endDate;
            subscription.paymentId = paymentId;
            subscription.status = 'Active';
        } else {
            // Create a new subscription
            subscription = new CustomerSubscription({
                userId,
                planId,
                startDate,
                endDate,
                paymentId,
                status: 'Active',
            });
        }

        await subscription.save();
        console.log('Subscription updated/created successfully!');
    } catch (error) {
        console.error('Error updating/creating subscription:', error.message);
        throw new Error(error.message);
    }
};

// Get all subscriptions for a user
const getAllSubscriptionsForUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const subscriptions = await CustomerSubscription.find({ userId }).populate('planId');

        res.status(200).json(subscriptions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    processPayment,
    addOrUpdateSubscriptionForUser,
    getAllSubscriptionsForUser,
};
