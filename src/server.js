const express = require("express");
const axios = require("axios");
const URL = require("url").URL;
const fs = require('fs');

const configPath = './'
let updateConfig = require(configPath);

console.log(updateConfig.last_server);



const port = 3000;

// const repositoryUpdateURL = "http://localhost:8887";
const updateServerListURL = updateConfig.servers_json_url;

const saveLastServer = (url) => {
  updateConfig.last_server = url;

  fs.writeFileSync('student-2.json', data);
}

const isValidUpdateInfo = (updateInfoObject) => {
  var keys = ["name", "version", "asar"];
  if (keys.every(function (x) { return x in updateInfoObject; })) return true;
  return false;
}

const isValidURL = (s) => {
  try {
    new URL(s);
    return true;
  } catch (err) {
    return false;
  }
};

const getAvailableServer = () => {
  return new Promise(async (resolve, reject) => {
    // check last server locally
    const last_server = updateConfig.last_server;
    if (isValidURL(last_server)) {
      console.log('check last server');
      
      const updateInfoURL = `${last_server}/update-${process.platform}.json`;
      const response = await axios.get(updateInfoURL);
      if (isValidUpdateInfo(response.data)) {
        resolve(url)
      }
    }

    const response = await axios.get(updateServerListURL);
    const servers = Object.values(eval('temp = ' + response.data));

    servers.forEach(async (url) => {
      if (isValidURL(url)) {
        const updateInfoURL = `${url}/update-${process.platform}.json`;
        try {
          const response = await axios.get(updateInfoURL);
          if (isValidUpdateInfo(response.data)) {
            saveLastServer(url);
            resolve(url)
          }

        } catch (err) {
          console.log(`Not Found: ${updateInfoURL}`);
        }
      }
    });
  }).catch (err => {
    console.log(['getAvailableServer', err]);
    reject()
  })

}
const getUpdateInfo = async () => {
  try {
    const update_server = await getAvailableServer();
    const updateInfoURL = update_server + '/' + `update-${process.platform}.json`;
    const response = await axios.get(updateInfoURL)

    return {updateInfo: response.data, update_server: update_server};
  } catch (err) {
    throw err
  }
};

module.exports = {
  port: port,

  createServer: (app) => {
    const server = express()

    server.post("/", async (req, res) => {
      const {updateInfo, update_server} = await getUpdateInfo();

      if (Object.keys(updateInfo).length > 0) {
        const asarURL = `${update_server}/${updateInfo.asar}`;

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
      }

    });
    server.listen(port, () =>
      console.log(`Marina app update server listening on port ${port}`)
    );
  }
};
