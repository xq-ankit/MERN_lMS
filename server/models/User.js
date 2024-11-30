const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  userName: { type: String, required: true },
  userEmail: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "user" }, 
  isActive: { type: Boolean, default: false }, 
  otp: { type: String }, 
}, { timestamps: true }); 
module.exports = mongoose.model("User", UserSchema);

