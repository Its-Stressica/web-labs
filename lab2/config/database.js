const mongoose = require("mongoose");

async function dbConnect() {
  const dbUri = process.env.MONGODB_URI;

  try {
    await mongoose.connect(dbUri);
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1); // зупиняємо процес, якщо не можемо підключитися до БД
  }
}

module.exports = dbConnect;
