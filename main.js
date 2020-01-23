// Modules to control application life and create native browser window
const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const path = require("path");

const ASSETS_DIR = path.join(__dirname, "assets");

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let splashWindow;
let errorWindow;
let onlineStatusWindow;

function createMainWindow() {
  // Create the browser window.
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
      nodeIntegration: true,
      devTools: true
    },
    show: false
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(ASSETS_DIR, "htmls", "index.html"));

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on("closed", function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    console.log("closed");

    mainWindow = null;
  });
}

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 400,
    height: 300,
    transparent: true,
    // backgroundColor: "#E6fdf4ff",
    frame: false,
    // alwaysOnTop: true,
    movable: false
    // webPreferences: {
    // preload: path.join(__dirname, 'preload.js'),
    // nodeIntegration: true,
    // }
  });

  splashWindow.loadFile(path.join(ASSETS_DIR, "htmls", "splash.html"));
}

function createErrorWindow() {
  errorWindow = new BrowserWindow({
    width: 500,
    height: 310,
    resizable: false,
    frame: false,
    show: false,
    transparent: true,
    skipTaskbar: true,
    parent: mainWindow
    // modal:true
  });

  errorWindow.loadFile(path.join(ASSETS_DIR, "htmls", "Error_01.html"));

}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", () => {
  createSplashWindow();
  createMainWindow();
  // createErrorWindow();

  mainWindow.once("ready-to-show", () => {
    setTimeout(() => {
      splashWindow.destroy();
      mainWindow.show();
    }, 3000);
  });

  mainWindow.on('show', () => {    
    if (errorWindow) {
      errorWindow.show()
    }
  })
});

// Quit when all windows are closed.
app.on("window-all-closed", function() {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") app.quit();
});

ipcMain.on("online-status-changed", (event, status) => {
  // mainWindow.on('show', () => {
    if (status == "offline") {
      
      createErrorWindow();
      // console.log(
      //   dialog.showMessageBox({
      //     title: "Network status",
      //     message: "ERROR 01",
      //     type: "error"
      //   })
      // );
    }
  // })

});

app.on("activate", function() {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
