// 사용: npm run photos  (캐시된 항목은 건너뜀 — 다시 찾으려면 photos.cache.json 에서 지우기)
// 레시피별 사진 URL 수집 → src/games/photos.ts
import { RECIPES } from "../src/games/recipes.ts";
import { writeFileSync, readFileSync, existsSync } from "node:fs";

const OUT = new URL("../src/games/photos.ts", import.meta.url);
const CACHE = new URL("./photos.cache.json", import.meta.url);
const cache = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, "utf8")) : {};

const UA = {
  headers: {
    "User-Agent": "multitool-fridge/1.0 (https://github.com/sung9155/multitool; personal recipe photo lookup)",
  },
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(host, params) {
  const u = new URL(`https://${host}/w/api.php`);
  u.searchParams.set("format", "json");
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  for (let attempt = 0; attempt < 4; attempt++) {
    await sleep(400); // 레이트리밋 예방
    const res = await fetch(u, UA);
    if (res.status === 429) {
      console.error("429 — waiting", host);
      await sleep(15000 * (attempt + 1));
      continue;
    }
    return res.json();
  }
  throw new Error("rate limited");
}

const norm = (s) => s.toLowerCase().replace(/[\s()·\-_]/g, "");
/** 검색 히트가 요리명과 실제로 관련 있는지 (제목 포함 관계) */
const related = (hitTitle, q) => {
  const a = norm(hitTitle);
  const b = norm(q);
  return a.includes(b); // 히트 제목이 요리명을 통째로 포함할 때만
};

const okImg = (src) => src && /\.(jpe?g|png|webp)/i.test(src) && !/\.svg/i.test(src);

async function pageImage(host, title) {
  const j = await api(host, { action: "query", prop: "pageimages", pithumbsize: "480", redirects: "1", titles: title });
  const p = Object.values(j?.query?.pages ?? {})[0];
  const src = p?.thumbnail?.source ?? "";
  return okImg(src) ? src : "";
}

async function searchImage(host, q) {
  const j = await api(host, { action: "query", list: "search", srsearch: q, srlimit: "5" });
  for (const hit of j?.query?.search ?? []) {
    if (!related(hit.title, q)) continue;
    const src = await pageImage(host, hit.title);
    if (src) return src;
  }
  return "";
}

async function commonsImage(q, must) {
  const j = await api("commons.wikimedia.org", {
    action: "query",
    generator: "search",
    gsrsearch: q,
    gsrnamespace: "6",
    gsrlimit: "8",
    prop: "imageinfo",
    iiprop: "url|mime",
    iiurlwidth: "480",
  });
  const pages = Object.values(j?.query?.pages ?? {}).sort((a, b) => a.index - b.index);
  // 사진(jpeg) 우선, png(제품 이미지·그래픽이 많음)는 차선
  for (const mime of [/image\/jpeg/, /image\/(png|webp)/]) {
    for (const p of pages) {
      const ii = p.imageinfo?.[0];
      if (must && !must.test(decodeURIComponent(p.title ?? ""))) continue;
      if (ii && mime.test(ii.mime) && ii.thumburl) return ii.thumburl;
    }
  }
  return "";
}

/** 위키 문서가 없는 요리 → 커먼즈 검색어 */
const EXTRA = {
  계란국: ["gyeran-guk", "korean egg soup"],
  소고기무국: ["beef radish soup korean", "mu-guk"],
  감자국: ["gamja-guk", "korean potato soup"],
  계란죽: ["korean rice porridge juk", "dakjuk"],
  참치마요덮밥: ["tuna donburi", "tuna rice bowl", "tuna mayo onigiri"],
  스팸계란덮밥: ["spam egg rice", "spam musubi"],
  참치주먹밥: ["jumeokbap"],
  계란라면: [{ q: "ramyeon", must: /^(?!.*jajang).*(ramyeon|ramyun|ramen)/i }, { q: "instant noodles egg", must: /ramen|noodle/i }],
  스팸김치볶음: [{ q: "spam kimchi fried", must: /^(?!.*K-SPAM).*spam/i }, { q: "kimchi fried rice with spam", must: /kimchi/i }, { q: "spam fried", must: /^(?!.*K-SPAM).*spam/i }],
  소시지야채볶음: [{ q: "fried sausages vegetables", must: /^(?!.*stew).*sausage/i }, { q: "sausage pan fried", must: /^(?!.*stew).*sausage/i }, { q: "bratwurst pan", must: /bratwurst|sausage/i }],
  애호박볶음: ["aehobak-bokkeum", "aehobak", "korean zucchini side dish"],
  버섯볶음: ["beoseot-bokkeum", "stir-fried mushrooms"],
  브로콜리무침: ["broccoli salad", "blanched broccoli", "broccoli side dish"],
  // 검색이 엉뚱한 사진을 고른 항목 — 직접 지정
  새우볶음밥: ["shrimp fried rice"],
  계란볶음밥: ["egg fried rice"],
  비빔국수: ["bibim-guksu", "bibim guksu"],
  감자조림: ["gamja-jorim", "braised potatoes soy sauce"],
  멸치볶음: ["myeolchi-bokkeum", "stir-fried anchovies"],
  시금치나물: ["sigeumchi-namul", "spinach namul"],
  가지나물: [{ q: "steamed eggplant", must: /^(?!.*(dried|jar|pattern|plant)).*eggplant/i }, { q: "eggplant side dish", must: /^(?!.*(dried|jar|pattern)).*eggplant/i }, { q: "aubergine dish", must: /aubergine|eggplant/i }],
  오이무침: ["oi-muchim", "korean cucumber salad"],
  감자수프: ["cream of potato soup", "potato soup bowl"],
  참치마요덮밥: ["tuna donburi", "tuna rice bowl", "tuna mayo onigiri"],
  감자국: ["gamja-guk", "korean potato soup"],
  배추볶음: [{ q: "baechu bokkeum", must: /baechu/i }, { q: "stir-fried cabbage", must: /cabbage/i }],
  감자채볶음: [{ q: "tudousi", must: /tudou|potato/i }, { q: "Chinese shredded potato", must: /potato/i }, { q: "potato stir fry", must: /potato/i }],
  부추전: ["buchujeon", "buchu-jeon chive pancake"],
  청경채볶음: ["stir-fried bok choy", "bok choy garlic"],
  배추볶음: [{ q: "baechu bokkeum", must: /baechu/i }, { q: "stir-fried cabbage", must: /cabbage/i }],
  감자채볶음: [{ q: "tudousi", must: /tudou|potato/i }, { q: "Chinese shredded potato", must: /potato/i }, { q: "potato stir fry", must: /potato/i }],
  마늘새우볶음: ["garlic shrimp stir fry", "garlic prawns"],
};

async function find(rc) {
  const ko = rc.wiki ?? rc.name;
  const steps = [
    ...(EXTRA[rc.name] ?? []).map((e) => {
      const q = typeof e === "string" ? e : e.q;
      const must = typeof e === "string" ? undefined : e.must;
      return [`commons:${q}`, () => commonsImage(q, must)];
    }),
    ["ko-page", () => pageImage("ko.wikipedia.org", ko)],
    ["en-page", () => (rc.en ? pageImage("en.wikipedia.org", rc.en) : "")],
    ["ko-search", () => searchImage("ko.wikipedia.org", rc.name)],
    ["en-search", () => (rc.en ? searchImage("en.wikipedia.org", rc.en) : "")],
    ["commons", () => commonsImage(`${rc.en ?? rc.name} food`)],
    ["commons-ko", () => commonsImage(rc.name)],
  ];
  for (const [how, fn] of steps) {
    try {
      const src = await fn();
      if (src) return { src, how };
    } catch (e) {
      console.error(rc.name, how, e.message);
    }
    await sleep(80);
  }
  return { src: "", how: "none" };
}

const out = {};
const stats = {};
for (const rc of RECIPES) {
  if (cache[rc.name]) {
    out[rc.name] = cache[rc.name];
    stats[cache[rc.name].how] = (stats[cache[rc.name].how] ?? 0) + 1;
    continue;
  }
  const r = await find(rc);
  out[rc.name] = r;
  cache[rc.name] = r;
  writeFileSync(CACHE, JSON.stringify(cache, null, 1));
  stats[r.how] = (stats[r.how] ?? 0) + 1;
  console.log(`${r.how.padEnd(10)} ${rc.name}`);
}

const missing = Object.entries(out).filter(([, v]) => !v.src).map(([k]) => k);
console.log("\nstats", stats, "\nmissing", missing);

const lines = Object.entries(out)
  .filter(([, v]) => v.src)
  .map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v.src.replace(/\?utm_.*$/, ""))},`);
writeFileSync(
  OUT,
  `/** 레시피 사진 (위키백과/커먼즈 썸네일) — scripts/findPhotos.mjs 로 생성 */\nexport const PHOTOS: Record<string, string> = {\n${lines.join("\n")}\n};\n`,
);
console.log("written", lines.length, "/", RECIPES.length);
