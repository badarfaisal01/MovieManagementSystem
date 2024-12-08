const mongoose = require('mongoose');

const customerSubscriptionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    planId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan', required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, enum: ['Active', 'Expired'], default: 'Active' },
    paymentId: { type: String }, // Reference to payment gateway transaction ID
}, { timestamps: true });

const CustomerSubscription = mongoose.model('CustomerSubscription', customerSubscriptionSchema);

module.exports = CustomerSubscription;
