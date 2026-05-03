const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Impresión de tickets
  printTicket: (ticketData) => ipcRenderer.send('print-ticket', ticketData),
  onPrintComplete: (callback) => {
    ipcRenderer.removeAllListeners('print-complete');
    ipcRenderer.on('print-complete', (event, response) => callback(event, response));
  },

  // Config de Supabase (vienen desde .env vía main.js)
  getSupabaseConfig: () => ipcRenderer.invoke('get-supabase-config'),

  // Persistencia local de respaldo
  getMenuData: () => ipcRenderer.invoke('get-menu-data'),
  saveMenuData: (menuData) => ipcRenderer.invoke('save-menu-data', menuData),
  resetMenuData: () => ipcRenderer.invoke('reset-menu-data')
});
