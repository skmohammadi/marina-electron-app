// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.


const { remote, ipcRenderer } = require('electron')
const hasInternet =  typeof window.hasInternet === 'undefined' ? true : window.hasInternet;

document.getElementById('close').addEventListener('click', closeWindow);
document.getElementById('minimize').addEventListener('click', minimizeWindow);

function closeWindow() {
  var window = remote.getCurrentWindow()
  window.close()
}

function minimizeWindow() {
  var window = remote.getCurrentWindow()
  window.minimize()
}

const updateOnlineStatus = () => { 
  ipcRenderer.send('online-status-changed', navigator.onLine && hasInternet ? 'online' : 'offline')
}

window.addEventListener('online',  updateOnlineStatus)
window.addEventListener('offline',  updateOnlineStatus)

updateOnlineStatus()