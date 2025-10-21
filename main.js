const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

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
        orderNumber: ticketData.orderNumber // Usar el número de orden real
    });
  }, 1000);
});

