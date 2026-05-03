// data/supabase-client.js
// Cliente de Supabase para el renderer del kiosko.
// Depende de que `supabase` (UMD) esté cargado antes en index.html.

(function () {
  const DEFAULT_PLACEHOLDER = 'assets/images/producto_placeholder.png';

  // Mapa de categorías: id interno → { nombre visible, icono }
  // Si la DB trae categorías nuevas se agregan al final con icono genérico.
  const CATEGORY_META = {
    hamburguesas: { nombre: 'Hamburguesas', icono: '🍔' },
    chivitos:     { nombre: 'Chivitos',     icono: '🥪' },
    panchos:      { nombre: 'Panchos',      icono: '🌭' },
    papas:        { nombre: 'Papas Fritas', icono: '🍟' },
    nuggets:      { nombre: 'Nuggets',      icono: '🍗' },
    sandwiches:   { nombre: 'Sandwiches',   icono: '🥪' },
    chorizos:     { nombre: 'Chorizos',     icono: '🍖' },
    bebidas:      { nombre: 'Bebidas',      icono: '🥤' },
  };

  // Orden preferido en el sidebar
  const CATEGORY_ORDER = [
    'hamburguesas', 'chivitos', 'panchos', 'papas',
    'nuggets', 'sandwiches', 'chorizos', 'bebidas',
  ];

  let client = null;

  async function init() {
    if (client) return client;

    const cfg = await window.electronAPI.getSupabaseConfig();
    if (!cfg.url || !cfg.anonKey) {
      throw new Error('Faltan credenciales de Supabase en .env (vite_supabase_key / Vite_supabase_anon_key).');
    }
    if (!window.supabase || typeof window.supabase.createClient !== 'function') {
      throw new Error('Supabase UMD no cargado. Verificá el <script> en index.html.');
    }
    client = window.supabase.createClient(cfg.url, cfg.anonKey, {
      auth: { persistSession: false },
    });
    return client;
  }

  function getClient() {
    if (!client) throw new Error('Supabase client no inicializado. Llamá a init() primero.');
    return client;
  }

  function categoryIdFromDb(categoria) {
    return String(categoria || '').trim().toLowerCase();
  }

  // Convierte filas de la tabla `menu` al shape que ya usa renderer.js
  function rowsToMenuData(rows) {
    const categoriasMap = {};
    const productos = {};

    for (const row of rows) {
      const catId = categoryIdFromDb(row.categoria);
      if (!catId) continue;

      if (!categoriasMap[catId]) {
        const meta = CATEGORY_META[catId] || {
          nombre: catId.charAt(0).toUpperCase() + catId.slice(1).toLowerCase(),
          icono: '🍽️',
        };
        categoriasMap[catId] = { id: catId, nombre: meta.nombre, icono: meta.icono };
        productos[catId] = [];
      }

      productos[catId].push({
        id: row.id,
        nombre: row.nombre,
        desc: row.descripcion || '',
        precio: Number(row.precio) || 0,
        img: row.image_url || DEFAULT_PLACEHOLDER,
        locked: row.disponible === false,
        destacado: !!row.destacado,
        orden: row.orden ?? 0,
        personalizaciones: [], // las construye renderer.js dinámicamente
      });
    }

    // Ordenar productos dentro de cada categoría por `orden`
    Object.keys(productos).forEach(catId => {
      productos[catId].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
    });

    // Armar lista ordenada de categorías
    const categorias = [];
    CATEGORY_ORDER.forEach(catId => {
      if (categoriasMap[catId]) {
        categorias.push(categoriasMap[catId]);
        delete categoriasMap[catId];
      }
    });
    Object.values(categoriasMap).forEach(cat => categorias.push(cat));

    return { categorias, productos };
  }

  async function fetchMenu() {
    const sb = getClient();
    const { data, error } = await sb
      .from('menu')
      .select('*')
      .order('categoria', { ascending: true })
      .order('orden', { ascending: true });

    if (error) throw error;
    return rowsToMenuData(data || []);
  }

  // Suscripción en tiempo real a cambios del menú (precio, disponibilidad, nuevo producto)
  function subscribeToMenu(onChange) {
    const sb = getClient();
    const channel = sb
      .channel('menu-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu' }, () => {
        onChange();
      })
      .subscribe();
    return () => sb.removeChannel(channel);
  }

  // Guardar cambios del modo admin → tabla menu
  async function updateProduct(productId, { precio, locked }) {
    const sb = getClient();
    const patch = {};
    if (typeof precio === 'number') patch.precio = Math.round(precio);
    if (typeof locked === 'boolean') patch.disponible = !locked;

    const { error } = await sb.from('menu').update(patch).eq('id', productId);
    if (error) throw error;
  }

  // Guardar la orden en `orders` con type='kiosko'.
  // El panel del chatbot filtra por customer_phone, así que estas órdenes
  // (con phone NULL) no se mezclan en su UI — solo quedan para reportes.
  async function saveOrder(order) {
    const sb = getClient();
    const payload = {
      order_number: String(order.orderNumber),
      type: 'kiosko',
      items: order.items,
      subtotal: order.total,
      total: order.total,
      status: 'pending',
    };
    const { data, error } = await sb.from('orders').insert(payload).select().single();
    if (error) throw error;
    return data;
  }

  window.kioskoSupabase = {
    init,
    getClient,
    fetchMenu,
    subscribeToMenu,
    updateProduct,
    saveOrder,
  };
})();
