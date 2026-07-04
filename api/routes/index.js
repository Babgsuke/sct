const authRoutes = require('./authRoutes');
const serverRoutes = require('./serverRoutes');
const sshRoutes = require('./sshRoutes');
const xrayRouters = require('./xrayRoutes');
const botRoutes = require('./botRoutes');
const systemRoutes = require('./systemRoutes');
const monitorRoutes = require('./monitorRoutes');

function mountRoutes(app) {
  app.use('/api/auth', authRoutes);
  app.use('/api/server', serverRoutes);
  app.use('/api/ssh', sshRoutes);

  xrayRouters.forEach(({ basePath, router }) => {
    app.use(`/api/${basePath}`, router);
  });

  app.use('/api/bot', botRoutes);
  app.use('/api/system', systemRoutes);
  app.use('/api/monitor', monitorRoutes);
}

module.exports = mountRoutes;
