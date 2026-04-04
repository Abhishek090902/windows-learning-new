import { exec } from "child_process";
import chokidar from "chokidar";

const run = (cmd) => {
  return new Promise((resolve, reject) => {
    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        console.log("ERROR", stderr);
        reject(err);
      } else {
        console.log("OK", stdout);
        resolve(stdout);
      }
    });
  });
};

let isRunning = false;
let timeout;

const autoPush = async () => {
  if (isRunning) return;
  isRunning = true;

  console.log("\nAuto Sync Started...\n");

  try {
    await run("git pull origin main --rebase");
    await run("git add .");

    const message = `Auto-update: ${new Date().toLocaleString()}`;

    try {
      await run(`git commit -m "${message}"`);
    } catch {
      console.log("No changes to commit");
    }

    await run("git push origin main");
    console.log("Synced with GitHub\n");
  } catch {
    console.log("Sync failed, retry on next change...\n");
  }

  isRunning = false;
};

chokidar
  .watch(".", {
    ignored: /node_modules|\.git/,
    persistent: true,
  })
  .on("change", () => {
    clearTimeout(timeout);
    timeout = setTimeout(autoPush, 3000);
  });

console.log("Watching for changes...");
