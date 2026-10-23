const {app,BrowserWindow,Menu,ipcMain,screen,dialog} = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const {dayOf} = require('./local-usage.cjs');
const {registry,initializeSources,sourceViews,configureSource,syncSources}=require('./usage-manager.cjs');
const {stageFor,progressFor} = require('./progress.cjs');

let sources=[],resyncRequested=false;
let client;
let win, stateFile, pollTimer, tickTimer, saved = {}, busy = false;
let status = '正在读取用量来源', lastError = '', day = dayOf(new Date());
function persist() {
  try { fs.mkdirSync(path.dirname(stateFile),{recursive:true}); fs.writeFileSync(stateFile+'.tmp',JSON.stringify(saved,null,2)); fs.renameSync(stateFile+'.tmp',stateFile); }
  catch { lastError='本地记录保存失败'; }
}
function snapshot() {
  const record=saved.days?.[day]; const entry=record?.source==='local'?record:null;
  const tokens=entry?.tokens ?? null;
  return {tokens,stage:stageFor(tokens),fill:progressFor(tokens),day,status,lastError,updatedAt:entry?.updatedAt, reducedMotion:!!saved.reducedMotion,alwaysOnTop:saved.alwaysOnTop!==false};
}
function history(){return {day,days:saved.days||{},status,lastError,sources};}
async function chooseSource(id,auto=false){
 const source=registry.find(s=>s.id===id);if(!source)return;
 let root=source.defaultRoot();
 if(!auto){const result=await dialog.showOpenDialog(client&&!client.isDestroyed()?client:win,{title:`选择 ${source.name} 的 sessions 或上级文件夹`,properties:['openDirectory']});if(result.canceled)return;root=result.filePaths[0];if(fs.existsSync(path.join(root,'sessions')))root=path.join(root,'sessions');}
 configureSource(saved,id,{root});sources=sourceViews(saved);persist();await sync();
}
function setSource(id,enabled){if(!registry.some(s=>s.id===id)||typeof enabled!=='boolean')return;configureSource(saved,id,{enabled});sources=sourceViews(saved);persist();sync();}
async function openClient(){
 if(client&&!client.isDestroyed()){client.show();client.focus();return;}
 client=new BrowserWindow({width:1050,height:800,minWidth:650,minHeight:600,title:'Tokenut · 用量记录',backgroundColor:'#f4f6f2',webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
 client.setMenu(null);client.webContents.setWindowOpenHandler(()=>({action:'deny'}));client.webContents.on('will-navigate',e=>e.preventDefault());
 await client.loadFile(path.join(__dirname,'client.html'));
}
function publish() { if(client&&!client.isDestroyed())client.webContents.send('history',history()); if(win && !win.isDestroyed()) win.webContents.send('state',snapshot()); }
async function sync() {
  if(busy){resyncRequested=true;return;} busy=true;status='正在同步';publish();
  try {
    day=dayOf(new Date());const result=await syncSources(saved,day);sources=result.sources;
    lastError=sources.filter(s=>s.enabled&&['error','partial'].includes(s.state)).map(s=>`${s.name}：${s.message}`).join('；');
    status=sources.some(s=>s.enabled)?'本机用量 · 每5秒更新':'请选择用量来源';persist();
  }catch(error){lastError=error.message;}
  finally {busy=false;publish();clearTimeout(pollTimer);const delay=resyncRequested?0:5000;resyncRequested=false;pollTimer=setTimeout(sync,delay);}
}
function contextMenu() {
  Menu.buildFromTemplate([
    {label:'Tokenut · 今日充能',enabled:false},
    {label:'打开用量记录',click:openClient},
    {label:'管理用量来源（Codex / DeepSeek Harness）',click:openClient},
    {label:'立即同步用量',enabled:!busy,click:sync},
    {type:'separator'},
    {label:'始终置顶',type:'checkbox',checked:saved.alwaysOnTop!==false,click:item=>{saved.alwaysOnTop=item.checked;win.setAlwaysOnTop(item.checked);persist();publish();}},
    {label:'减少动态效果',type:'checkbox',checked:!!saved.reducedMotion,click:item=>{saved.reducedMotion=item.checked;persist();publish();}},
    {label:'大小',submenu:[.8,1,1.2].map(scale=>({label:`${Math.round(scale*100)}%`,type:'radio',checked:(saved.scale||1)===scale,click:()=>{saved.scale=scale;win.setSize(Math.round(280*scale),Math.round(264*scale));win.webContents.setZoomFactor(scale);persist();}}))},
    {type:'separator'},
    {label:'退出 Tokenut',click:()=>app.quit()}
  ]).popup({window:win});
}
if(!app.requestSingleInstanceLock()) app.quit();
else {
app.on('second-instance',()=>{win?.show();win?.focus();});
app.whenReady().then(async()=>{
  stateFile=path.join(app.getPath('userData'),'usage.json');
  try {saved=JSON.parse(fs.readFileSync(stateFile,'utf8'));} catch {}
  initializeSources(saved);sources=sourceViews(saved);
  const work=screen.getPrimaryDisplay().workArea; const scale=saved.scale||1;
  const width=Math.round(280*scale),height=Math.round(264*scale);
  let x=saved.position?.x ?? work.x+work.width-width-30, y=saved.position?.y ?? work.y+work.height-height-30;
  const display=screen.getDisplayNearestPoint({x,y}).workArea;
  x=Math.max(display.x,Math.min(x,display.x+display.width-width)); y=Math.max(display.y,Math.min(y,display.y+display.height-height));
  win=new BrowserWindow({width,height,x,y,frame:false,transparent:true,resizable:false,hasShadow:false,alwaysOnTop:saved.alwaysOnTop!==false,backgroundColor:'#00000000',title:'Tokenut',webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
  win.setMenu(null);win.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  win.webContents.on('will-navigate',event=>event.preventDefault());
  win.webContents.on('context-menu',contextMenu);
  win.on('moved',()=>{const [x,y]=win.getPosition();saved.position={x,y};persist();});
  ipcMain.handle('state',()=>snapshot());
  ipcMain.handle('history',()=>history());
  ipcMain.on('choose-source',(_,id)=>chooseSource(id));
  ipcMain.on('auto-source',(_,id)=>chooseSource(id,true));
  ipcMain.on('set-source',(_,id,enabled)=>setSource(id,enabled));
  ipcMain.on('open-client',openClient);
  ipcMain.on('drag',(_,delta)=>{if(Number.isFinite(delta.x)&&Number.isFinite(delta.y)){const [x,y]=win.getPosition();win.setPosition(Math.round(x+delta.x),Math.round(y+delta.y));}});
  ipcMain.on('menu',contextMenu);
  ipcMain.on('sync',sync);
  ipcMain.on('interactive',(_,value)=>win.setIgnoreMouseEvents(!value,{forward:true}));
  await win.loadFile(path.join(__dirname,'index.html')); win.webContents.setZoomFactor(scale);
  if(process.argv.includes('--client-smoke')){await sync();await openClient();await new Promise(r=>setTimeout(r,1500));fs.mkdirSync(path.join(__dirname,'..','output'),{recursive:true});fs.writeFileSync(path.join(__dirname,'..','output','client.png'),(await client.webContents.capturePage()).toPNG());app.quit();return;}
  await sync();
  if(!saved.onboarded){await openClient();saved.onboarded=true;persist();}
  tickTimer=setInterval(()=>{if(dayOf(new Date())!==day){day=dayOf(new Date());sync();}},1000);
});
app.on('window-all-closed',()=>app.quit());
app.on('before-quit',()=>{clearTimeout(pollTimer);clearInterval(tickTimer);});
}

