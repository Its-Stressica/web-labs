const express = require("express");
const router = express.Router();
const { getUsers, createUser } = require("../controllers/userController");
const {
  authMiddleware,
  authorizeRoles,
} = require("../middlewares/authMiddleware");

// GET /users – доступно користувачам з ролями "customer" або "admin"
router.get("/", authMiddleware, authorizeRoles("admin", "customer"), getUsers);

// POST /users – доступно лише "admin"
router.post("/", authMiddleware, authorizeRoles("admin"), createUser);

module.exports = router;
