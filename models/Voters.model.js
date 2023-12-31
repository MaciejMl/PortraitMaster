const mongoose = require('mongoose');

const voterSchema = new mongoose.Schema({
  user: { type: String, required: true, unique: true },
  votes: [String],
});

module.exports = mongoose.model('Voter', voterSchema);
