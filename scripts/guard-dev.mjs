#!/usr/bin/env node
import { execSync } from "node:child_process";
import { rmSync } from "node:fs";
import { connect } from "node:net";

function portBusy(port) {
  return new Promise((resolve) => {
    const socket = connect({ port, host: "localhost" });
    socket.setTimeout(1000);
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
    socket.once("timeout", () => {
      socket.destroy();
      resolve(false);
    });
  });
}

function nextDevRunning() {
  try {
    const out = execSync("pgrep -f '[n]ext dev|[n]ext-server' || true", {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
    return out
      .split("\n")
      .filter(Boolean)
      .some((pid) => Number(pid) !== process.pid);
  } catch {
    return false;
  }
}

const port = 3000;
const portHeld = await portBusy(port);
const processHeld = nextDevRunning();

if (portHeld || processHeld) {
  console.error(`✖ Port ${port} is already in use or a next server is running:
  port ${port} busy: ${portHeld}
  next dev/server process: ${processHeld}
Fix: stop the other server first, then re-run:
  pkill -f "next dev"   # or: lsof -i :${port}
`);
  process.exit(1);
}

rmSync(".next-dev", { recursive: true, force: true });
console.log(`✓ port ${port} free, .next-dev cleared`);
