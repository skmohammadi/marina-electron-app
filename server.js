const express = require("express");
const port = 9999;

module.exports = {
  port: port,

  createServer: app => {
    const server = express();
    server.post("/", (req, res) => {
      res.write(
        JSON.stringify({
          name: "app",
          version: "1.0.2",
          asar: "https://gitlab.com/skmohammadi/marina-electron-app/-/jobs/artifacts/master/raw/update/",
          // 'sha1': '203448645d8a32b9a08ca9a0eb88006f874d0c78', // Optional, If set, verify `asar` file legitimacy
          info: "1.fix bug 2.feat..."
        }).replace(/[\\/]/g, "\\/")
      );
      res.end();
    });
    server.listen(port, () =>
      console.log(`Marina app update server listening on port ${port}`)
    );
  }
};
