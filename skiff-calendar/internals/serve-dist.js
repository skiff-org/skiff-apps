const path = require('path');

const express = require('express');

const port = process.env.PORT || 4100;

const DIST_PATH = path.resolve(__dirname, '../src/dist');

const main = () => {
  const app = express();

  app.use(
    '/calendar',
    express.static(DIST_PATH, {
      immutable: true,
      setHeaders: (res, path, stat) => {
        if (path.includes('sw.js')) {
          res.setHeader('Service-Worker-Allowed', '/calendar');
        }
      }
    })
  );

  app.use('/', (req, res) => {
    if (req.path === '/') return res.redirect('/calendar');
    res.sendFile(`${DIST_PATH}/index.html`);
  });

  app.listen(port, () => {
    console.log(`React dist server listening on port ${port}`);
  });
};

main();
