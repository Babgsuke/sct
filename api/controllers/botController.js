const botModel = require('../models/botModel');

function get(req, res) {
  res.json(botModel.getBot());
}

function set(req, res) {
  const result = botModel.setBot(req.body || {});
  if (result.error) return res.status(400).json({ error: result.error });
  res.json(result);
}

module.exports = { get, set };
