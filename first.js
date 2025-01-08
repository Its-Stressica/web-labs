require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

// Models (reuse your existing schema definitions)
const Role = require("./models/Role"); // adjust path as needed
const User = require("./models/User"); // adjust path as needed

// 1. Connect to MongoDB
(async () => {
  try {
    // Example: mongodb+srv://USER:PASSWORD@cluster0.xyz.mongodb.net/auth_roles
    const dbUri =
      process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/auth_roles";

    await mongoose.connect(dbUri);
    console.log("MongoDB connected");

    // 2. Check if 'admin' role exists, otherwise create it
    let adminRole = await Role.findOne({ value: "admin" });
    if (!adminRole) {
      adminRole = await Role.create({ value: "admin" });
      console.log(`Created new role: ${adminRole.value}`);
    }

    // 3. Prepare the admin username and password
    const adminUsername = "admin"; // change as needed
    const adminPasswordPlain = "admin"; // change as needed

    // 4. Check if a user with that username already exists
    const existingUser = await User.findOne({ username: adminUsername });
    if (existingUser) {
      console.log("Admin user already exists. Exiting...");
      process.exit(0);
    }

    // 5. Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(adminPasswordPlain, saltRounds);

    // 6. Create and save the admin user
    const newAdmin = new User({
      username: adminUsername,
      password: hashedPassword,
      roles: [adminRole._id],
    });

    await newAdmin.save();
    console.log(`Admin user "${adminUsername}" created successfully!`);
  } catch (error) {
    console.error("Error creating admin user:", error);
  } finally {
    // Close DB connection
    await mongoose.connection.close();
  }
})();
