const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const { User, validateRegisterUser } = require("../models/User");

/*-----------------------------------------------
 * @desc     Register new user - (Sign Up)
 * @route   /api/auth/register
 * @method   POST
 * @access   public
 -----------------------------------------------*/
module.exports.registerUserCtrl = asyncHandler(async (req, res) => {
  // Validation
  const { error } = validateRegisterUser(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  // Is user already exists in db
  let user = await User.findOne({ email: req.body.email });
  if (user) {
    return res.status(400).json({ message: "user already existed" });
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(req.body.password, salt);

  // New user & save it to db
  user = new User({
    username: req.body.username,
    email: req.body.email,
    password: hashPassword,
  });
  await user.save();

  // Send email to new user
  

  // send response to client
  res.status(201).json({ message: "you have successfully created a new user" });
});

/*-----------------------------------------------
 * @desc     Login user - (Sign in)
 * @route   /api/auth/login
 * @method   POST
 * @access   public
 -----------------------------------------------*/
module.exports.loginUserCtrl = asyncHandler(async (req, res) => {
  // Validation
  const { error } = validateLoginUser(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  // Is User Exist
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return res.status(400).json({ message: "Invalid email." });
  }

  // Check The Password
  const isPasswordMatch = await user.bcrypt.compare(
    req.body.password,
    user.password
  );
  if (!isPasswordMatch) {
    return res.status(400).json({ message: "Invalid password." });
  }

  // Generate Token(JWT)
  const token = user.generateAuthToken();

  // send response to client
  res.status(201).json({
    _id: user._id,
    isAdmin: user.isAdmin,
    profilePhoto: user.profilePhoto,
    token,
  });
});
