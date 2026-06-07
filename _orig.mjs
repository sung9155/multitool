import { chromium } from "playwright";
const BASE = "http://localhost:4173";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
const ctx = await browser.newContext({ viewport: { width: 1100, height: 900 } });
const page = await ctx.newPage();
const errs = [];
page.on("pageerror", (e) => errs.push(e.message));
page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });

const tools = ["analog-scale","ballscrew","encoder","cylinder-force","pid","three-phase","takt","oee","pressure","net-salary","loan","percent","vat","unit-convert","timestamp","color","bmi","date-calc","split-bill","world-clock","jwt","url-encode","base64","uuid","hash","qr","json-format","regex","char-count"];
const EVIL = ["", "abc", "-1", "999999999999", "1e308"];
const crash = [];
for (const t of tools) {
  const before = errs.length;
  try {
    await page.goto(`${BASE}/t/${t}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(90);
    const inputs = page.locator('main input:not([type="checkbox"]):not([type="range"]), main textarea');
    const n = await inputs.count();
    for (let i = 0; i < n; i++) {
      const el = inputs.nth(i);
      if (!(await el.isVisible().catch(()=>false)) || await el.isDisabled().catch(()=>false)) continue;
      for (const v of EVIL) { await el.fill(v).catch(()=>{}); }
    }
    await page.waitForTimeout(80);
    const mainLen = (await page.locator("main").innerText().catch(()=>"")).length;
    const hasViz = (await page.locator("main svg, main table").count()) > 0;
    const ne = errs.slice(before);
    crash.push(`${(mainLen>5 && ne.length===0)?"OK ":"ERR"} ${t.padEnd(13)} viz:${hasViz} ${ne.length?[...new Set(ne)].join("|").slice(0,110):""}`);
  } catch (e) {
    crash.push(`CRASH ${t.padEnd(13)} ${e.message.slice(0,70)}`);
    try { await page.goto("about:blank"); } catch {}
  }
}
// autosave + url
async function autosave(slug, val) {
  await page.goto(`${BASE}/t/${slug}`, { waitUntil: "domcontentloaded" });
  await page.locator('main input').first().fill(val);
  await page.waitForTimeout(120);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(150);
  return (await page.locator('main input').first().inputValue()) === val;
}
const save = [];
save.push("loan 자동저장: " + await autosave("loan", "55555"));
save.push("bmi 자동저장: " + await autosave("bmi", "183"));
// uuid 대량 클램프 크래시 안 나는지
await page.goto(`${BASE}/t/uuid`, { waitUntil: "domcontentloaded" });
const before = errs.length;
const uin = page.locator('main input').first();
await uin.fill("999999999"); await page.waitForTimeout(300);
save.push("uuid 대량입력 크래시없음: " + (errs.length===before));

await browser.close();
console.log("=== 크래시/시각화 (기존 29) ===\n" + crash.join("\n"));
console.log("\n=== 자동저장/클램프 ===\n" + save.join("\n"));
console.log("\n총 errors:", errs.length ? errs.length : 0);
