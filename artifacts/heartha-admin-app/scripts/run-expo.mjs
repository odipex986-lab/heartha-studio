import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const localNodeModules = path.join(projectRoot, "node_modules");

const cliEntrypoint = path.join(localNodeModules, "expo", "bin", "cli");
const forwardedArgs = process.argv.slice(2);

const env = {
  ...process.env,
  NODE_PATH: process.env.NODE_PATH
    ? `${localNodeModules}${path.delimiter}${process.env.NODE_PATH}`
    : localNodeModules,
};

const child = spawn(process.execPath, [cliEntrypoint, ...forwardedArgs], {
  cwd: projectRoot,
  env,
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
