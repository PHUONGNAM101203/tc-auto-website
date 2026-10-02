/**
 * Chay MOI cua kiem can may chu that, tren mot may chu do chinh bai nay dung.
 *
 * Bay cua kiem (fidelity, fidelity:sub, sharpness, lazy, reach, readmore,
 * zoom) deu can `next start` o cong 3311, nen chung khong nam trong chuoi
 * `npm run verify`. Hau qua: chay tay tung cai, de sot. `verify:zoom` da do
 * tu truoc ma khong ai thay.
 *
 * Bai nay cung sua hai cai bay cua viec chay tay:
 *
 * 1. **Do san sang sai cho.** Do bang `/giai-phap` roi goi `/` ngay thi `/`
 *    tra 404 — cac route khong san sang cung mot luc. Nay doi DUNG `/`.
 * 2. **Build de len may chu dang chay.** `npm run build` ghi de `.next` trong
 *    khi `next start` dang doc no; tien trinh do sau do tra 404 cho nhung
 *    duong dan hoan toan binh thuong. Nay bai tu dung may chu rieng va tu
 *    dong no lai.
 */
import { spawn } from "node:child_process";

const PORT = 3311;
const BASE = `http://127.0.0.1:${PORT}`;
const GATES = [
  "verify:fidelity",
  "verify:fidelity:sub",
  "verify:sharpness",
  "verify:lazy",
  "verify:reach",
  "verify:readmore",
  "verify:metadata",
  "verify:weight",
  "verify:zoom",
];

function run(command, args, options = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { stdio: "inherit", ...options });
    child.on("exit", (code) => resolve(code ?? 1));
  });
}

async function waitReady() {
  // Doi DUNG `/`: day la route san sang muon nhat, va cung la route ma
  // check-zoom.mjs goi dau tien.
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(BASE + "/", { redirect: "manual" });
      if (response.status === 200) {
        return true;
      }
    } catch {
      // may chu chua len
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  return false;
}

const server = spawn("npx", ["next", "start", "-p", String(PORT)], {
  stdio: "ignore",
  detached: false,
});

let failed = 0;
try {
  if (!(await waitReady())) {
    console.error(`\n  May chu khong len o ${BASE} sau 60 giay.`);
    process.exitCode = 1;
  } else {
    for (const gate of GATES) {
      console.log(`\n──── ${gate} ────`);
      const code = await run("npm", ["run", gate]);
      if (code !== 0) {
        failed += 1;
        console.error(`  ${gate} THAT BAI (ma thoat ${code})`);
      }
    }
    console.log(
      failed === 0
        ? `\n  ${GATES.length}/${GATES.length} cua kiem can may chu deu xanh.`
        : `\n  ${failed}/${GATES.length} cua kiem that bai.`,
    );
    process.exitCode = failed === 0 ? 0 : 1;
  }
} finally {
  server.kill("SIGTERM");
}
