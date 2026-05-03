const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Store = require('electron-store');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const SUPABASE_URL = process.env.vite_supabase_key || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.Vite_supabase_anon_key || process.env.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('[MAIN] ⚠️ Faltan variables de Supabase en .env (vite_supabase_key / Vite_supabase_anon_key)');
}

const store = new Store();

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 777,
    height: 920,
    // fullscreen: true,
    //autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile('index.html');

  //mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});


function imprimirTicket(ticketData, numeroCopia) {
  console.log(`--- INICIO TICKET (Interno) #${numeroCopia} ---`);
  console.log("Carrito del paseo");
  console.log(`Fecha: ${new Date().toLocaleDateString()} Hora: ${new Date().toLocaleTimeString()}`);
  console.log("------------------------------------");

  ticketData.items.forEach(item => {
    console.log(
      `${item.cantidad}x ${item.nombre} (${(item.personalizaciones || [])
        .map(p => p.nombre)
        .join(', ') || 'Estándar'}) - $${item.precioTotal.toFixed(2)}`
    );
  });

  console.log("------------------------------------");
  console.log(`TOTAL: $${ticketData.total.toFixed(2)}`);
  console.log(`--- FIN TICKET #${numeroCopia} ---`);
}

ipcMain.on('print-ticket', (event, ticketData) => {
  imprimirTicket(ticketData, 1);
  imprimirTicket(ticketData, 2);

  setTimeout(() => {
    console.log("[MAIN] Enviando confirmación de impresión...");
    mainWindow.webContents.send('print-complete', {
      success: true,
      orderNumber: ticketData.orderNumber
    });
  }, 1000);
});

// ============ Supabase config para el renderer ============
ipcMain.handle('get-supabase-config', async () => {
  return {
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY,
  };
});

// ============ Persistencia local de respaldo ============

ipcMain.handle('get-menu-data', async () => {
  try {
    const savedMenu = store.get('menuData');
    return { success: true, data: savedMenu || null };
  } catch (error) {
    console.error('[MAIN] Error al cargar menú:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('save-menu-data', async (event, menuData) => {
  try {
    store.set('menuData', menuData);
    return { success: true };
  } catch (error) {
    console.error('[MAIN] Error al guardar menú:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('reset-menu-data', async () => {
  try {
    store.delete('menuData');
    return { success: true };
  } catch (error) {
    console.error('[MAIN] Error al resetear menú:', error);
    return { success: false, error: error.message };
  }
});
