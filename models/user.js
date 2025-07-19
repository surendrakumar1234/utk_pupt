const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    mobileNumber: { type: Number, required: true },
    utkPass: { type: Number, required: true },
    email: { type: String, required: false },
    // id: { type: Number, required: true },
    upiId: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);