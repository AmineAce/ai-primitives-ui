#!/usr/bin/env node
import { execSync, spawnSync } from "node:child_process";
import { connect } from "node:net";

const isTTY = Boolean(process.stdout.isTTY);
const esc = (code) => (text) => (isTTY ? `\x1b[${code}m${text}\x1b[0m` : text);
const bold = esc("1");
const dim = esc("2");
const green = esc("32");
const red = esc("31");
const gray = esc("90");

const LABEL_WIDTH = 9;

const STEPS = [
  { label: "format", purpose: "code style", args: ["format:check"] },
  { label: "lint", purpose: "eslint", args: ["lint"] },
  {
    label: "typecheck",
    purpose: "orb types",
    args: ["--filter", "@ai-primitives-ui/ui", "typecheck"],
  },
  {
    label: "test",
    purpose: "orb unit tests",
    args: ["--filter", "@ai-primitives-ui/ui", "test"],
  },
  {
    label: "gates",
    purpose: "publish readiness",
    args: ["--filter", "@ai-primitives-ui/ui", "gates"],
  },
  { label: "build", purpose: "production export", args: ["build"] },
];

const bin = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

function commandOf(step) {
  return `pnpm ${step.args.join(" ")}`;
}

async function devServerRunning() {
  const portBusy = await new Promise((resolve) => {
    const socket = connect({ port: 3000, host: "localhost" });
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
  let procAlive = false;
  try {
    const out = execSync("pgrep -f '[n]ext dev|[n]ext-server' || true", {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
    procAlive = out
      .split("\n")
      .filter(Boolean)
      .some((pid) => Number(pid) !== process.pid);
  } catch {}
  return portBusy || procAlive;
}

if (await devServerRunning()) {
  console.error(
    `${red("✖")} Dev server is running on :3000 (or a next process is alive).\n` +
      `    Stop it before running check:\n` +
      `      pkill -f "next dev"   # or: lsof -i :3000\n`,
  );
  process.exit(1);
}

console.log(
  `${bold("pnpm check")} — ${STEPS.map((s) => s.label).join(" · ")}\n`,
);

const results = [];
const started = process.hrtime.bigint();

for (const step of STEPS) {
  console.log(
    `${dim("▸")} ${bold(step.label.padEnd(LABEL_WIDTH))} ${gray(step.purpose)}   ${dim(commandOf(step))}`,
  );
  const run = spawnSync(bin, step.args, { stdio: "inherit" });
  const ok = run.status === 0;
  results.push({ label: step.label, purpose: step.purpose, ok });
  if (!ok) {
    const code = run.status ?? 1;
    console.log(
      `\n${red("✖")} ${bold(step.label)} ${red("failed")} (exit ${code}) — see output above`,
    );
    console.log(`${dim(`rerun: ${commandOf(step)}`)}\n`);
    process.exit(code);
  }
}

const elapsed = (Number(process.hrtime.bigint() - started) / 1e9).toFixed(1);

console.log(`\n${dim("──────────────────────────────────────────────")}`);
for (const step of results) {
  console.log(
    `  ${green("✓")} ${bold(step.label.padEnd(LABEL_WIDTH))} ${dim(step.purpose)}`,
  );
}
console.log(`${dim("──────────────────────────────────────────────")}`);
console.log(
  `${green(bold(`  All ${results.length} checks passed in ${elapsed}s`))}\n`,
);
