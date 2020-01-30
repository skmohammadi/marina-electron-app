const AdmZip = require("adm-zip");
const path = require("path");
const fs = require("fs");
const zip = new AdmZip();

const dist_path = path.join(path.resolve(__dirname, ".."), "dist");

fs.readdir(dist_path, (err, dirs) => {
  dirs.forEach(dir => {
    if (dir.indexOf("-unpacked") > 0) {
      const platform = dir.replace("-unpacked", "");
      let source_asar_path = path.join(
        dist_path,
        `${platform}-unpacked`,
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
        zip.writeZip(path.join(__dirname, `update-${platform}.zip`));
        // remove current update.asar file
        fs.unlinkSync(path.join(__dirname, "update.asar"))
      });
    }
  });
});


