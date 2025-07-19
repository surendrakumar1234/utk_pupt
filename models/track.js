const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const trackSchema = new Schema({
    mNumber: { type: Number, required: true },
    paymentStatus: { type: Number, required: false },
    message: { type: String, required: false },
}, { timestamps: true });

module.exports = mongoose.model('Track', trackSchema);
