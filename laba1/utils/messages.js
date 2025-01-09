function formatMessage(username, text) {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, "0");

  return {
    username,
    text,
    time: `${hours}:${minutes}`,
  };
}

module.exports = formatMessage;
