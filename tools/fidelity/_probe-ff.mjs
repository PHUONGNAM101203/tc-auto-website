import { chromium } from "playwright";
const br=await chromium.launch();
const p=await br.newPage({viewport:{width:1440,height:900}});
await p.goto("http://127.0.0.1:3311/",{waitUntil:"networkidle"});
await p.waitForTimeout(600);
console.log(await p.evaluate(()=>{
  const c=document.querySelector('.tc-canvas').getBoundingClientRect();
  const z=c.width/1440;
  const out={};
  const pick=(sel,name)=>{const e=document.querySelector(sel); if(!e){out[name]='khong thay';return;}
    const r=e.getBoundingClientRect();
    out[name]={x:+((r.x-c.x)/z).toFixed(1), y:+((r.y-c.y)/z).toFixed(1),
               w:+(r.width/z).toFixed(1), h:+(r.height/z).toFixed(1),
               bottom:+(((r.y-c.y)+r.height)/z).toFixed(1)};};
  pick('.tc-canvas .ff','form');
  pick('.tc-canvas .ff .in1','ho ten');
  pick('.tc-canvas .ff .in2','so dt');
  pick('.tc-canvas .ff textarea','noi dung');
  pick('.tc-canvas .ff button','nut gui');
  return out;
}));
await br.close();
