const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Store = require('electron-store'); // NUEVO

// NUEVO: Configurar electron-store
const store = new Store();

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 777, 
    height: 920,
    // fullscreen: true, // Descomentar para producción en kiosko real
    // autoHideMenuBar: true, // Descomentar para producción
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, 
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile('index.html');

  //mainWindow.webContents.openDevTools(); // Descomentar para ver herramientas de desarrollador
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

// Simulación de impresión de ticket
ipcMain.on('print-ticket', (event, ticketData) => {
  console.log("--- INICIO TICKET (Interno) ---");
  console.log("Carrito del paseo");
  console.log(`Fecha: ${new Date().toLocaleDateString()} Hora: ${new Date().toLocaleTimeString()}`);
  console.log("------------------------------------");
  ticketData.items.forEach(item => {
    console.log(`${item.cantidad}x ${item.nombre} (${(item.personalizaciones || []).map(p => p.nombre).join(', ') || 'Estándar'}) - $${item.precioTotal.toFixed(2)}`);
  });
  console.log("------------------------------------");
  console.log(`TOTAL: $${ticketData.total.toFixed(2)}`);
  console.log("--- FIN TICKET ---");

  setTimeout(() => {
    console.log("[MAIN] Enviando confirmación de impresión...");
    mainWindow.webContents.send('print-complete', {
        success: true,
        orderNumber: ticketData.orderNumber
    });
  }, 1000);
});

// ============ NUEVO: SISTEMA DE PERSISTENCIA ============

// Obtener datos del menú guardados
ipcMain.handle('get-menu-data', async () => {
  try {
    const savedMenu = store.get('menuData');
    console.log('[MAIN] Datos del menú cargados desde store');
    return { success: true, data: savedMenu || null };
  } catch (error) {
    console.error('[MAIN] Error al cargar menú:', error);
    return { success: false, error: error.message };
  }
});

// Guardar datos del menú
ipcMain.handle('save-menu-data', async (event, menuData) => {
  try {
    store.set('menuData', menuData);
    console.log('[MAIN] Datos del menú guardados exitosamente');
    return { success: true };
  } catch (error) {
    console.error('[MAIN] Error al guardar menú:', error);
    return { success: false, error: error.message };
  }
});

// Resetear datos del menú (útil para volver a valores por defecto)
ipcMain.handle('reset-menu-data', async () => {
  try {
    store.delete('menuData');
    console.log('[MAIN] Datos del menú reseteados');
    return { success: true };
  } catch (error) {
    console.error('[MAIN] Error al resetear menú:', error);
    return { success: false, error: error.message };
  }
});