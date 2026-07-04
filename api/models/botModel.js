const { execCmd, readFile, appendLine } = require('../utils/helpers');

const BOT_DB = '/etc/bot/.bot.db';

function getBot() {
  const line = execCmd(`grep -E '^#bot#' ${BOT_DB} 2>/dev/null | tail -1`).stdout;
  const parts = line.split(/\s+/);
  return { token: parts[1] || '', chat_id: parts[2] || '' };
}

function setBot({ token, chat_id }) {
  if (!token || !chat_id) return { error: 'token dan chat_id wajib' };
  execCmd(`sed -i '/^#bot#/d' ${BOT_DB}`);
  appendLine(BOT_DB, `#bot# ${token} ${chat_id}`);
  return { message: 'Bot berhasil dikonfigurasi' };
}

module.exports = { getBot, setBot };
