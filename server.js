const express = require("express");
const request = require("request");

const port = 9999;
const repositoryUpdateURL =
  "https://gitlab.com/skmohammadi/marina-electron-app/-/jobs/artifacts/master/raw/update";
const updateInfoURL = `${repositoryUpdateURL}/update-${process.platform}.json?job=build`;
console.log({updateInfoURL});


const getUpdateInfo = () => {
  request({url: updateInfoURL, json: true}, (err, res, body) => {
    if (err) {
      throw err;
    }
    return body;
  });
};

module.exports = {
  port: port,

  createServer: app => {
    const server = express();
    const updateInfo = getUpdateInfo();
    console.log({updateInfo});
    
    const asarURL = `${repositoryUpdateURL}/${updateInfo.asar}`;

    server.post("/", (req, res) => {
      res.write(
        JSON.stringify({
          name: updateInfo.name,
          version: updateInfo.version,
          asar: asarURL,
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
