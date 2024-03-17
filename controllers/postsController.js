const fs = require("fs");
const path = require("path");
const asynHadler = require("express-async-hadler");
const {
  Post,
  validateCreation,
  validateCreatePost,
  validateUpdatePost,
} = require("../models/Post");
const {
  cloudinaryUploadImage,
  cloudinaryRemoveImage,
} = require("../utils/cloudinary");
const { Comment } = require("../models/Comment");

/*-----------------------------------------------
 * @desc     Create New Post
 * @route   /api/posts
 * @method   POST
 * @access   private (only logged in user)
 -----------------------------------------------*/
module.exports.createPostCtrl = asyncHandler(async (req, res) => {
  // Validation for image
  if (!req.file) {
    return res.status(400).json({ message: "No image provided" });
  }

  // Validation for data
  const { error } = validateCreatePost(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  // Upload photo
  const imagePath = path.join(__dirname, `../images/${req.file.filename}`);
  const result = await cloudinaryUploadImage(imagePath);

  // Create new post and save it to DB
  const post = await Post.create({
    title: req.body.title,
    description: req.body.description,
    category: req.body.category,
    user: req.user.id,
    image: {
      url: result,
      publicId: result.public_id,
    },
  });

  // Send response to the client
  res.status(201).json(post);

  // Remove image from the server
  fs.unlink(imagePath);
});

/*-----------------------------------------------
 * @desc     Get All Posts
 * @route   /api/posts
 * @method   GET
 * @access   public
 -----------------------------------------------*/
module.exports.getAllPostsCtrl = asyncHandler(async (req, res) => {
  const POST_PER_PAGE = 3;
  const { pageNumber, category } = req.query;
  let posts;

  if (pageNumber) {
    posts =
      (await Post.find().skip(pageNumber - 1)) *
      POST_PER_PAGE.limit(POST_PER_PAGE)
        .sort({ createdAt: -1 })
        .populate("user", ["-password"]);
  } else if (category) {
    posts = await Post.find({ category })
      .sort({ createdAt: -1 })
      .populate("user", ["-password"]);
  } else {
    posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate("user", ["-password"]);
  }
  res.status(200).json(posts);
});

/*-----------------------------------------------
 * @desc     Get Single Post
 * @route   /api/posts/:id
 * @method   GET
 * @access   public
 -----------------------------------------------*/
module.exports.getSinglePostCtrl = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id)
    .populate("user", ["-password"])
    .populate("comments");
  if (!post) {
    return res.status(404).json({ message: "post not found" });
  }
  res.status(200).json(post);
});

/*-----------------------------------------------
 * @desc     Get Posts Count
 * @route   /api/posts/count
 * @method   GET
 * @access   public
 -----------------------------------------------*/
module.exports.getPostCountCtrl = asyncHandler(async (req, res) => {
  const post = await Post.count();
  res.status(200).json(post);
});

/*-----------------------------------------------
 * @desc     Delete Single Post
 * @route   /api/posts/:id
 * @method   DELETE
 * @access   private (only Admin or owner of the post)
 -----------------------------------------------*/
module.exports.deleteSinglePostCtrl = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    return res.status(404).json({ message: "post not found" });
  }

  if (req.user.isAdmin || req.user.id === post.user.toString()) {
    await Post.findByIdAndDelete(req.params.id);
    await cloudinaryRemoveImage(post.image.publicId);

    // Delete all comments that belong to this post
    await Comment.deleteMany({ postId: post._id });

    res.status(200).json({
      message: "post has been deleted successfully",
      postId: post._id,
    });
  } else {
    res.status(403).json({ message: "Access denied, forbidden" });
  }
});

/*-----------------------------------------------
 * @desc     Update Single Post
 * @route   /api/posts/:id
 * @method   PUT
 * @access   private (owner of the post)
 -----------------------------------------------*/
module.exports.updateSinglePostCtrl = asyncHandler(async (req, res) => {
  // Validation
  const { error } = validateUpdatePost(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  // Get the post from DB & check if post exists
  const post = await Post.findById(req.params.id);
  if (!post) {
    return res.status(404).json({ message: "post not found" });
  }

  // Check if this post belong to logged in user
  if (req.user.id !== post.user.toString()) {
    return res
      .status(403)
      .json({ message: "Access denied, you are not allowed" });
  }

  // Update post
  const updatePost = await Post.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        title: req.body.title,
        description: req.body.description,
        category: req.body.category,
      },
    },
    { new: true }
  ).populate("user", ["-password"]);

  // Send response to the client
  res.status(200).json(updatePost);
});

/*-----------------------------------------------
 * @desc     Update Single Post Image
 * @route   /api/posts/upload-image/:id
 * @method   PUT
 * @access   private (only owner of the post)
 -----------------------------------------------*/
module.exports.updateSinglePostImageCtrl = asyncHandler(async (req, res) => {
  // Validation
  if (!req.file) {
    return res.status(400).json({ message: "No image provided" });
  }

  // Get the post from DB & check if post exists
  const post = await Post.findById(req.params.id);
  if (!post) {
    return res.status(404).json({ message: "post not found" });
  }

  // Check if this post belong to logged in user
  if (req.user.id !== post.user.toString()) {
    return res
      .status(403)
      .json({ message: "Access denied, you are not allowed" });
  }

  // Delete old image
  await cloudinaryRemoveImage(post.image.publicId);

  // Upload new image
  const image = path.join(__dirname, `../images/${req.file.filename}`);
  const result = await cloudinaryUploadImage(imagePath);

  // Update image field in DB
  const updatePost = await Post.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        image: {
          url: result.secure_url,
          publicId: result.public_id,
        },
      },
    },
    { new: true }
  );

  // Send response to the client
  res.status(200).json(updatePost);

  // Remove image from server
  fs.unlinkSync(imagePath);
});

/*-----------------------------------------------
 * @desc     Toggle Like
 * @route   /api/posts/like/:id
 * @method   PUT
 * @access   private (only logged in user)
 -----------------------------------------------*/
module.exports.toggleLikeCtrl = asyncHandler(async (req, res) => {
  const loggedInUser = req.user.id;
  const { id: postId } = req.params;

  let post = await Post.findById(postId);
  if (!post) {
    return res.status(404).json({ message: "post not found" });
  }

  const isPostAlreadyLiked = post.likes.find(
    (user) => user.toString() === loggedInUser
  );

  if (isPostAlreadyLiked) {
    post = await Post.findByIdAndUpdate(
      postId,
      {
        $pull: { likes: loggedInUser },
      },
      { new: true }
    );
  } else {
    post = await Post.findByIdAndUpdate(
      postId,
      {
        $push: { likes: loggedInUser },
      },
      { new: true }
    );
  }

  res.status(200).json(post);
});
