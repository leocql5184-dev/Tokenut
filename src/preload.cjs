const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('tokenut',{
  chooseSource:id=>ipcRenderer.send('choose-source',id),
  autoSource:id=>ipcRenderer.send('auto-source',id),
  setSource:(id,enabled)=>ipcRenderer.send('set-source',id,enabled),
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
