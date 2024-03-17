const mongoose = require("mongoose");
const Joi = require("joi");

const CategorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

const Category = mongoose.model("Category", CategorySchema);

// Validate Create Category
function validateCreateCategory(obj) {
  const Schema = Joi.object({
    title: Joi.string().trim().required().label("Title"),
  });
  return Schema.validate(obj);
}

module.exports = { Category, validateCreateCategory, validateUpdateCategory };
