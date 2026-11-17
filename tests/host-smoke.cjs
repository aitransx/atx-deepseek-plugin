const {pathToFileURL}=require('node:url');
(async()=>{
 const m=await import(pathToFileURL(require('node:path').resolve(__dirname,'../index.js')).href);
 const config=m.Config({refreshHours:0}); const tools=[]; const sections=[];
 m.apply({get:()=>undefined,credentials:{resolve:async()=>undefined,describe:async()=>({configured:false})},tools:{register:d=>tools.push(d)},systemPrompt:{section:s=>sections.push(s)}},config);
 console.log(JSON.stringify({tools:tools.map(t=>t.name),sections:sections.length,config}));
 const result=await tools.find(t=>t.name==='aitransx_status').execute({}, {signal:new AbortController().signal});
 console.log(result);
})().catch(e=>{console.error(e);process.exitCode=1});
