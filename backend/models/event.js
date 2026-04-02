const eventSchema = new mongoose.Schema({
  title: String,
  date: Date,
  venue: String,
  capacity: Number,
  ticketsSold: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['draft', 'live', 'completed'] }
});

module.exports = mongoose.model('Event', eventSchema);