const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Перевірка токена
async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res
        .status(401)
        .json({ message: "Authorization header is missing" });
    }

    // Припускаємо, що авторизація в форматі "Bearer <token>"
    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Token is missing" });
    }

    const secret = process.env.JWT_SECRET || "mySecretKey";
    const decoded = jwt.verify(token, secret);

    // Знайдемо користувача та його ролі
    const user = await User.findById(decoded.userId).populate("roles");
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Зберігаємо користувача в req
    req.user = user;
    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ message: "Invalid token" });
  }
}

// Перевірка, чи має користувач хоча б одну роль з масиву дозволених
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    const userRoles = req.user.roles.map((role) => role.value);
    const hasRole = userRoles.some((role) => allowedRoles.includes(role));

    if (!hasRole) {
      return res.status(403).json({ message: "Access denied" });
    }

    next();
  };
}

module.exports = {
  authMiddleware,
  authorizeRoles,
};
