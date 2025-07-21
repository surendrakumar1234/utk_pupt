const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const dramaSchema = new Schema(
  {
    title: { type: String, required: false },
    linksTable: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Drama", dramaSchema);

