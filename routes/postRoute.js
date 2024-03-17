const router = require("express").Router;
const photoUpload = require("../middlewares/photoUpload");
const { verifyToken } = require("../middlewares/verifyToken");
const {
  createPostCtrl,
  getAllPostsCtrl,
  getSinglePostCtrl,
  getPostCountCtrl,
  deleteSinglePostCtrl,
  updateSinglePostCtrl,
  updateSinglePostImageCtrl,
  toggleLikeCtrl,
} = require("../controllers/postsController");
const validateObjectId = require("../middlewares/validateObjectId");
//  /api/posts
router
  .route("/")
  .post(verifyToken, photoUpload.single("image"), createPostCtrl)
  .get(getAllPostsCtrl);

//  /api/posts/count
router.route("/count").get(getPostCountCtrl);

//  /api/posts/:id
router
  .route("/:id")
  .get(validateObjectId, getSinglePostCtrl)
  .delete(validateObjectId, verifyToken, deleteSinglePostCtrl)
  .put(validateObjectId, verifyToken, updateSinglePostCtrl);

//  /api/posts/update-image/:id
router
  .route("/update-image/:id")
  .put(
    validateObjectId,
    verifyToken,
    photoUpload.single("image"),
    updateSinglePostImageCtrl
  );

//  /api/posts/likes/:id
router.route("/likes/:id").put(validateObjectId, verifyToken, toggleLikeCtrl);

module.exports = router;
