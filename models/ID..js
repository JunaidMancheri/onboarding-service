const { default: mongoose, model } = require("mongoose");

const IDSchema = new mongoose.Schema({
  type: String,
  id: String,
  uid: String
})


const ID = model('IDs', IDSchema);
module.exports = ID;