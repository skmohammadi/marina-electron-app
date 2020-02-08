const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { createServer, port } = require("./server");

const EAU = require("electron-asar-hot-updater");

const ASSETS_DIR = path.join(__dirname, "assets");

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let splashWindow;
let dialogWindow;

app.on("ready", () => {
  app.server = createServer(app);
  console.log("app is ready");

  createSplashWindow();
  createMainWindow();
  createDialogWindow();

  setTimeout(() => {
    splashWindow.destroy();
    mainWindow.show();
  }, 3000);

  mainWindow.on("show", () => {
    console.log("mainWindow");

    if (!app.online) {
      showDialog();
    }
  });

  dialogWindow.webContents.on("dom-ready", () => {
    mainWindow.isVisible() && showDialog();
  });

  // dialogWindow.on('ready-to-show', () => {
  //   console.log('dialogWindow is ready');

  //   mainWindow.isVisible() && showDialog()
  // });
});

// Quit when all windows are closed.
app.on("window-all-closed", function() {
  quitApp();
});

app.on("activate", function() {
  if (mainWindow === null) createWindow();
});

app.respondToClient = req => {
  return "Hello, UpdateServer";
};

/*************************************************
 ***************** IPC Main Events ***************
 *************************************************/

ipcMain.on("app-quit", quitApp);
ipcMain.on("app-restart", restartApp);
ipcMain.on("app-check-network", () => {
  dialogWindow.hide();
  sendMessage("change-loading-status", "on");
  sendMessage("check-connection");
});
ipcMain.on("app-is-online", event => {
  console.log("app-is-online");
  if (app.online === false) {
    app.online = true;
    mainWindow.reload();
  } else {
    checkForUpdate();
  }
});
ipcMain.on("app-is-offline", event => {
  console.log("app-is-offline");

  app.online = false;
  initConnectionLostDialog();

  // if (dialogWindow.data && mainWindow.isVisible()) {
  //   showDialog();
  // }
});
ipcMain.on("app-close-dialog", event => {
  dialogWindow.destroy();
});

function createMainWindow() {
  mainWindow = new BrowserWindow({
    icon: path.join(ASSETS_DIR, "images", "marina-icon.ico"),
    width: 1000,
    minWidth: 1000,
    height: 700,
    minHeight: 700,
    hasShadow: true,
    resizable: false,
    frame: false,
    thickFrame: true,
    backgroundColor: "#31053b",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      webviewTag: true,
      nodeIntegration: true
      // devTools: false
    },
    show: false
  });

  mainWindow.loadFile(path.join(ASSETS_DIR, "htmls", "index.html"));

  // Open the DevTools.
  if (process.env.NODE_ENV === "development") {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on("closed", function() {
    console.log("mainWindow: closed");
    mainWindow = null;
  });
}

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 400,
    height: 300,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    movable: false
  });

  splashWindow.loadFile(path.join(ASSETS_DIR, "htmls", "splash.html"));
}

function createDialogWindow() {
  dialogWindow = new BrowserWindow({
    width: 450,
    height: 310,
    resizable: false,
    frame: false,
    show: false,
    transparent: true,
    skipTaskbar: true,
    parent: mainWindow,
    useContentSize: true,
    center: false,
    // modal: true,
    webPreferences: {
      nodeIntegration: true
    }
  });
}

function showDialog() {
  sendMessage("change-loading-status", "off");

  dialogWindow.show();
  dialogWindow.webContents.send("set-dialog-data", dialogWindow.data);
}

function sendMessage(event, data) {
  mainWindow.webContents.send(event, data);
}

function initConnectionLostDialog() {
  // if (!dialogWindow.data) {
  dialogWindow.data = {
    title: "Connection Lost ...",
    message: "Check your internet connection and try again",
    actions: [
      {
        id: "retry",
        label: "RETRY",
        callback: "check-network"
      },
      {
        id: "exit",
        label: "EXIT",
        callback: "quit"
      }
    ]
  };
  dialogWindow.loadFile(path.join(ASSETS_DIR, "htmls", "dialog.html"));
  // }
}

function initUpdateDialog() {
  if (!dialogWindow.data) {
    dialogWindow.data = {
      title: "New update released!",
      message: "To get new update click on Download:",
      actions: [
        {
          id: "download",
          label: "DOWNLOAD",
          callback: "download-update"
        },
        {
          id: "cancel",
          label: "CANCEL",
          callback: "close-dialog"
        }
      ]
    };
    dialogWindow.loadFile(path.join(ASSETS_DIR, "htmls", "dialog.html"));
  }
}

function quitApp() {
  if (process.platform !== "darwin") app.quit();
}

function restartApp() {
  app.relaunch();
  app.exit(0);
}

function checkForUpdate() {
  EAU.init({
    api: `http://127.0.0.1:${port}`, // The API EAU will talk to
    server: false, // Where to check. true: server side, false: client side, default: true.
    debug: true // Default: false.
  });

  EAU.check(function(error, last, body) {
    if (error) {
      if (error === "no_update_available") {
        return false;
      }
      if (
        error === "version_not_specified" &&
        process.env.NODE_ENV === "development"
      ) {
        return false;
      } // Don't worry about this error when developing
      return false;
    }

    initUpdateDialog();
  });

  ipcMain.on("app-download-update", event => {
    EAU.progress(function(state) {
      console.log(state);
    });

    EAU.download(function(error) {
      if (error) {
        dialog.showErrorBox("error", error);
        return false;
      }
      restartApp();
    });
  });
}
