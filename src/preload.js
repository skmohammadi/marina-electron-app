// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
const { ipcRenderer } = require('electron')
const dns = require("dns");

function liveCheck() {
  dns.resolve("www.google.com", function(err, addr) {
    if (err) {
      console.log('liveCheck');
      
      window.hasInternet = false;
      ipcRenderer.send('app-is-offline');
    }
    else {
      ipcRenderer.send('app-is-online');
    }
  });
}

liveCheck();

window.addEventListener("DOMContentLoaded", () => {

  const webview = document.getElementById("webview");

  const loadstart = () => {
    document.body.classList.add('loading')
  };

  const loadstop = () => {
    document.body.className = document.body.className.replace("loading","");
  };

  webview.addEventListener("did-start-loading", loadstart);
  webview.addEventListener("did-stop-loading", loadstop);
});


