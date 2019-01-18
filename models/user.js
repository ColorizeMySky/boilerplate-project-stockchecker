const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const stockShema = new Schema({
  name:  {
    type: String,
    required: true,
    unique: true
  },
  like:  {
    type: Number
  }
});

const userSchema = new Schema({
    ipAddress: {
      type: String,
      required: true,
      unique: true
    },
    stocks: [stockShema]      
});


const Users = mongoose.model('User', userSchema);

module.exports = Users;