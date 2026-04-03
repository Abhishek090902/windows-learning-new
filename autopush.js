import { exec } from "child_process";
import chokidar from "chokidar";

const run = (cmd) => {
  return new Promise((resolve, reject) => {
    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        console.log("❌", stderr);
        reject(err);
      } else {
        console.log("✅", stdout);
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

  console.log("\n🚀 Auto Sync Started...\n");

  try {
    // 🔥 ALWAYS PULL FIRST (IMPORTANT)
    await run("git pull origin main --rebase");

    // Add & commit
    await run("git add .");

    const message = `🚀 Auto-update: ${new Date().toLocaleString()}`;
    await run(`git commit -m "${message}" || echo "No changes to commit"`);

    // Push
    await run("git push origin main");

    console.log("✅ Synced with GitHub\n");
  } catch (err) {
    console.log("⚠️ Sync failed, retry on next change...\n");
  }

  isRunning = false;
};

// 👀 Watch all files with debounce
chokidar.watch(".", {
  ignored: /node_modules|\.git/,
  persistent: true,
}).on("change", () => {
  clearTimeout(timeout);
  timeout = setTimeout(autoPush, 3000); // wait 3 sec
});

console.log("👀 Watching for changes...");
