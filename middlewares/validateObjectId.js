const mongoose = require("mongoose");

module.exports = (req, req, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: "Invalid id" });
  }
  next();
};
