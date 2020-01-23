// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.

const dns = require("dns");

function liveCheck() {
  dns.resolve("www.google.com", function(err, addr) {
    if (err) {      
      window.hasInternet = false;
    }
  });
}

// setInterval(function() {
//   liveCheck();
// }, 1000);




window.addEventListener("DOMContentLoaded", () => {
  liveCheck();
  let splash_statusbar = document.getElementById('status_bar');
  
  if (splash_statusbar && !isConnected) splash_statusbar.innerText = 'No internet connection is available :-(';

  const replaceText = (selector, text) => {
    const element = document.getElementById(selector);
    if (element) element.innerText = text;
  };

  for (const type of ["chrome", "node", "electron"]) {
    replaceText(`${type}-version`, process.versions[type]);
  }

  const webview = document.getElementById("webview");
  const indicator = document.querySelector(".indicator");
  const loadstart = () => {
    indicator.innerHTML =
      '<div class="content-loading"><div class="loading-spinner"></div></div>';
  };

  const loadstop = () => {
    document.body.className = document.body.className.replace("loading","");
    indicator.innerHTML = "";
  };

  webview.addEventListener("did-start-loading", loadstart);
  webview.addEventListener("did-stop-loading", loadstop);
});


