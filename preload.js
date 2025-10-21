const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('electronAPI', {
  printTicket: (ticketData) => ipcRenderer.send('print-ticket', ticketData),
  onPrintComplete: (callback) => {
    ipcRenderer.removeAllListeners('print-complete');
    ipcRenderer.on('print-complete', (event, response) => callback(event, response)); // ✅ CORREGIDO
  }
});