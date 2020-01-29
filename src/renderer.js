// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.


const { remote, ipcRenderer } = require('electron')
const dns = require("dns");

const hasInternet = () => typeof window.hasInternet === 'undefined' ? true : window.hasInternet;

const mainWindowsBtnClose = document.getElementById('close')
const mainWindowsBtnMinimize = document.getElementById('minimize')
if (mainWindowsBtnClose) mainWindowsBtnClose.addEventListener('click', closeWindow);
if (mainWindowsBtnMinimize) mainWindowsBtnMinimize.addEventListener('click', minimizeWindow);

function closeWindow() {
  var window = remote.getCurrentWindow()
  window.close()
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
    document.body.className = document.body.className.replace("loading","");
  }
})

let lastMsgId = 0

window.quitAndInstall = function () {
  electron.remote.autoUpdater.quitAndInstall()
}

ipcRenderer.on('console', (event, consoleMsg) => {
  console.log(consoleMsg)
})

ipcRenderer.on('message', (event, data) => {
  showMessage(data.msg, data.hide, data.replaceAll)
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
    status = err ? 'offline': 'online'
    console.log({status});
    
    ipcRenderer.send(`app-is-${status}`)
  })
}

ipcRenderer.on('check-connection', (event) => {
  setTimeout(()=> {

    resolveDNS()
  }, 3000)
})