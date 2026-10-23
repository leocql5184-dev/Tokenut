const {spawn} = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
function findCodex() {
  if (process.env.TOKENUT_CODEX_PATH) return process.env.TOKENUT_CODEX_PATH;
  const root = path.join(process.env.LOCALAPPDATA || '', 'OpenAI', 'Codex', 'bin');
  try {
    const matches = fs.readdirSync(root).map(n => path.join(root,n,'codex.exe')).filter(p => fs.existsSync(p));
    matches.sort((a,b) => fs.statSync(b).mtimeMs-fs.statSync(a).mtimeMs);
    if (matches[0]) return matches[0];
  } catch {}
  return 'codex';
}
function readUsage() {
  return new Promise((resolve,reject) => {
    const child = spawn(findCodex(), ['app-server','--stdio'], {windowsHide:true, stdio:['pipe','pipe','pipe']});
    let buffer = '', settled = false;
    const finish = (err,value) => { if(settled) return; settled=true; clearTimeout(timer); child.kill(); err ? reject(err) : resolve(value); };
    const timer = setTimeout(() => finish(new Error('读取超时，请检查 Codex 登录与网络')), 25000);
    const send = data => { if(!settled) child.stdin.write(JSON.stringify(data)+'\n'); };
    child.on('error', () => finish(new Error('未找到 Codex，请先安装并登录')));
    child.stdin.on('error', () => {});
    child.stderr.on('data', () => {});
    child.on('exit', () => { if(!settled) finish(new Error('Codex 连接已关闭')); });
    child.stdout.on('data', chunk => {
      buffer += chunk.toString(); let end;
      while ((end=buffer.indexOf('\n')) >= 0) {
        const line=buffer.slice(0,end); buffer=buffer.slice(end+1); let msg;
        try {msg=JSON.parse(line);} catch {continue;}
        if(msg.id===1) {
          if(msg.error) return finish(new Error('Codex 初始化失败'));
          send({method:'initialized',params:{}});
          send({id:2,method:'account/usage/read',params:{}});
        }
        if(msg.id===2) msg.error ? finish(new Error('用量读取失败，请确认 Codex 已用 ChatGPT 登录')) : finish(null,msg.result);
      }
    });
    send({id:1,method:'initialize',params:{clientInfo:{name:'tokenut',title:'Tokenut',version:'0.1.0'},capabilities:{experimentalApi:true}}});
  });
}
module.exports={readUsage,findCodex};
