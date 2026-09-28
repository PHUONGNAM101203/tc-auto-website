import { chromium } from "playwright";
const BASE="http://127.0.0.1:3000";
const br=await chromium.launch();
const p=await (await br.newContext({viewport:{width:1440,height:1200}})).newPage();
p.on("dialog",d=>d.accept());
await p.goto(BASE+"/admin/login",{waitUntil:"networkidle"});
await p.locator('input[type="email"]').first().fill("admin@tcauto.vn");
await p.locator('input[type="password"]').first().fill("Tcauto2026");
await p.locator('form button[type="submit"]').first().click();
await p.waitForTimeout(3500);

for (let round=0; round<3; round++) {
  await p.goto(BASE+"/admin/leads",{waitUntil:"networkidle"});
  const found=await p.evaluate(()=>{
    const span=[...document.querySelectorAll("span")].find(e=>e.children.length===0 && e.textContent.trim()==="Kiem thu tu dong");
    if(!span) return null;
    let node=span;
    while(node && !node.querySelector?.("button")) node=node.parentElement;
    // di len them cho toi khi tim thay nut "Xoa lead"
    while(node && ![...node.querySelectorAll("button")].some(b=>/Xo/.test(b.textContent))) node=node.parentElement;
    if(!node) return null;
    const btn=[...node.querySelectorAll("button")].find(b=>/Xo/.test(b.textContent));
    // chi nhan neu khoi nay CHI chua mot ban ghi
    const names=[...node.querySelectorAll("span")].filter(e=>e.children.length===0 && /^[A-ZĐ]/.test(e.textContent.trim())).map(e=>e.textContent.trim());
    btn.setAttribute("data-xoa-thu","1");
    return {ten: names.slice(0,4), so_nut_xoa: [...node.querySelectorAll("button")].filter(b=>/Xo/.test(b.textContent)).length};
  });
  if(!found){ console.log("khong con ban ghi kiem thu"); break; }
  if(found.so_nut_xoa!==1){ console.log("khoi bao quanh chua nhieu ban ghi — dung lai de an toan:", JSON.stringify(found)); break; }
  console.log("xoa ban ghi:", JSON.stringify(found.ten));
  await p.locator('[data-xoa-thu="1"]').click();
  await p.waitForTimeout(3000);
}
await p.goto(BASE+"/admin/leads",{waitUntil:"networkidle"});
const end=await p.evaluate(()=>({con: document.body.innerText.includes("Kiem thu tu dong"),
  tong: document.body.innerText.match(/(\d+) bản ghi/)?.[1]}));
console.log("ket thuc -> con ban ghi thu?", end.con?"CON":"sach", "| tong con:", end.tong);
await br.close();
