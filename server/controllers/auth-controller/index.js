const User = require("../../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");



const sendMail = async (to, subject, text) => {
  const sgMail = require('@sendgrid/mail');
  
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  
  const msg = {
    to,
    from: 'saksha914@gmail.com',
    subject,
    text,
  };

  try {
    await sgMail.send(msg);
    console.log('OTP email sent successfully');
  } catch (error) {
    console.error('Error sending OTP email:', error);
  }
};

const registerUser = async (req, res) => {
  const { userName, userEmail, password, role } = req.body;

  try {
    const existingUser = await User.findOne({
      $or: [{ userEmail }, { userName }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User name or user email already exists",
      });
    }

   
    const otp = crypto.randomInt(100000, 999999).toString();

  
    const hashPassword = await bcrypt.hash(password, 10);

   
    const newUser = new User({
      userName,
      userEmail,
      role,
      password: hashPassword,
      isVerified: false, 
      otp, 
      otpExpiry: Date.now() + 10 * 60 * 1000, 
    });

    await newUser.save();

    const subject = "Verify Your Account";
    const text = `Hello ${userName},\n\nYour OTP for account verification is: ${otp}\n\nThis OTP is valid for 10 minutes.`;

   
    await sendMail(userEmail, subject, text);

    return res.status(201).json({
      success: true,
      message: "User registered successfully! OTP sent to your email.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "An error occurred during registration.",
    });
  }
};


const verifyUser = async (req, res) => {
  const { userEmail, otp } = req.body;

  try {
   
    const user = await User.findOne({ userEmail });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (user.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP.",
      });
    }

    if (Date.now() > user.otpExpiry) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one.",
      });
    }

    user.isActive = true;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Account verified successfully.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "An error occurred during verification.",
    });
  }
};

const loginUser = async (req, res) => {
  const { userEmail, password } = req.body;

  const checkUser = await User.findOne({ userEmail });

  if(!checkUser.isActive){
    return res.status(200).json({
      success: false,
      message: "Verify First",
    });
  }
  
  if (!checkUser || !(await bcrypt.compare(password, checkUser.password))) {
    return res.status(401).json({
      success: false,
      message: "Invalid credentials",
    });
  }

  const accessToken = jwt.sign(
    {
      _id: checkUser._id,
      userName: checkUser.userName,
      userEmail: checkUser.userEmail,
      role: checkUser.role,
    },
    "JWT_SECRET",
    { expiresIn: "120m" }
  );

  res.status(200).json({
    success: true,
    message: "Logged in successfully",
    data: {
      accessToken,
      user: {
        _id: checkUser._id,
        userName: checkUser.userName,
        userEmail: checkUser.userEmail,
        role: checkUser.role,
      },
    },
  });
};

module.exports = { registerUser, loginUser,verifyUser };
