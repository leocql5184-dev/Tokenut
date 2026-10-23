const {app,BrowserWindow,Menu,ipcMain,screen,dialog} = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const {readLocalUsage,dayOf} = require('./local-usage.cjs');
const {localDay,dailyTokens,stageFor,progressFor,thresholds} = require('./progress.cjs');
const {reconcile}=require('./history.cjs');
const os=require('node:os');
let connection={state:'checking',message:'正在查找本机 Codex 记录',path:''};
let client;
let win, stateFile, pollTimer, tickTimer, saved = {}, preview = null, busy = false;
let status = '正在连接 Codex', lastError = '', day = dayOf(new Date());
const names=['初始形态','微光觉醒','愤怒模式','纯金形态','钻石形态','科技充能','最终形态'];
function persist() {
  try { fs.mkdirSync(path.dirname(stateFile),{recursive:true}); fs.writeFileSync(stateFile+'.tmp',JSON.stringify(saved,null,2)); fs.renameSync(stateFile+'.tmp',stateFile); }
  catch { lastError='本地记录保存失败'; }
}
function snapshot() {
  const record=saved.days?.[day]; const entry=record?.source==='local'?record:null;
  const tokens=preview !== null ? preview : entry?.tokens ?? null;
  return {tokens,stage:stageFor(tokens),fill:progressFor(tokens),preview:preview!==null,day,status,lastError,updatedAt:entry?.updatedAt, reducedMotion:!!saved.reducedMotion,alwaysOnTop:saved.alwaysOnTop!==false};
}
function history(){return {day,days:saved.days||{},status,lastError,connection};}
function defaultRoot(){return path.join(process.env.CODEX_HOME||path.join(os.homedir(),'.codex'),'sessions');}
async function chooseSource(auto=false){
 if(busy)return;
 let root=defaultRoot();
 if(!auto){const result=await dialog.showOpenDialog(client&&!client.isDestroyed()?client:win,{title:'选择 Codex 的 sessions 或 .codex 文件夹',properties:['openDirectory']});if(result.canceled)return;root=result.filePaths[0];if(fs.existsSync(path.join(root,'sessions')))root=path.join(root,'sessions');}
 try {if(!(await fs.promises.stat(root)).isDirectory())throw Error('not directory');await fs.promises.access(root,fs.constants.R_OK);}
 catch {connection={state:'missing',path:root,message:'没有找到可读取的记录目录。请先使用本机 Codex，或选择 sessions 文件夹。'};publish();return;}
 if(path.resolve(saved.sourceRoot||defaultRoot()).toLowerCase()!==path.resolve(root).toLowerCase()){
 saved.sourceHistories ||= {};saved.sourceHistories[saved.sourceRoot||defaultRoot()]=saved.days||{};saved.days=saved.sourceHistories[root]||{};
 }
 saved.sourceRoot=root;persist();await sync();
}
async function openClient(){
 if(client&&!client.isDestroyed()){client.show();client.focus();return;}
 client=new BrowserWindow({width:1050,height:800,minWidth:650,minHeight:600,title:'Tokenut · 用量记录',backgroundColor:'#f4f6f2',webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
 client.setMenu(null);client.webContents.setWindowOpenHandler(()=>({action:'deny'}));client.webContents.on('will-navigate',e=>e.preventDefault());
 await client.loadFile(path.join(__dirname,'client.html'));
}
function publish() { if(client&&!client.isDestroyed())client.webContents.send('history',history()); if(win && !win.isDestroyed()) win.webContents.send('state',snapshot()); }
async function sync() {
  if(busy) return; busy=true; status='正在同步'; publish();
  try {
    const result=await readLocalUsage(saved.sourceRoot||defaultRoot()); day=dayOf(new Date()); saved.days ||= {};
    if(result.sessions>0)saved.days=reconcile(saved.days,result.days,day);
    connection={state:result.sessions>0?'connected':'waiting',path:saved.sourceRoot||defaultRoot(),message:result.sessions>0?`已连接 · 检测到 ${result.sessions} 个本机会话`:'目录已连接，暂未发现会话。请在 Codex 完成一次对话，稍后会自动更新。'};
    status='Codex 本机 · 每5秒更新'; lastError=''; persist();
  } catch(e) { status=saved.days?.[day] ? '离线 · 上次记录' : '尚未连接'; lastError=e.message; connection={state:'error',path:saved.sourceRoot||defaultRoot(),message:'无法读取 Codex 记录。请检查目录，或重新选择记录文件夹。'}; }
  finally {busy=false;publish();clearTimeout(pollTimer);pollTimer=setTimeout(sync,5000);}
}
function contextMenu() {
  Menu.buildFromTemplate([
    {label:'Tokenut · 今日充能',enabled:false},
    {label:'打开用量记录',click:openClient},
    {label:'连接 Codex / 选择记录目录',click:()=>{openClient();chooseSource();}},
    {label:'立即同步 Codex',enabled:!busy,click:sync},
    {type:'separator'},
    {label:'预览七种形态',submenu:names.map((name,i)=>({label:`${i+1} · ${name} (${thresholds[i]/10000}万)`,type:'radio',checked:preview===thresholds[i],click:()=>{preview=thresholds[i];publish();}}))},
    {label:'退出预览，显示真实用量',enabled:preview!==null,click:()=>{preview=null;publish();}},
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
  ipcMain.on('choose-source',()=>chooseSource());
  ipcMain.on('auto-source',()=>chooseSource(true));
  ipcMain.on('open-client',openClient);
  ipcMain.on('drag',(_,delta)=>{if(Number.isFinite(delta.x)&&Number.isFinite(delta.y)){const [x,y]=win.getPosition();win.setPosition(Math.round(x+delta.x),Math.round(y+delta.y));}});
  ipcMain.on('menu',contextMenu);
  ipcMain.on('sync',sync);
  ipcMain.on('interactive',(_,value)=>win.setIgnoreMouseEvents(!value,{forward:true}));
  await win.loadFile(path.join(__dirname,'index.html')); win.webContents.setZoomFactor(scale);
  if(process.argv.includes('--client-smoke')){await sync();await openClient();await new Promise(r=>setTimeout(r,1500));fs.mkdirSync(path.join(__dirname,'..','output'),{recursive:true});fs.writeFileSync(path.join(__dirname,'..','output','client.png'),(await client.webContents.capturePage()).toPNG());app.quit();return;}
  if(process.argv.includes('--smoke')) {
    fs.mkdirSync(path.join(__dirname,'..','output'),{recursive:true});
    for(let i=0;i<7;i++) {preview=thresholds[i];publish();await new Promise(r=>setTimeout(r,1100));const img=await win.webContents.capturePage();fs.writeFileSync(path.join(__dirname,'..','output',`stage-${i+1}.png`),img.toPNG());}
    app.quit();return;
  }
  await sync();
  if(!saved.onboarded){await openClient();saved.onboarded=true;persist();}
  tickTimer=setInterval(()=>{if(dayOf(new Date())!==day){day=dayOf(new Date());saved.days=reconcile(saved.days||{},{},day);persist();preview=null;publish();sync();}},1000);
});
app.on('window-all-closed',()=>app.quit());
app.on('before-quit',()=>{clearTimeout(pollTimer);clearInterval(tickTimer);});
}

