// Wrapper cross-shell para invocar gradlew dentro de android/.
// El script npm "cd android && gradlew.bat" falla en Git Bash en Windows
// porque el shell mezcla cmd con bash. Usamos Node como shell neutral.
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { existsSync } from "node:fs";

const task = process.argv[2] || "assembleDebug";
const isWin = process.platform === "win32";
const cwd = resolve(process.cwd(), "android");

if (!existsSync(cwd)) {
  console.error("[gradle-android] android/ no existe. Corré primero: npx cap add android");
  process.exit(1);
}

const cmd = isWin ? "gradlew.bat" : "./gradlew";
console.log(`📦 [gradle-android] Ejecutando ${cmd} ${task} en ${cwd}`);

const result = spawnSync(cmd, [task], {
  cwd,
  stdio: "inherit",
  shell: true,
  env: process.env,
});

process.exit(result.status ?? 0);
