// server.js
const path = require("path");
const express = require("express");
const http = require("http");
const socketIO = require("socket.io");

// Імпортуємо функції для роботи з користувачами
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
} = require("./utils/users");

// (Опційно) імпортуємо форматування повідомлень
const formatMessage = require("./utils/messages");
// Якщо не хочемо дод. залежностей, можна своїм способом формувати час

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Тека зі статичними файлами (index.html, chat.html, style.css)
app.use(express.static(path.join(__dirname, "public")));

// Ім'я "адміністратора" чату
const botName = "Admin";

// Коли новий клієнт підключається до сервера Socket.IO
io.on("connection", (socket) => {
  // Слухаємо подію "joinRoom" з клієнта
  socket.on("joinRoom", ({ username, room }) => {
    const user = userJoin(socket.id, username, room);

    // Додаємо socket до кімнати
    socket.join(user.room);

    // Надсилаємо повідомлення тільки поточному користувачеві
    socket.emit(
      "message",
      formatMessage(botName, `Welcome, ${user.username}!!`)
    );

    // Оповіщаємо решту учасників кімнати про приєднання
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessage(botName, `${user.username} приєднався до чату`)
      );

    // Відправляємо оновлені дані по кімнаті всім учасникам
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });

  // Слухаємо повідомлення від клієнта
  socket.on("chatMessage", (msg) => {
    const user = getCurrentUser(socket.id);
    if (user) {
      // Щоб бачити власні повідомлення, треба emit на всю кімнату
      io.to(user.room).emit("message", formatMessage(user.username, msg));
    }
  });

  // Коли користувач відключається
  socket.on("disconnect", () => {
    const user = userLeave(socket.id);
    if (user) {
      // Повідомляємо кімнату, що користувач покинув чат
      io.to(user.room).emit(
        "message",
        formatMessage(botName, `${user.username} вийшов(ла) з чату`)
      );
      // Оновлюємо список учасників у кімнаті
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Сервер запущено на порті ${PORT}`);
});
