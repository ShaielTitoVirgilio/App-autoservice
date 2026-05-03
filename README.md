# App-autoservice — Kiosko Carrito del Paseo

Aplicación de kiosko de autoservicio (Electron) que comparte la misma base de
datos de Supabase con la **web-carrito** y el **chatbot-carrito**.

## Stack
- Electron 28
- Supabase (Postgres + Storage + Realtime)
- HTML / CSS / JS vanilla

## Configuración inicial

1. Instalá dependencias:
   ```bash
   npm install
   ```

2. Verificá que `.env` exista en la raíz con estas dos variables:
   ```
   Vite_supabase_anon_key=<anon key>
   vite_supabase_key=https://<project>.supabase.co
   ```
   El archivo está en `.gitignore`, no se sube al repo.

3. Iniciá la app:
   ```bash
   npm start
   ```

## Cómo se carga el menú

El menú se lee en tiempo real desde la tabla `public.menu` de Supabase
(la misma que usan la web y el chatbot). No hace falta editar ningún archivo
JS para cambiar precios o agregar productos:

| Quiero…                      | Hacé esto |
|------------------------------|-----------|
| Cambiar precio o bloquear    | Modo Admin del kiosko (ícono usuario en la pantalla de bienvenida, contraseña `1234`) |
| Agregar / borrar producto    | Supabase Studio → tabla `menu`, o desde la web-carrito si tiene UI |
| Cambiar imagen               | Ver sección **Imágenes** abajo |

Los cambios se ven al instante (suscripción realtime).
Si Supabase está caído al iniciar, el kiosko cae en el último menú guardado
localmente con `electron-store`.

## Imágenes de los productos

La columna `menu.image_url` admite **cualquier URL** o ruta. Hay 3 formas de
poner una imagen:

### A) Recomendado — Supabase Storage (compartido con web/chatbot)

Ya creé el bucket público `menu`. Subí imágenes con el script incluido:

```bash
node scripts/upload-image.js "Hamburguesa Mixta" assets/images/jamonYqueso.png
```

El script:
1. Sube la imagen al bucket `menu`
2. Calcula la URL pública
3. Guarda esa URL en `menu.image_url` para el producto

También funciona pasándole el UUID del producto en vez del nombre.

### B) Manual desde Supabase Studio
1. Storage → bucket `menu` → **Upload file**.
2. Click derecho sobre la imagen → **Get URL** → copiá la URL pública.
3. En la tabla `menu`, pegá esa URL en la columna `image_url` del producto.

### C) Imagen externa (cualquier CDN, Cloudinary, etc.)
Pegá la URL `https://...` directo en `menu.image_url`. Listo.

> Si la columna queda vacía el kiosko muestra `assets/images/producto_placeholder.png`.

## Estructura

```
.
├── main.js                  # Proceso principal de Electron + IPC
├── preload.js               # Bridge electronAPI hacia el renderer
├── renderer.js              # Lógica de UI del kiosko
├── index.html
├── style.css
├── data/
│   ├── supabase-client.js   # Cliente Supabase + loader del menú
│   └── menu.js              # (legacy, vacío — el menú vive en Supabase)
├── scripts/
│   └── upload-image.js      # Subir imagen al bucket "menu"
├── assets/
│   ├── images/              # Imágenes locales (placeholder, etc.)
│   └── videos/              # Videos de productos / pantalla de bienvenida
└── .env                     # Credenciales de Supabase (NO commitear)
```

## Modo Admin

- Botón con ícono de usuario en la pantalla de bienvenida → contraseña `1234`.
- Permite tocar cualquier producto para editar precio o marcarlo como
  bloqueado (sin stock). Los cambios se guardan directo en Supabase.

## Sincronización con web-carrito y chatbot-carrito

| Tabla        | Quién la usa              | Cómo |
|--------------|--------------------------|------|
| `menu`       | kiosko + web + chatbot   | Lectura en realtime; el admin del kiosko puede actualizar `precio` y `disponible` |
| `orders`     | kiosko + web + chatbot   | El kiosko inserta con `type='kiosko'` y `customer_phone=NULL`. **No se mezcla con el panel del chatbot** porque ese panel filtra por `customer_phone`. Sirve para reportes y métricas. |

### Reportes útiles

```sql
-- Pedidos del kiosko por día
SELECT DATE(created_at) AS dia, COUNT(*) AS pedidos, SUM(total) AS facturado
FROM orders
WHERE type = 'kiosko'
GROUP BY dia
ORDER BY dia DESC;

-- Productos más vendidos por canal
SELECT type, item->>'nombre' AS producto,
       SUM((item->>'cantidad')::int) AS unidades
FROM orders, jsonb_array_elements(items) AS item
GROUP BY type, producto
ORDER BY unidades DESC;
```
