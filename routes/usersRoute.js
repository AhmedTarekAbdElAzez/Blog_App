const router = require("express").Router;
const {
  verifyTokenAndAdmin,
  verifyTokenAndOnlyUser,
  verifyToken,
  verifyTokenAndAuthorization,
} = require("../middlewares/verifyToken");
const {
  getUserCtrl,
  getAllUsersCtrl,
  updateUserProfileCtrl,
  getUsersCountCtrl,
  profilePhotoUploadCtrl,
  deleteUserProfileCtrl,
} = require("../controllers/userController");
const { validateObjectId } = require("../middlewares/validateObjectId");
const photoUpload = require("../middlewares/photoUpload");

//  /api/users/profile
router.route("/profile").get(verifyTokenAndAdmin, getAllUsersCtrl);

//  /api/users/profile/:id
router
  .route("/profile/:id")
  .get(validateObjectId, getUserCtrl)
  .put(validateObjectId, verifyTokenAndOnlyUser, updateUserProfileCtrl)
  .delet(validateObjectId, verifyTokenAndAuthorization, deleteUserProfileCtrl);

//  /api/users/profile/profile-photo-upload
router
  .route("/profile/profile-photo-upload")
  .post(verifyToken, photoUpload.single("image"), profilePhotoUploadCtrl);

//  /api/users/count
router.route("/count").get(verifyTokenAndAdmin, getUsersCountCtrl);

module.exports = router;
