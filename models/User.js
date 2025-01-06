const { default: mongoose, model } = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phoneNumber: {
    type: String,
    unique: true,
    required: true,
  },
  uid: {
    type: String,
    unique: true,
  },
  organization: String,
  role: String,
  machineIds: [String],
  imageUrl: String,
  embeddings: [{ type: mongoose.Schema.Types.Mixed }],
  locations: [{ type: mongoose.Schema.Types.Mixed }],
  crawledData: { type: mongoose.Schema.Types.Mixed },
});

exports.User = model('users', userSchema);
