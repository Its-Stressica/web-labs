require("dotenv").config(); // Якщо використовуєте .env для секретів, змінних середовища
const express = require("express");
const app = express();
const dbConnect = require("./config/database");

// Підключаємося до бази даних
dbConnect();

// Мідлвар для парсингу JSON
app.use(express.json());

// Підключаємо маршрути
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");

// Використання маршрутів
app.use("/auth", authRoutes);
app.use("/users", userRoutes);

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
