const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('tokenut',{
  chooseSource:()=>ipcRenderer.send('choose-source'),
  autoSource:()=>ipcRenderer.send('auto-source'),
  history:()=>ipcRenderer.invoke('history'),
  onHistory:fn=>ipcRenderer.on('history',(_,value)=>fn(value)),
  openClient:()=>ipcRenderer.send('open-client'),
  drag:delta=>ipcRenderer.send('drag',delta),
  state:()=>ipcRenderer.invoke('state'),
  subscribe:fn=>ipcRenderer.on('state',(_,value)=>fn(value)),
  menu:()=>ipcRenderer.send('menu'),
  sync:()=>ipcRenderer.send('sync'),
  interactive:value=>ipcRenderer.send('interactive',!!value)
});
