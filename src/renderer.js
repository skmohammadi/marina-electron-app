// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.


const { remote, ipcRenderer } = require('electron')
const dns = require("dns");
const path = require("path");
const configPath = path.join(__dirname, '..', '..', 'update-config.json');
let updateConfig = require(configPath);

const hasInternet = () => typeof window.hasInternet === 'undefined' ? true : window.hasInternet;

const mainWindowsBtnClose = document.getElementById('close')
const mainWindowsBtnMinimize = document.getElementById('minimize')
if (mainWindowsBtnClose) mainWindowsBtnClose.addEventListener('click', closeWindow);
if (mainWindowsBtnMinimize) mainWindowsBtnMinimize.addEventListener('click', minimizeWindow);

function closeWindow() {
  ipcRenderer.send('app-confirm-exit');
}

function minimizeWindow() {
  var window = remote.getCurrentWindow()
  window.minimize()
}

const updateOnlineStatus = () => {
  ipcRenderer.send('online-status-changed', navigator.onLine && hasInternet() ? 'online' : 'offline')
}

window.addEventListener('online', updateOnlineStatus)
window.addEventListener('offline', updateOnlineStatus)

updateOnlineStatus()

ipcRenderer.on('change-loading-status', (event, status) => {
  if (status == 'on') {
    document.body.classList.add('loading')
  }
  else {
    document.body.className = document.body.className.replace("loading", "");
  }
})

let lastMsgId = 0

window.quitAndInstall = function () {
  electron.remote.autoUpdater.quitAndInstall()
}

let webview;
function showWebview() {
  if (typeof webview === 'undefined') {
    webview = document.getElementById("webview");
    let url = 'https://google.com'
    if (updateConfig.last_server) {

      const url_obj = new URL(updateConfig.last_server)
      url = url_obj.protocol + '//' + url_obj.host
    }
    webview.src = url;
  }

  const loadstart = () => {
    document.body.classList.add('loading')
  };

  const loadstop = () => {
    if (document.body.classList.contains('splash-loading')) {
        document.body.classList.remove('splash-loading')
    }

    document.body.classList.remove('loading')
  };

  webview.addEventListener("did-start-loading", loadstart);
  webview.addEventListener("did-stop-loading", loadstop);
}

ipcRenderer.on('message', (event, data) => {
  showMessage(data.msg, data.hide, data.replaceAll)
})

ipcRenderer.on('set-dialog-visibility', (event, isVisible = false) => {
  if (isVisible) {
    document.body.classList.add('dialog-shown');
  }
  else {
    document.body.classList.remove('dialog-shown')
    showWebview();
  }
})

ipcRenderer.on('show-webview', event => {
  showWebview();
})

function showMessage(message, hide = true, replaceAll = false) {
  const messagesContainer = document.querySelector('.messages-container')
  const msgId = lastMsgId++ + 1
  const msgTemplate = `<div id="${msgId}" class="alert alert-info alert-info-message animated fadeIn">${message}</div>`

  if (replaceAll) {
    messagesContainer.innerHTML = msgTemplate
  } else {
    messagesContainer.insertAdjacentHTML('afterbegin', msgTemplate)
  }

  if (hide) {
    setTimeout(() => {
      const msgEl = document.getElementById(msgId)
      msgEl.classList.remove('fadeIn')
      msgEl.classList.add('fadeOut')
    }, 4000)
  }
}

const resolveDNS = () => {
  let status = ''
  dns.resolve("www.google.com", (err, addr) => {
    status = err ? 'offline' : 'online'
    ipcRenderer.send(`app-is-${status}`)
  })
}

ipcRenderer.on('check-connection', (event) => {
  setTimeout(() => {
    resolveDNS()
  }, 3000)
})