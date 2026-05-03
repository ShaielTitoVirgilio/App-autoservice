#!/usr/bin/env node
// Sube una imagen al bucket "menu" de Supabase Storage y guarda
// la URL pública en menu.image_url para el producto que coincida por nombre o id.
//
// Uso:
//   node scripts/upload-image.js "<id-o-nombre-del-producto>" "<ruta/a/imagen.png>"
//
// Ejemplos:
//   node scripts/upload-image.js "Hamburguesa Mixta" assets/images/jamonYqueso.png
//   node scripts/upload-image.js 19562e9c-9e4c-46fd-97bb-fef5d2b9ae7e ./mixta.jpg

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.vite_supabase_key || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ||
                     process.env.Vite_supabase_anon_key ||
                     process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Faltan credenciales en .env');
  process.exit(1);
}

const [, , target, imagePath] = process.argv;

if (!target || !imagePath) {
  console.error('Uso: node scripts/upload-image.js "<id-o-nombre>" "<ruta/imagen.png>"');
  process.exit(1);
}

if (!fs.existsSync(imagePath)) {
  console.error(`❌ No encuentro el archivo: ${imagePath}`);
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

(async () => {
  // 1. Encontrar el producto
  let producto;
  if (UUID_RE.test(target)) {
    const { data, error } = await sb.from('menu').select('id,nombre').eq('id', target).single();
    if (error) throw error;
    producto = data;
  } else {
    const { data, error } = await sb.from('menu').select('id,nombre').ilike('nombre', `%${target}%`);
    if (error) throw error;
    if (!data || data.length === 0) {
      console.error(`❌ No encontré productos con nombre que contenga "${target}"`);
      process.exit(1);
    }
    if (data.length > 1) {
      console.error(`⚠️  Más de un producto coincide con "${target}":`);
      data.forEach(p => console.error(`   - ${p.nombre} (${p.id})`));
      console.error('Usá el id exacto.');
      process.exit(1);
    }
    producto = data[0];
  }

  // 2. Subir el archivo
  const ext = path.extname(imagePath).toLowerCase() || '.png';
  const safeName = producto.nombre.normalize('NFD').replace(/[̀-ͯ]/g, '')
                                  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const objectKey = `${safeName}-${producto.id.slice(0, 8)}${ext}`;

  console.log(`📤 Subiendo a bucket "menu" como: ${objectKey}`);
  const fileBuffer = fs.readFileSync(imagePath);
  const contentType = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg'
                    : ext === '.webp' ? 'image/webp'
                    : ext === '.gif' ? 'image/gif'
                    : 'image/png';

  const { error: uploadErr } = await sb.storage
    .from('menu')
    .upload(objectKey, fileBuffer, { contentType, upsert: true });
  if (uploadErr) throw uploadErr;

  // 3. URL pública
  const { data: pub } = sb.storage.from('menu').getPublicUrl(objectKey);
  const publicUrl = pub.publicUrl;
  console.log(`🌐 URL pública: ${publicUrl}`);

  // 4. Actualizar la fila del producto
  const { error: updErr } = await sb.from('menu').update({ image_url: publicUrl }).eq('id', producto.id);
  if (updErr) throw updErr;

  console.log(`✅ ${producto.nombre} → image_url actualizado`);
})().catch(err => {
  console.error('❌ Error:', err.message || err);
  process.exit(1);
});
