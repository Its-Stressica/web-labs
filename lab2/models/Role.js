const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema({
  value: { type: String, required: true },
});

module.exports = mongoose.model("Role", roleSchema);
