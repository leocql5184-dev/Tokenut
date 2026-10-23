const path=require('node:path');
(async()=>{
 const {packager}=await import('@electron/packager');
 const result=await packager({dir:path.resolve(__dirname,'..'),name:'Tokenut',platform:'win32',arch:'x64',out:'dist',overwrite:true,asar:true,
 ignore:p=>!!p&&!/^\/(src|assets)(\/|$)/.test(p)&&!/^\/(package\.json|README\.md)$/.test(p)});
 console.log(result.join('\n'));
})().catch(e=>{console.error(e);process.exitCode=1;});

