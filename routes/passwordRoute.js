const router = require("express").Router();
const {
  sendResetPsswordLinkCtrl,
  getResetPasswordLinkCtrl,
  resetPasswordCtrl,
} = require("../controllers/passwordController");

//  /api/password/reset-password-link
router.post("/reset-password-link", sendResetPsswordLinkCtrl);

//  /api/password/reset-password-link/:userId/token
router
  .post("/reset-password-link/:userId/token")
  .get(getResetPasswordLinkCtrl)
  .post(resetPasswordCtrl);

module.exports = router;
