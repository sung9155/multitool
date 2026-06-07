import { chromium } from "playwright";
const BASE = "http://localhost:4173";
const slugs = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
const page = await (await browser.newContext({ viewport: { width: 1100, height: 900 } })).newPage();
const errs = [];
page.on("pageerror", (e) => errs.push(e.message));
page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
const EVIL = ["", "abc", "1e308"];
for (const t of slugs) {
  const before = errs.length;
  let line;
  try {
    await page.goto(`${BASE}/t/${t}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(60);
    const inputs = page.locator('main input:not([type="checkbox"]):not([type="range"]):not([type="date"]), main textarea');
    const n = await inputs.count();
    for (let i = 0; i < n; i++) {
      const el = inputs.nth(i);
      if (!(await el.isVisible().catch(()=>false)) || await el.isDisabled().catch(()=>false)) continue;
      for (const v of EVIL) await el.fill(v).catch(()=>{});
    }
    await page.waitForTimeout(60);
    const mainLen = (await page.locator("main").innerText().catch(()=>"")).length;
    const viz = (await page.locator("main svg, main table").count()) > 0;
    const ne = errs.slice(before);
    line = `${(mainLen>5 && ne.length===0)?"OK ":"ERR"} ${t.padEnd(13)} viz:${viz} ${ne.length?[...new Set(ne)].join("|").slice(0,90):""}`;
  } catch (e) {
    line = `CRASH ${t.padEnd(13)} ${e.message.slice(0,60)}`;
    try { await page.goto("about:blank"); } catch {}
  }
  process.stdout.write(line + "\n");
}
await browser.close();
