/* server/server.js */
import express from "express";
import compression from "compression";
import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.disable("x-powered-by");
app.use(compression());

const PORT = Number(process.env.PORT || 80);

// ✅ Tu API pública (la misma idea que VITE_API_BASE_URL pero en runtime)
const API_BASE_URL = String(process.env.API_BASE_URL || "").replace(/\/+$/, "");

// ✅ URL pública del sitio (para og:url)
const SITE_URL = String(process.env.SITE_URL || "https://sanjuantecnologia.com").replace(/\/+$/, "") + "/";

// ✅ Defaults (si API falla)
const DEFAULTS = {
  name: "San Juan Tecnología",
  desc: "San Juan Tecnología · Electrónica, ecommerce, sistemas POS y soluciones tecnológicas para empresas.",
  // si no tenés og-image fijo, podés poner el logo (no ideal pero funciona)
  ogImage: `${SITE_URL}og-image.jpg`,
  favicon: `${SITE_URL}favicon.ico`,
  appleIcon: `${SITE_URL}apple-touch-icon.png`,
};

const distDir = path.resolve(__dirname, "../dist");
const indexPath = path.join(distDir, "index.html");

let cachedIndexTemplate = "";
let cache = {
  value: null,
  exp: 0,
};

// Leemos el index template UNA vez
function readIndexTemplate() {
  if (!cachedIndexTemplate) {
    cachedIndexTemplate = fs.readFileSync(indexPath, "utf8");
  }
  return cachedIndexTemplate;
}

async function fetchBranding() {
  // cache 60s para no pegarle a la API a cada request
  const now = Date.now();
  if (cache.value && cache.exp > now) return cache.value;

  let out = {
    name: DEFAULTS.name,
    logo_url: "",
    favicon_url: DEFAULTS.favicon,
    updated_at: null,
  };

  if (API_BASE_URL) {
    try {
      const url = `${API_BASE_URL}/public/shop/branding`;
      const r = await axios.get(url, { timeout: 8000 });
      const it = r.data?.item || null;

      // ⚠️ tu frontend normaliza absUrl; acá asumimos que el backend ya devuelve URL absoluta
      // si devuelve relativa, lo arreglamos mínimo pegándola al host del API_BASE_URL.
      const abs = (u) => {
        const s = String(u || "").trim();
        if (!s) return "";
        if (/^https?:\/\//i.test(s)) return s;
        // relativo -> lo pegamos al origen del API_BASE_URL sin /api
        const origin = API_BASE_URL.replace(/\/api(\/v\d+)?$/i, "");
        return `${origin}${s.startsWith("/") ? "" : "/"}${s}`;
      };

      out = {
        name: String(it?.name || DEFAULTS.name),
        logo_url: it?.logo_url ? abs(it.logo_url) : "",
        favicon_url: it?.favicon_url ? abs(it.favicon_url) : DEFAULTS.favicon,
        updated_at: it?.updated_at || null,
      };
    } catch {
      // si falla, usamos defaults
    }
  }

  cache.value = out;
  cache.exp = now + 60_000;
  return out;
}

function inject(html, vars) {
  let out = html;
  for (const [k, v] of Object.entries(vars)) {
    out = out.split(k).join(String(v ?? ""));
  }
  return out;
}

// ✅ HTML dinámico SOLO para "/" (y para cualquier ruta SPA)
app.get(["/", "/shop", "/shop/*", "/auth/*", "/admin/*", "/pos/*", "/inventory/*", "/dashboard/*", "/categories/*", "/products/*", "/users/*", "/account/*"], async (req, res) => {
  const tpl = readIndexTemplate();
  const branding = await fetchBranding();

  // OG image: preferí logo si no existe og-image fijo
  // (ideal: crear un og-image 1200x630 y servirlo en /public/og-image.jpg)
  const ogImage = branding.logo_url || DEFAULTS.ogImage;

  const vars = {
    "__SHOP_TITLE__": `${branding.name} | Electrónica, POS y Soluciones`,
    "__SHOP_DESC__": DEFAULTS.desc,

    "__SHOP_SITE_NAME__": branding.name,
    "__SHOP_OG_TITLE__": branding.name,
    "__SHOP_OG_DESC__": DEFAULTS.desc,
    "__SHOP_URL__": SITE_URL,
    "__SHOP_OG_IMAGE__": ogImage,

    "__SHOP_FAVICON__": branding.favicon_url || DEFAULTS.favicon,
    "__SHOP_APPLE_ICON__": DEFAULTS.appleIcon,
  };

  const html = inject(tpl, vars);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache"); // importante para que cambie rápido cuando editás en /tienda
  return res.status(200).send(html);
});

// ✅ Static assets del dist (JS/CSS/imagenes)
app.use(express.static(distDir, {
  maxAge: "7d",
  etag: true,
  index: false,
}));

// ✅ Fallback SPA: cualquier otra ruta -> index dinámico
app.get("*", async (req, res) => {
  const tpl = readIndexTemplate();
  const branding = await fetchBranding();
  const ogImage = branding.logo_url || DEFAULTS.ogImage;

  const vars = {
    "__SHOP_TITLE__": `${branding.name} | Electrónica, POS y Soluciones`,
    "__SHOP_DESC__": DEFAULTS.desc,
    "__SHOP_SITE_NAME__": branding.name,
    "__SHOP_OG_TITLE__": branding.name,
    "__SHOP_OG_DESC__": DEFAULTS.desc,
    "__SHOP_URL__": SITE_URL,
    "__SHOP_OG_IMAGE__": ogImage,
    "__SHOP_FAVICON__": branding.favicon_url || DEFAULTS.favicon,
    "__SHOP_APPLE_ICON__": DEFAULTS.appleIcon,
  };

  const html = inject(tpl, vars);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  return res.status(200).send(html);
});

app.listen(PORT, () => {
  console.log(`[shop-ssr-lite] listening on :${PORT}`);
  console.log(`[shop-ssr-lite] API_BASE_URL=${API_BASE_URL || "(empty)"}`);
  console.log(`[shop-ssr-lite] SITE_URL=${SITE_URL}`);
});
