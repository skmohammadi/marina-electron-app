const { app, BrowserWindow, ipcMain } = require("electron");

const path = require("path");
const { createServer, port } = require("./server");
const EAU = require("electron-asar-hot-updater");

const ASSETS_DIR = path.join(__dirname, "assets");

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
        sendMessage("change-loading-status", "on");
        console.log("mainWindow");
        if (typeof app.online !== 'undefined' && app.online === false) {
            showDialog();
        }
        if (dialogWindow.ready) showDialog();
    });

    if (dialogWindow) {
        dialogWindow.webContents.on("dom-ready", () => {
            mainWindow.webContents.send('set-dialog-visibility', true);
            dialogWindow.ready = true;
            mainWindow.isVisible() && showDialog();
        });
    }
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
    mainWindow.webContents.send('set-dialog-visibility', false);
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

ipcMain.on('app-confirm-exit', event => {
    dialogWindow.data = {
        title: "exit now?",
        message: "Are you sure to exit app?",
        actions: [{
                id: "exit",
                label: "EXIT",
                callback: "quit"
            },
            {
                id: "cancel",
                label: "CANCEL",
                callback: "close-dialog"
            }
        ]
    };

    dialogWindow.loadFile(path.join(ASSETS_DIR, "htmls", "dialog.html"));

})

ipcMain.on("app-is-offline", event => {
    console.log("app-is-offline");

    app.online = false;
    initConnectionLostDialog();
});

ipcMain.on("app-close-dialog", event => {
    dialogWindow.hide();
    mainWindow.webContents.send('set-dialog-visibility', false);
});

function createMainWindow() {
    mainWindow = new BrowserWindow({
        icon: path.join(ASSETS_DIR, "images", "marina-icon.ico"),
        width: 1280,
        minWidth: 1280,
        height: 720,
        minHeight: 720,
        hasShadow: true,
        resizable: false,
        frame: false,
        thickFrame: true,
        backgroundColor: "#31053b",
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            webviewTag: true,
            nodeIntegration: true,
            devTools: process.env.NODE_ENV === "development"
        },
        show: false
    });

    mainWindow.loadFile(path.join(ASSETS_DIR, "htmls", "index.html"));

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
        width: 360,
        height: 140,
        resizable: false,
        frame: false,
        show: false,
        transparent: true,
        skipTaskbar: true,
        parent: mainWindow,
        useContentSize: true,
        center: false,
        paintWhenInitiallyHidden: false,
        modal: true,
        webPreferences: {
            nodeIntegration: true
        }
    });
}

function showDialog() {
    dialogWindow.show();
    dialogWindow.webContents.send("set-dialog-data", dialogWindow.data);
    mainWindow.webContents.send('set-dialog-visibility', true);
}

function sendMessage(event, data) {
    mainWindow.webContents.send(event, data);
}

function initConnectionLostDialog() {
    dialogWindow.data = {
        title: "Connection Lost ...",
        message: "Check your internet connection and try again",
        actions: [{
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
}

function initUpdateDialog() {
    if (!dialogWindow.data) {
        dialogWindow.data = {
            title: "New update released!",
            message: "To get new update click on Download:",
            actions: [{
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

function checkForUpdate() {
    EAU.init({
        api: `http://127.0.0.1:${port}`, // The API EAU will talk to
        server: false, // Where to check. true: server side, false: client side, default: true.
        debug: true // Default: false.
    });

    EAU.check(function(error, last, body) {
        if (error) {
            if (error === "no_update_available") {
                mainWindow.webContents.send('show-webview');
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

        EAU.progress(function(state) {
            let percent = parseInt(parseFloat(state.percent) * 100);
            let message = `Downloading updates... ${percent}%`;
            dialogWindow.webContents.send("update-dialog-message", message);
        });
    });

    ipcMain.on("app-download-update", event => {
        EAU.download(function(error) {
            let message = `Downloading updates... 100%`;
            dialogWindow.webContents.send("update-dialog-message", message);

            if (error) {
                dialog.showErrorBox("error", error);
                return false;
            }
            // restartApp();
            setTimeout(function() {
                app.exit(0);
            }, 2000);
        });
    });
}

function quitApp() {
    if (process.platform !== "darwin") app.quit();
}

function restartApp() {
    app.relaunch();
    app.exit(0);
}
