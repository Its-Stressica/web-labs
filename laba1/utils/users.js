// utils/users.js

const users = [];

// Приєднання нового користувача
function userJoin(id, username, room) {
  const user = { id, username, room };
  users.push(user);
  return user;
}

// Пошук поточного користувача за socket.id
function getCurrentUser(id) {
  return users.find(user => user.id === id);
}

// Коли користувач виходить (disconnect)
function userLeave(id) {
  const index = users.findIndex(user => user.id === id);
  if (index !== -1) {
    return users.splice(index, 1)[0]; // вилучаємо користувача з масиву і повертаємо
  }
}

// Отримати всіх користувачів у кімнаті
function getRoomUsers(room) {
  return users.filter(user => user.room === room);
}

module.exports = {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers
};
