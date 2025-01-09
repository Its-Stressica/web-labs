Нижче наведено один із варіантів реалізації багатокористувацького чату з можливістю:

- **авторизуватися** під певним іменем користувача,  
- **приєднуватися** до різних кімнат (room),  
- **отримувати** адміністративні повідомлення («Вітаємо, user!» тощо),  
- **відправляти** власні повідомлення та бачити повідомлення інших учасників у кімнаті,  
- **отримувати оновлений список учасників** кімнати.

> **Принцип роботи**:  
> 1. На початковому екрані користувач вводить свій _нік_ та _ім’я кімнати_ і натискає «Приєднатись».  
> 2. Відбувається перехід у веб-інтерфейс чату, де користувач може надсилати й отримувати повідомлення у межах конкретної кімнати.   
> 3. Сервер керує всіма операціями через Socket.IO: зберігає список підключених користувачів, кімнати, пересилає повідомлення тощо.

---
## 1. Підготовка та встановлення залежностей

Створіть нову теку для проєкту, перейдіть у неї (через термінал або командний рядок) та виконайте:
```bash
npm init -y
npm install express socket.io
```

---
## 2. Структура файлів

У найпростішому випадку можна мати таку структуру:
```
.
├── public
│   ├── css
│   │   └── style.css
│   ├── chat.html
│   └── index.html
├── utils
│   ├── users.js
│   └── messages.js
└── server.js
```

У цій структурі:
- `server.js` – основний файл сервера Node.js (Express + Socket.IO).  
- `public/index.html` – сторінка, де користувач вводить нік та назву кімнати.  
- `public/chat.html` – сторінка з інтерфейсом чату.  
- `public/css/style.css` – стилі для відображення (за бажанням).  
- `utils/users.js` – модуль з функціями для керування користувачами в кімнатах.  
- `utils/messages.js` – невелика допоміжна функція/і для форматування/обробки повідомлень (якщо потрібно).

Нижче приклад усього коду. Ви можете його модифікувати на власний розсуд.

---
## 3. Код модуля `utils/users.js`

Зберігаємо інформацію про користувачів у масиві (або іншій структурі даних). Тут три основні операції: `userJoin`, `getCurrentUser`, `userLeave`, `getRoomUsers`.

```js
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
```

---
## 4. (Опційно) Код модуля `utils/messages.js`

Простенька функція, яка форматує повідомлення від імені когось із зазначенням часу:

```js
// utils/messages.js
const moment = require('moment');

// Якщо не бажаєте додаткових залежностей, можна й без moment
function formatMessage(username, text) {
  return {
    username,
    text,
    time: moment().format('h:mm a') // Наприклад, "6:20 pm"
  };
}

module.exports = formatMessage;
```

Якщо не хочете використовувати бібліотеку `moment`, можна просто повертати поточний час без неї.

---
## 5. Файл сервера `server.js`

Основна логіка:  
1. Ініціалізація серверу Express, Socket.IO.  
2. Статична роздача файлів з теки `public`.  
3. Коли користувач викликає подію `joinRoom` → зберігаємо його інформацію, підключаємо до кімнати `socket.join(room)` і надсилаємо привітальне повідомлення.  
4. Відправляємо оновлений список користувачів усім у кімнаті.  
5. При надсиланні `chatMessage` – транслюємо повідомлення учасникам.  
6. При `disconnect` – видаляємо користувача зі списку і надсилаємо інформацію решті учасників кімнати.

```js
// server.js
const path = require('path');
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

// Імпортуємо функції для роботи з користувачами
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers
} = require('./utils/users');

// (Опційно) імпортуємо форматування повідомлень
const formatMessage = require('./utils/messages');
// Якщо не хочемо дод. залежностей, можна своїм способом формувати час

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Тека зі статичними файлами (index.html, chat.html, style.css)
app.use(express.static(path.join(__dirname, 'public')));

// Ім'я "адміністратора" чату
const botName = 'Admin';

// Коли новий клієнт підключається до сервера Socket.IO
io.on('connection', (socket) => {
  // Слухаємо подію "joinRoom" з клієнта
  socket.on('joinRoom', ({ username, room }) => {
    const user = userJoin(socket.id, username, room);

    // Додаємо socket до кімнати
    socket.join(user.room);

    // Надсилаємо повідомлення тільки поточному користувачеві
    socket.emit(
      'message',
      formatMessage(botName, `Welcome, ${user.username}!!`)
    );

    // Оповіщаємо решту учасників кімнати про приєднання
    socket.broadcast
      .to(user.room)
      .emit(
        'message',
        formatMessage(botName, `${user.username} приєднався до чату`)
      );

    // Відправляємо оновлені дані по кімнаті всім учасникам
    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getRoomUsers(user.room)
    });
  });

  // Слухаємо повідомлення від клієнта
  socket.on('chatMessage', (msg) => {
    const user = getCurrentUser(socket.id);

    if (user) {
      io.to(user.room).emit('message', formatMessage(user.username, msg));
    }
  });

  // Коли користувач відключається
  socket.on('disconnect', () => {
    const user = userLeave(socket.id);
    if (user) {
      // Повідомляємо кімнату, що користувач покинув чат
      io.to(user.room).emit(
        'message',
        formatMessage(botName, `${user.username} вийшов(ла) з чату`)
      );
      // Оновлюємо список учасників у кімнаті
      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room)
      });
    }
  });
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Сервер запущено на порті ${PORT}`);
});
```

---
## 6. HTML-файли

### 6.1 `public/index.html` (екран входу)

Невеличка форма, де користувач вводить своє ім'я та кімнату і натискає «Приєднатись». Після сабміту ми переходимо на `chat.html`, передаючи дані (можна через `query params` або інші способи).

```html
<!DOCTYPE html>
<html lang="uk">
  <head>
    <meta charset="UTF-8" />
    <title>Вхід до чату</title>
    <link rel="stylesheet" href="css/style.css" />
  </head>
  <body>
    <div class="join-container">
      <h1>Приєднайтеся до Чату</h1>
      <form id="join-form" action="chat.html">
        <input
          type="text"
          name="username"
          placeholder="Ваш нік"
          required
        /><br />
        <input
          type="text"
          name="room"
          placeholder="Назва кімнати"
          required
        /><br />
        <button type="submit">Приєднатись</button>
      </form>
    </div>
  </body>
</html>
```

> **Зверніть увагу**: у формі атрибут `action="chat.html"` – це спрощений спосіб «переходу» на сторінку чату. Якщо ж хочете робити AJAX або передавати дані інакше – можна обробити це JavaScript’ом.

### 6.2 `public/chat.html` (інтерфейс чату)

Тут ми приймаємо `username` і `room` із **Query Params** (через `location.search`) і ініціалізуємо підключення сокетів.  

```html
<!DOCTYPE html>
<html lang="uk">
  <head>
    <meta charset="UTF-8" />
    <title>Чат кімната</title>
    <link rel="stylesheet" href="css/style.css" />
  </head>
  <body>
    <div class="chat-container">
      <!-- Ліва панель з інформацією -->
      <div class="chat-sidebar">
        <h3>Room: <span id="room-name"></span></h3>
        <h3>Username: <span id="my-username"></span></h3>
        <h3>Users in the chatroom</h3>
        <ul id="users"></ul>
      </div>

      <!-- Основна частина з повідомленнями -->
      <div class="chat-main">
        <div class="chat-messages" id="chat-messages"></div>

        <div class="chat-form-container">
          <form id="msg-form">
            <input
              id="msg"
              type="text"
              placeholder="Enter Message"
              required
              autocomplete="off"
            />
            <button type="submit">Send</button>
          </form>
        </div>
      </div>
    </div>

    <!-- Підключаємо socket.io з нашого сервера -->
    <script src="/socket.io/socket.io.js"></script>
    <script>
      // Зчитуємо query params (username і room)
      const { username, room } = Qs.parse(location.search, {
        ignoreQueryPrefix: true,
      });
    </script>
    <!-- Додайте бібліотеку qs (через cdn чи власний файл), щоб парсити URL-параметри -->
    <script src="https://cdn.jsdelivr.net/npm/qs/dist/qs.min.js"></script>

    <script>
      const socket = io();

      // При підключенні – надсилаємо на сервер подію "joinRoom"
      socket.emit('joinRoom', { username, room });

      // Отримуємо повідомлення 'message' з сервера
      socket.on('message', (msgData) => {
        outputMessage(msgData);
        // Прокручуємо блок із повідомленнями вниз
        const messagesContainer = document.getElementById('chat-messages');
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      });

      // Отримуємо оновлений список користувачів у кімнаті
      socket.on('roomUsers', ({ room, users }) => {
        document.getElementById('room-name').innerText = room;
        document.getElementById('my-username').innerText = username;
        outputRoomUsers(users);
      });

      // Відправляємо своє повідомлення
      const form = document.getElementById('msg-form');
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const msg = document.getElementById('msg').value;
        // Надсилаємо повідомлення на сервер
        socket.emit('chatMessage', msg);
        // Очищаємо поле вводу
        document.getElementById('msg').value = '';
        document.getElementById('msg').focus();
      });

      // Функція для відображення повідомлення у вікні чату
      function outputMessage({ username, text, time }) {
        const div = document.createElement('div');
        div.classList.add('message');
        div.innerHTML = `
          <p class="meta">${username} <span>${time || ''}</span></p>
          <p class="text">
            ${text}
          </p>
        `;
        document.getElementById('chat-messages').appendChild(div);
      }

      // Оновлюємо список користувачів зліва
      function outputRoomUsers(users) {
        const usersList = document.getElementById('users');
        usersList.innerHTML = users
          .map((user) => `<li>${user.username}</li>`)
          .join('');
      }
    </script>
  </body>
</html>
```

> **Увага**:  
> - Використовується бібліотека `qs` (Query String) для отримання `username` і `room` з URL (наприклад, `chat.html?username=user1&room=room1`).  
> - У CSS-і (файл `style.css`) можна оформити все за власним бажанням.

---
## 7. (Опційний) Приклад `style.css`

```css
/* public/css/style.css */
body {
  margin: 0;
  font-family: Arial, sans-serif;
  background: #f0f0f0;
}
.join-container,
.chat-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}
.join-container {
  text-align: center;
  margin-top: 100px;
}
.join-container input,
.chat-form-container input {
  padding: 10px;
  margin: 5px;
  width: 200px;
}
.join-container button,
.chat-form-container button {
  padding: 10px 20px;
  cursor: pointer;
}
.chat-container {
  display: flex;
  height: 90vh;
}
.chat-sidebar {
  background: #008b9f;
  color: #fff;
  width: 250px;
  padding: 20px;
}
.chat-sidebar h3 {
  margin-top: 0;
}
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.chat-messages {
  padding: 20px;
  flex: 1;
  overflow-y: auto;
  background: #ffffff;
}
.message {
  margin-bottom: 15px;
}
.message .meta {
  font-weight: bold;
}
.message .text {
  background: #eef;
  padding: 10px;
  border-radius: 5px;
}
.chat-form-container {
  background: #fff;
  padding: 10px;
  border-top: 1px solid #ccc;
  display: flex;
}
.chat-form-container form {
  width: 100%;
  display: flex;
}
.chat-form-container input {
  flex: 1;
}
```

---
## 8. Запуск застосунку

1. У терміналі (папка з `server.js`) виконайте команду:
   ```bash
   node server.js
   ```
2. Перейдіть у браузері на адресу [http://localhost:3000/](http://localhost:3000/).  
3. Ви побачите сторінку з формою (з `index.html`). Введіть нік, кімнату й натисніть «Приєднатись».  
4. Відкриється сторінка `chat.html`, підключиться Socket.IO, і ви опинитесь у вибраній кімнаті з введеним ніком.  
5. Відкрийте ще одну вкладку, введіть інший нік, однакову кімнату – побачите, як працює груповий чат:  
   - Нові учасники отримують привітання від Admin.  
   - Інші користувачі бачать, хто «зайшов» і хто «вийшов».  
   - Усі повідомлення, надіслані командою `socket.emit('chatMessage', msg)`, розсилаються учасникам у тій же кімнаті.

Це базовий приклад, який можна розширювати: додавати валідацію імені й кімнати, зберігання повідомлень у базі даних, списки онлайн-користувачів і багато іншого. Але вже зараз маємо повнофункціональний варіант багатокімнатного чату з Socket.IO!