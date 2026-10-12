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

// En Linux/Mac se llama con `sh`: el repo tiene core.fileMode=false y gradlew
// puede llegar sin permiso de ejecucion ("./gradlew: Permission denied").
const cmd = isWin ? "gradlew.bat" : "sh ./gradlew";

// Gradle de Capacitor 8 necesita JDK 21. En la maquina de desarrollo el JDK
// del sistema es otro (26) y el plugin de Android no trabaja con el: si no
// vino JAVA_HOME, se usa el JDK 21 del toolchain movil (orchestrator/METODO-MOVIL.md).
const home = process.env.HOME || "";
const JDK21 = resolve(home, "development/jdk-21.0.12+8");
if (!process.env.JAVA_HOME && existsSync(JDK21)) process.env.JAVA_HOME = JDK21;
const SDK = resolve(home, "Android/Sdk");
if (!process.env.ANDROID_HOME && existsSync(SDK)) process.env.ANDROID_HOME = SDK;
console.log(`📦 [gradle-android] Ejecutando ${cmd} ${task} en ${cwd}`);

const result = spawnSync(cmd, [task], {
  cwd,
  stdio: "inherit",
  shell: true,
  env: process.env,
});

process.exit(result.status ?? 0);
