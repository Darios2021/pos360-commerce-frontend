// Lista curada de tipografías de la marca. Cerrada: el id es el contrato y no
// se renombra. Copia idéntica en pos360-commerce-api (src/config/tipografiasMarca.json)
// y en contenido (src/motor/tipografias.json). Todas Google Fonts, OFL o Apache.
export const TIPOGRAFIAS_MARCA = [
  {"id": "archivo-condensada", "nombre": "Archivo condensada", "familia": "Archivo", "roles": ["titulares"], "peso": {"titulares": 900}, "ancho": "72%"},
  {"id": "archivo", "nombre": "Archivo", "familia": "Archivo", "roles": ["titulares"], "peso": {"titulares": 800}, "ancho": "100%"},
  {"id": "oswald", "nombre": "Oswald", "familia": "Oswald", "roles": ["titulares"], "peso": {"titulares": 700}},
  {"id": "barlow-condensed", "nombre": "Barlow Condensed", "familia": "Barlow Condensed", "roles": ["titulares"], "peso": {"titulares": 800}},
  {"id": "bebas-neue", "nombre": "Bebas Neue", "familia": "Bebas Neue", "roles": ["titulares"], "peso": {"titulares": 400}},
  {"id": "anton", "nombre": "Anton", "familia": "Anton", "roles": ["titulares"], "peso": {"titulares": 400}},
  {"id": "montserrat", "nombre": "Montserrat", "familia": "Montserrat", "roles": ["titulares"], "peso": {"titulares": 800}},
  {"id": "inter", "nombre": "Inter", "familia": "Inter", "roles": ["titulares", "texto"], "peso": {"titulares": 800, "texto": 500}},
  {"id": "roboto", "nombre": "Roboto", "familia": "Roboto", "roles": ["texto"], "peso": {"texto": 400}},
  {"id": "open-sans", "nombre": "Open Sans", "familia": "Open Sans", "roles": ["texto"], "peso": {"texto": 400}},
  {"id": "lato", "nombre": "Lato", "familia": "Lato", "roles": ["texto"], "peso": {"texto": 400}},
  {"id": "dm-sans", "nombre": "DM Sans", "familia": "DM Sans", "roles": ["texto"], "peso": {"texto": 400}},
  {"id": "nunito-sans", "nombre": "Nunito Sans", "familia": "Nunito Sans", "roles": ["texto"], "peso": {"texto": 400}},
];

export const TITULARES = TIPOGRAFIAS_MARCA.filter((t) => t.roles.includes("titulares"));
export const TEXTOS = TIPOGRAFIAS_MARCA.filter((t) => t.roles.includes("texto"));

// Estilo CSS de una tipografía en un rol.
export function estiloTipografia(id, rol) {
  const t = TIPOGRAFIAS_MARCA.find((x) => x.id === id) || TIPOGRAFIAS_MARCA.find((x) => x.id === "inter");
  return {
    fontFamily: `"${t.familia}", Inter, sans-serif`,
    fontWeight: t.peso[rol] || t.peso.titulares || t.peso.texto || 400,
    fontStretch: t.ancho || "100%",
  };
}

// Hoja de Google Fonts con todas las de la lista (solo la carga la vista Marca).
export const GOOGLE_FONTS_MARCA =
  "https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,800..900" +
  "&family=Oswald:wght@700&family=Barlow+Condensed:wght@800&family=Bebas+Neue&family=Anton" +
  "&family=Montserrat:wght@800&family=Inter:wght@500;800&family=Roboto:wght@400" +
  "&family=Open+Sans:wght@400&family=Lato:wght@400&family=DM+Sans:wght@400" +
  "&family=Nunito+Sans:wght@400&display=swap";
