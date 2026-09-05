const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "src");
const EXTS = [".ts", ".tsx"];

function listarArchivos(dir, acc = []) {
  for (const entrada of fs.readdirSync(dir, { withFileTypes: true })) {
    const ruta = path.join(dir, entrada.name);
    if (entrada.isDirectory()) listarArchivos(ruta, acc);
    else if (EXTS.includes(path.extname(entrada.name))) acc.push(ruta);
  }
  return acc;
}

const IMPORT_RE = /(?:from|import)\s+["']([^"']+)["']/g;

let problemas = 0;
for (const archivo of listarArchivos(SRC)) {
  const contenido = fs.readFileSync(archivo, "utf-8");
  let m;
  while ((m = IMPORT_RE.exec(contenido))) {
    let importado = m[1];
    if (!importado.startsWith(".") && !importado.startsWith("@/")) continue;
    let rutaAbsoluta;
    if (importado.startsWith("@/")) {
      rutaAbsoluta = path.join(SRC, importado.slice(2));
    } else {
      rutaAbsoluta = path.resolve(path.dirname(archivo), importado);
    }

    // Probamos con cada extensión posible (o directorio con index).
    const candidatos = [
      rutaAbsoluta,
      rutaAbsoluta + ".ts",
      rutaAbsoluta + ".tsx",
      path.join(rutaAbsoluta, "index.ts"),
      path.join(rutaAbsoluta, "index.tsx"),
    ];

    let resuelto = null;
    for (const candidato of candidatos) {
      if (fs.existsSync(candidato) && fs.statSync(candidato).isFile()) {
        resuelto = candidato;
        break;
      }
    }
    if (!resuelto) continue; // node_modules u otra cosa, no nos interesa

    // Ahora comparamos, segmento por segmento, el casing real en disco contra el
    // casing que se usó en el import.
    const partes = path.relative(SRC, resuelto).split(path.sep);
    let actual = SRC;
    for (const parte of partes) {
      const entradasReales = fs.readdirSync(actual);
      const real = entradasReales.find((e) => e.toLowerCase() === parte.toLowerCase());
      if (real && real !== parte) {
        console.log(`CASING DISTINTO en ${path.relative(ROOT, archivo)}:`);
        console.log(`  import: "${importado}"`);
        console.log(`  en disco: "${real}" (vos escribiste "${parte}")`);
        problemas++;
      }
      actual = path.join(actual, real || parte);
    }
  }
}

console.log(problemas === 0 ? "\nSin problemas de casing." : `\n${problemas} problema(s) de casing encontrados.`);
process.exit(problemas === 0 ? 0 : 1);
