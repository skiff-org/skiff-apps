/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */

const path = require('path');

const express = require('express');

const port = process.env.PORT || 4200;

const DIST_PATH = path.resolve(__dirname, '../src/dist');

const main = () => {
  const app = express();

  app.use(
    '/mail',
    express.static(DIST_PATH, {
      immutable: true,
      setHeaders: (res, path, stat) => {
        if (path.includes('sw.js')) {
          res.setHeader('Service-Worker-Allowed', '/mail');
        }
      }
    })
  );

  app.use('/', (req, res) => {
    if (req.path === '/') return res.redirect('/mail');
    res.sendFile(`${DIST_PATH}/index.html`);
  });

  app.listen(port, () => {
    console.log(`React dist server listening on port ${port}`);
  });
};

main();
