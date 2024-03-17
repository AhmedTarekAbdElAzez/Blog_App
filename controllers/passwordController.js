const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const {
  User,
  validateRegisterUser,
  validateLoginUser,
  validateEmail,
  validateNewPassword,
} = require("../models/User");
const crypto = require("crypto");

/*-----------------------------------------------
 * @desc     Send Reset Password Link
 * @route   /api/password/reset-password-link
 * @method   POST
 * @access   public
 -----------------------------------------------*/
module.exports.sendResetPsswordLinkCtrl = asyncHandler(async (req, res) => {
  // Validation
  const { error } = validateEmail(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  // Get user from db by email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return res.status(404).json({ message: "User with given email not found" });
  }

  // Createting Verification
  const verificationToken = await User.verificationToken.findOne({
    userId: user._id,
  });
  if (verificationToken) {
    verificationToken = new verificationToken({
      userId: user._id,
      token: crypto.randomBytes(32).toString("hex"),
    });
  }

  // Creating Link
  const link = `https://localhost:8000/reset-password/${user._id}/${verificationToken.token}`;

  // Creating HTML templete
  const htmlTemplete = `<a href="${link}">Click here to reset your password</a>`;

  // Sending Email
  await sendEmail(user.email, "Reset Password", htmlTemplete);

  // Response to the client
  res.status(200).json({
    message: "Password reset link sent to your email, please check your inbox",
  });
});

/*-----------------------------------------------
 * @desc     Get Reset Password Link
 * @route   /api/password/reset-password/:userId/:token
 * @method   GET
 * @access   public
 -----------------------------------------------*/
module.exports.getResetPasswordLinkCtrl = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (!user) {
    return res.status(400).json({ message: "Invalid link" });
  }

  const verificationToken = await verificationToken.findOne({
    userId: user._id,
    token: req.params.token,
  });
  if (!verificationToken) {
    return res.status(400).json({ message: "Invalid link" });
  }

  res.status(200).json({ message: "Invalid url" });
});

/*-----------------------------------------------
 * @desc     Get Reset Password Link
 * @route   /api/password/reset-password/:userId/:token
 * @method   GET
 * @access   public
-----------------------------------------------*/
module.exports.resetPasswordCtrl = asyncHandler(async (req, res) => {
  const { error } = validateNewPassword(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const user = await User.findById(req.params.userId);
  if (!user) {
    return res.status(404).json({ message: "Invalid link" });
  }

  const verificationToken = await VerificationToken.findOne({
    userId: user._id,
    token: req.params.token,
  });
  if (!verificationToken) {
    return res.status(404).json({ message: "Invalid link" });
  }

  if (!user.isAccountVerified) {
    user.isAccountVerified = true;
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(req.body.password, salt);

  user.password = hashedPassword;
  await user.save();
  await verificationToken.remove();

  res
    .status(200)
    .json({ message: "Password reset successfully, Please login" });
});
