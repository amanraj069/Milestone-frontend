import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendRoot = path.resolve(__dirname, "..");
const outputPath = path.join(frontendRoot, "test", "TEST_REPORT_FRONTEND.md");

function stripAnsi(text) {
  return text.replace(/\u001b\[[0-9;]*[A-Za-z]/g, "");
}

function runTests() {
  const startedAt = Date.now();
  const result = spawnSync("npm", ["test", "--", "--silent"], {
    cwd: frontendRoot,
    shell: true,
    encoding: "utf8",
  });

  return {
    exitCode: result.status,
    durationMs: Date.now() - startedAt,
    stdout: result.stdout || "",
    stderr: result.stderr || "",
    command: "npm test -- --silent",
  };
}

function parseSummary(output) {
  const lines = output.split(/\r?\n/).map((line) => line.trim());
  const patterns = [
    /^PASS\s+.+$/,
    /^FAIL\s+.+$/,
    /^Test Files\s+.+$/,
    /^Tests\s+.+$/,
    /^Duration\s+.+$/,
  ];

  return lines.filter((line) => patterns.some((pattern) => pattern.test(line)));
}

function buildReport(run) {
  const timestamp = new Date().toISOString();
  const merged = stripAnsi(`${run.stdout}\n${run.stderr}`);
  const summary = parseSummary(merged);
  const tail = merged.split(/\r?\n/).filter(Boolean).slice(-80).join("\n");
  const status = run.exitCode === 0 ? "PASS" : "FAIL";

  return [
    "# Frontend Test Report",
    "",
    `Generated at: ${timestamp}`,
    "",
    "## Run Details",
    `- Status: **${status}**`,
    `- Exit Code: ${run.exitCode}`,
    `- Duration: ${(run.durationMs / 1000).toFixed(2)}s`,
    `- Command: ${run.command}`,
    `- Working Directory: ${frontendRoot}`,
    "",
    "## Summary",
    ...(summary.length ? summary.map((line) => `- ${line}`) : ["- No summary lines captured"]),
    "",
    "## Output Tail",
    "```text",
    tail || "(no output)",
    "```",
    "",
  ].join("\n");
}

function main() {
  const run = runTests();
  const report = buildReport(run);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, report, "utf8");

  console.log(`Frontend report generated: ${outputPath}`);
  process.exit(run.exitCode === null ? 1 : run.exitCode);
}

main();
