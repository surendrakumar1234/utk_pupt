const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const uniqueSchema = new Schema({
    uniqueId: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Unique', uniqueSchema);