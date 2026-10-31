# POS 360: marca

Logo oficial desde el 2026-10-31. Es parte del kit de POS 360, junto con los tokens y las piezas de
`src/app/theme/movil.css`. Hoja visual con todos los armados sobre cada fondo:
https://claude.ai/artifact/BdfAXwD85ZwAxB7q8pRLnT

## El logo

El isotipo (carrito blanco dentro de un cuadrado redondeado celeste) y "POS 360" en la letra
cuadrada de la marca. Está redibujado en vector sobre el logo original: el mismo carrito y las mismas
letras, con un solo grosor de trazo y una sola esquina para todas.

El archivo viejo (`1777400527242-60fdb9fd89279d42.webp`, carrito suelto y texto en dos renglones) ya
no se usa en pantallas nuevas.

## Armados

| Forma | Cuándo |
|---|---|
| `linea` | **El oficial.** Encabezados, tarjeta de ingreso, barra de la app, facturas, mails. |
| `apilado` | Lugares cuadrados: pantalla de carga, portada de un PDF, cartelería. |
| `isotipo` | Donde el texto no se lee: ícono de la APK, favicon, avatar en redes. |

## Colores por fondo

| Fondo | Cuadrado | Carrito | Texto |
|---|---|---|---|
| `claro` (blanco, gris del kit) | `#1488d1` | blanco | navy `#121e47` (en la app sigue a `--m-tinta`, así acompaña al tema oscuro) |
| `banda` (azul de marca, fotos oscuras) | blanco | `#0f6fae` | blanco |
| `oscuro` (solo archivo; en la app lo resuelve `claro`) | `#1488d1` | blanco | `#e6e7eb` |
| `mono` (impresión a un color) | navy `#121e47` | blanco | navy `#121e47` |

No se recolorea con otros tonos ni se le agregan sombras, contornos o degradés.

## Cómo usarlo

En la app, el componente:

```vue
<MarcaPos360 />                                  <!-- en una línea, fondo claro -->
<MarcaPos360 forma="apilado" />
<MarcaPos360 forma="isotipo" fondo="banda" />
```

`import MarcaPos360 from "@/app/components/MarcaPos360.vue"`. Toma el alto del contenedor (`height`),
el ancho sale solo. Alto mínimo del armado en línea: 28 px; por debajo, usar el isotipo.

Fuera de la app (documentos, redes, imprenta), los archivos de `src/app/theme/marca/`:
`pos360-<forma>-<fondo>.svg`, con `forma` en `linea`, `apilado`, `isotipo` y `fondo` en `claro`,
`banda`, `oscuro`, `mono` (el isotipo no tiene versión `oscuro`: es igual a `claro`).

## Firma

La empresa firma como "San Juan Sistemas", con enlace a https://sanjuansistemas.com/. En el ingreso va
como pie: "© {año} San Juan Sistemas. Todos los derechos reservados."
