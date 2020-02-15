const express = require("express");
const axios = require("axios");

const port = 3000;
// const repositoryUpdateURL = "https://gitlab.com/skmohammadi/marina-electron-app/-/jobs/artifacts/master/raw/update";
// const repositoryUpdateURL = "http://localhost:8887";
const repositoryUpdateURL = 'http://104.237.232.204:5000/updates';
// const updateInfoURL = `${repositoryUpdateURL}/update-${process.platform}.json?job=build`;
const updateInfoURL = `${repositoryUpdateURL}/update-${process.platform}.json`;

const getUpdateInfo = async () => {
  try {
    const response = await axios.get(updateInfoURL)
    return response.data
  } catch (err) {
    throw err
  }
};

module.exports = {
  port: port,

  createServer: (app) => {
    const server = express()

    server.post("/", async (req, res) => {
      const updateInfo = await getUpdateInfo();
      console.log({updateInfo});
      
      const asarURL = `${repositoryUpdateURL}/${updateInfo.asar}`;      
  
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
