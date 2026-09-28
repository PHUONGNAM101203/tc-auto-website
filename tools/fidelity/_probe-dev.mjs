import { chromium } from "playwright";
const B="http://localhost:3000";
const SC="/private/tmp/claude-501/-Users-phuongnam-Documents-TC-Auto-tc-auto-website/93fc9929-0baf-4972-8a8d-8aecd779bbc0/scratchpad/probe";
const br=await chromium.launch();
const p=await br.newPage({viewport:{width:1440,height:900},deviceScaleFactor:2});
const errs=[];
p.on("pageerror",e=>errs.push(e.message));
await p.goto(B+"/",{waitUntil:"networkidle"});
const n=await p.locator(".tc-solutions").count();
console.log("co bang chuyen:",n, "| so the:",await p.locator(".tc-solution").count(),
            "| mui ten:",await p.locator(".tc-solution-arrow").count());
if(n){
  await p.locator(".tc-solutions").scrollIntoViewIfNeeded();
  await p.waitForTimeout(800);
  const box=await p.$eval('.tc-solutions',e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y-40,width:r.width,height:r.height+60};});
  await p.screenshot({path:`${SC}/dev-before.png`,clip:box});
  await p.click('.tc-solution-arrow[data-dir="next"]');
  await p.waitForTimeout(900);
  await p.screenshot({path:`${SC}/dev-after.png`,clip:box});
  console.log("offset sau khi bam:",await p.$eval('.tc-solutions-strip',e=>getComputedStyle(e).transform));
}
console.log("loi JS:",errs.slice(0,3));
await br.close();
