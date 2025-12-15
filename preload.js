const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Impresión de tickets
  printTicket: (ticketData) => ipcRenderer.send('print-ticket', ticketData),
  onPrintComplete: (callback) => {
    ipcRenderer.removeAllListeners('print-complete');
    ipcRenderer.on('print-complete', (event, response) => callback(event, response));
  },
  
  // NUEVO: Persistencia de datos
  getMenuData: () => ipcRenderer.invoke('get-menu-data'),
  saveMenuData: (menuData) => ipcRenderer.invoke('save-menu-data', menuData),
  resetMenuData: () => ipcRenderer.invoke('reset-menu-data')
});