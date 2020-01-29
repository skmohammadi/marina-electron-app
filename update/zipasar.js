const AdmZip = require("adm-zip");
const path = require("path");
const fs = require("fs");
const zip = new AdmZip();

const source_asar_path = path.join(
  path.resolve(__dirname, ".."),
  "dist",
  `win-unpacked`,
  "resources",
  "app.asar"
);

fs.copyFile(source_asar_path, path.join(__dirname, "update.asar"), err => {
  if (err) throw err;
  // add local file
  zip.addLocalFile(path.join(__dirname, "update.asar"));
  // get everything as a buffer
  zip.toBuffer();
  // or write everything to disk
  zip.writeZip(path.join(__dirname, "update.zip"));
});
