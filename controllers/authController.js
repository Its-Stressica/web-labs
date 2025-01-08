const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function login(req, res) {
  try {
    const { username, password } = req.body;

    // Input validation
    if (!username || !password) {
      return res.status(400).json({
        message: "Username and password are required",
      });
    }

    // Шукаємо користувача за username
    const user = await User.findOne({ username }).populate("roles");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Порівнюємо пароль
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    // Генеруємо JWT
    const secret = process.env.JWT_SECRET || "mySecretKey";
    const token = jwt.sign(
      {
        userId: user._id,
        roles: user.roles.map((role) => role.value),
      },
      secret,
      { expiresIn: "1h" }
    );

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = {
  login,
};
