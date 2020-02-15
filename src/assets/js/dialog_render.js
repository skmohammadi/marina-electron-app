const { ipcRenderer } = require("electron");

const dialogWindowTitle = document.getElementById("dialog-title");
const dialogWindowMessage = document.getElementById("dialog-message");
const dialogWindowActions = document.querySelector(".dialog-actions");

// Send signal to main app
function sendSignal(event) {
  ipcRenderer.send("app-" + event);
}

ipcRenderer.on("set-dialog-data", (event, data) => {

  if (dialogWindowTitle) dialogWindowTitle.innerText = data.title;
  if (dialogWindowMessage) dialogWindowMessage.innerText = data.message;
  
  // Build actions elements and then register click listener
  dialogWindowActions.innerHTML = ''
  data.actions.map((action, index) => {
    dialogWindowActions.insertAdjacentHTML(
      "beforeend",
      '<div><span class="dialog-action-btn" id="' +
        action.id +
        '">' +
        action.label +
        "</span></div>"
    );
    const action_var = "action_" + (index + 1);
    window[action_var] = document.getElementById(action.id);
    window[action_var].addEventListener("click", function() { sendSignal(action.callback) });
  });

});


ipcRenderer.on('update-dialog-message', (event, message) => {
  if (dialogWindowMessage) dialogWindowMessage.innerText = message;
})