const mongoose = require('mongoose')

const SubscriptionSchema = new mongoose.Schema({
  endpoint: { type: String, required: true, unique: true },
  expirationTime: { type: Date, default: null },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true },
  },
})

const Subscription = mongoose.model('Subscription', SubscriptionSchema)

module.exports = Subscription