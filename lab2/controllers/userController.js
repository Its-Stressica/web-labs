const bcrypt = require("bcrypt");
const User = require("../models/User");
const Role = require("../models/Role");

// GET /users
async function getUsers(req, res) {
  try {
    const users = await User.find({}).populate("roles");
    const usersData = users.map((u) => ({
      id: u._id,
      username: u.username,
      roles: u.roles.map((r) => r.value),
    }));
    res.json(usersData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
}

// POST /users
async function createUser(req, res) {
  try {
    const { username, password, roles } = req.body;

    if (!username || !password || !roles || !roles.length) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Перевірка унікальності username
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }

    // Гешування пароля
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Знайти об’єкти ролей за значеннями
    const roleDocs = await Role.find({ value: { $in: roles } });
    if (!roleDocs.length) {
      return res.status(400).json({ message: "No valid roles provided" });
    }

    // Створюємо користувача
    const newUser = new User({
      username,
      password: hashedPassword,
      roles: roleDocs.map((role) => role._id),
    });
    await newUser.save();

    res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = {
  getUsers,
  createUser,
};
