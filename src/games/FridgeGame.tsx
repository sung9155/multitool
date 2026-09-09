import { useEffect, useMemo, useState } from "react";
import { useLang, type Lang } from "../components/i18n";
import { useToolStateJSON } from "../components/toolState";
import {
  CUISINES,
  INGREDIENTS,
  RECIPE_CATS,
  STAPLES,
  matchRecipes,
  seasonalIngredients,
  type Cuisine,
  type IngCat,
  type Match,
  type Recipe,
  type RecipeCat,
} from "./recipes";
import { PHOTOS } from "./photos";

const L10N: Record<Lang, Record<string, string>> = {
  ko: {
    pantry: "내 냉장고",
    pantrySub: "가진 재료를 눌러 체크하세요. 자동 저장되고, 주소를 복사하면 다른 기기에서도 그대로 열립니다.",
    staples: "기본 양념은 항상 있다고 가정",
    search: "재료 검색…",
    clear: "전체 해제",
    fold: "접기",
    unfold: "재료 고르기",
    selected: "개 선택",
    copyLink: "🔗 주소 복사",
    copied: "복사됨!",
    season: "월의 제철 재료",
    seasonSub: "지금 맛있고 싼 재료 — 눌러서 냉장고에 담으면 제철 요리가 위로 올라옵니다.",
    seasonFirst: "🌱 제철 우선",
    seasonOnly: "제철 요리만",
    seasonal: "제철",
    results: "만들 수 있는 요리",
    time: "조리시간",
    all: "전체",
    within: "분 이내",
    missingAllow: "부족 재료",
    cuisine: "종류",
    ready: "바로 가능",
    moreN: "개만 더",
    serves: "인분",
    min: "분",
    nice: "있으면 좋음",
    steps: "만드는 법",
    none: "조건에 맞는 요리가 없어요 — 재료를 더 체크하거나 부족 재료 허용을 늘려보세요.",
    emptyPantry: "재료를 아직 안 골랐어요. 위에서 냉장고에 있는 재료를 체크해보세요!",
  },
  en: {
    pantry: "My fridge",
    pantrySub: "Tap what you have. Saved automatically; copy the link to open the same list on another device.",
    staples: "Assume basic seasonings are on hand",
    search: "Search ingredients…",
    clear: "Clear all",
    fold: "Collapse",
    unfold: "Pick ingredients",
    selected: " selected",
    copyLink: "🔗 Copy link",
    copied: "Copied!",
    season: " — in season now",
    seasonSub: "Tasty and cheap right now — tap to add to your fridge and seasonal dishes float up.",
    seasonFirst: "🌱 Seasonal first",
    seasonOnly: "Seasonal only",
    seasonal: "In season",
    results: "What you can cook",
    time: "Cook time",
    all: "All",
    within: " min or less",
    missingAllow: "Missing allowed",
    cuisine: "Cuisine",
    ready: "Ready now",
    moreN: " more needed",
    serves: " servings",
    min: " min",
    nice: "Nice to have",
    steps: "Steps",
    none: "Nothing matches — check more ingredients or allow more missing items.",
    emptyPantry: "No ingredients picked yet. Check what's in your fridge above!",
  },
  zh: {
    pantry: "我的冰箱",
    pantrySub: "点选你有的食材。自动保存；复制链接可在其他设备打开同一列表。",
    staples: "假设基础调料常备",
    search: "搜索食材…",
    clear: "全部清除",
    fold: "收起",
    unfold: "选择食材",
    selected: " 项已选",
    copyLink: "🔗 复制链接",
    copied: "已复制！",
    season: "月的时令食材",
    seasonSub: "现在好吃又便宜 — 点一下放进冰箱，时令菜就会排到前面。",
    seasonFirst: "🌱 时令优先",
    seasonOnly: "只看时令菜",
    seasonal: "时令",
    results: "可以做的菜",
    time: "烹饪时间",
    all: "全部",
    within: " 分钟内",
    missingAllow: "允许缺少",
    cuisine: "菜系",
    ready: "马上能做",
    moreN: " 样即可",
    serves: " 人份",
    min: " 分钟",
    nice: "有更好",
    steps: "做法",
    none: "没有符合条件的菜 — 多选一些食材或放宽缺少数量。",
    emptyPantry: "还没选食材。在上面勾选冰箱里有的东西吧！",
  },
};

const ING_CATS: IngCat[] = ["육류·해산물", "채소", "가공·유제품", "곡물·면", "양념"];

const CAT_EMOJI: Record<RecipeCat, string> = {
  "국·찌개": "🍲",
  밥: "🍚",
  면: "🍜",
  "볶음·구이": "🍳",
  반찬: "🥗",
  "간식·분식": "🥞",
  "샐러드·빵": "🥪",
};

const CUISINE_EMOJI: Record<Cuisine, string> = {
  한식: "🇰🇷",
  중식: "🇨🇳",
  일식: "🇯🇵",
  양식: "🍝",
  남미: "🌮",
  동남아: "🌶️",
};

const CARD =
  "rounded-xl border border-white/50 bg-white/60 backdrop-blur-sm dark:border-white/10 dark:bg-zinc-900/50";
const BTN2 =
  "rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800";

const chip = (on: boolean, tone: "violet" | "green" = "violet") =>
  `rounded-full px-3 py-1 text-sm transition-colors ${
    on
      ? tone === "green"
        ? "bg-emerald-600 text-white"
        : "bg-violet-600 text-white"
      : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
  }`;

async function fetchThumb(host: string, title: string): Promise<string> {
  const api =
    `https://${host}/w/api.php?action=query&prop=pageimages&format=json&pithumbsize=480&redirects=1&origin=*&titles=` +
    encodeURIComponent(title);
  const j = await (await fetch(api)).json();
  const first = Object.values(j?.query?.pages ?? {})[0] as
    | { thumbnail?: { source?: string } }
    | undefined;
  return first?.thumbnail?.source ?? "";
}

/**
 * 요리 사진 — 빌드 시 수집한 PHOTOS 정적 매핑 우선.
 * 없으면 위키백과 대표 이미지(ko → en)를 런타임 조회해 localStorage 캐시.
 */
function useWikiThumb(ko: string, en?: string, preset?: string): string | null | undefined {
  const key = `wthumb:${ko}`;
  const [url, setUrl] = useState<string | null | undefined>(() => {
    if (preset) return preset;
    try {
      const c = localStorage.getItem(key);
      if (c !== null) return c || null;
    } catch {
      /* 무시 */
    }
    return undefined;
  });
  useEffect(() => {
    if (url !== undefined) return;
    let alive = true;
    (async () => {
      let src = "";
      try {
        src = await fetchThumb("ko.wikipedia.org", ko);
        if (!src && en) src = await fetchThumb("en.wikipedia.org", en);
      } catch {
        /* 네트워크 실패 → 폴백 */
      }
      try {
        localStorage.setItem(key, src);
      } catch {
        /* 무시 */
      }
      if (alive) setUrl(src || null);
    })();
    return () => {
      alive = false;
    };
  }, [ko, en, key, url]);
  return url;
}

function Thumb({ recipe }: { recipe: Recipe }) {
  const url = useWikiThumb(recipe.wiki ?? recipe.name, recipe.en, PHOTOS[recipe.name]);
  return (
    <div className="flex aspect-[4/3] w-full items-center justify-center overflow-hidden bg-gradient-to-br from-amber-100 to-orange-200 text-5xl dark:from-zinc-800 dark:to-zinc-700">
      {url ? (
        <img
          src={url}
          alt={recipe.name}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      ) : (
        <span>{CAT_EMOJI[recipe.cat]}</span>
      )}
    </div>
  );
}

function RecipeCard({ m, s }: { m: Match; s: (k: string) => string }) {
  const [open, setOpen] = useState(false);
  const { recipe, missing, optHave, seasonal } = m;
  const ready = missing.length === 0;
  const ingChip = (i: string, required: boolean) => {
    const isMissing = required && missing.includes(i);
    const has = required ? !isMissing : optHave.includes(i);
    const inSeason = seasonal.includes(i);
    return (
      <span
        key={(required ? "r" : "o") + i}
        className={`rounded px-1.5 py-0.5 ${required ? "" : "border border-dashed"} ${
          isMissing
            ? "bg-red-100 text-red-600 line-through dark:bg-red-600/20 dark:text-red-300"
            : inSeason
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-600/20 dark:text-emerald-300"
              : required
                ? "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                : has
                  ? "border-violet-400 text-violet-600 dark:text-violet-300"
                  : "border-zinc-300 text-zinc-400 dark:border-zinc-600"
        }`}
        title={required ? undefined : s("nice")}
      >
        {required ? "" : "+"}
        {inSeason ? "🌱" : ""}
        {i}
      </span>
    );
  };
  return (
    <div className={`${CARD} overflow-hidden`}>
      <div className="relative">
        <Thumb recipe={recipe} />
        <span className="absolute left-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-xs font-medium text-white backdrop-blur">
          {CUISINE_EMOJI[recipe.cuisine]} {recipe.cuisine}
        </span>
        {seasonal.length > 0 && (
          <span className="absolute right-2 top-2 rounded-full bg-emerald-600/90 px-2 py-0.5 text-xs font-semibold text-white">
            🌱 {s("seasonal")}
          </span>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start gap-2">
          <h4 className="text-lg font-bold">{recipe.name}</h4>
          <span
            className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
              ready
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-600/20 dark:text-emerald-300"
                : "bg-amber-100 text-amber-700 dark:bg-amber-600/20 dark:text-amber-300"
            }`}
          >
            {ready ? `✓ ${s("ready")}` : `${missing.length}${s("moreN")}`}
          </span>
        </div>
        <div className="mt-1 flex flex-wrap gap-x-3 text-sm text-zinc-500">
          <span>
            ⏱ {recipe.min}
            {s("min")}
          </span>
          <span>
            🍽 {recipe.serves}
            {s("serves")}
          </span>
          <span>
            {CAT_EMOJI[recipe.cat]} {recipe.cat}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1 text-xs">
          {recipe.req.map((i) => ingChip(i, true))}
          {recipe.opt.map((i) => ingChip(i, false))}
        </div>
        <button
          onClick={() => setOpen((o) => !o)}
          className="mt-3 text-sm font-medium text-violet-600 dark:text-violet-300"
        >
          {open ? "▾" : "▸"} {s("steps")}
        </button>
        {open && (
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-zinc-700 dark:text-zinc-300">
            {recipe.steps.map((st, i) => (
              <li key={i}>{st}</li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

export default function FridgeGame() {
  const lang = useLang();
  const s = (k: string) => L10N[lang][k] ?? L10N.ko[k] ?? k;
  const month = new Date().getMonth() + 1;

  const [pantry, setPantry] = useToolStateJSON<string[]>("p", []);
  const [folded, setFolded] = useState(() => pantry.length > 0);
  const [q, setQ] = useState("");
  const [maxMin, setMaxMin] = useState(0); // 0 = 전체
  const [cat, setCat] = useState<RecipeCat | "">("");
  const [cuisine, setCuisine] = useState<Cuisine | "">("");
  const [allowMissing, setAllowMissing] = useState(1);
  const [seasonFirst, setSeasonFirst] = useState(true);
  const [seasonOnly, setSeasonOnly] = useState(false);
  const [copied, setCopied] = useState(false);

  const have = useMemo(() => new Set(pantry), [pantry]);
  const toggle = (id: string) =>
    setPantry((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const seasonIds = seasonalIngredients(month);
  const matches = useMemo(
    () => matchRecipes(pantry, { month, seasonFirst }),
    [pantry, month, seasonFirst],
  );
  const shown = matches.filter(
    (m) =>
      m.missing.length <= allowMissing &&
      (maxMin === 0 || m.recipe.min <= maxMin) &&
      (cat === "" || m.recipe.cat === cat) &&
      (cuisine === "" || m.recipe.cuisine === cuisine) &&
      (!seasonOnly || m.seasonal.length > 0),
  );

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* 무시 */
    }
  };

  const query = q.trim();

  return (
    <div className="space-y-5">
      {/* 냉장고 */}
      <section className={`${CARD} p-4`}>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold">
            🧊 {s("pantry")}{" "}
            <span className="text-sm font-normal text-zinc-500">
              {pantry.length}
              {s("selected")}
            </span>
          </h3>
          <div className="ml-auto flex gap-2">
            <button className={BTN2} onClick={copyLink}>
              {copied ? s("copied") : s("copyLink")}
            </button>
            <button
              className={BTN2}
              disabled={pantry.length === 0}
              onClick={() => setPantry([])}
            >
              {s("clear")}
            </button>
            <button className={BTN2} onClick={() => setFolded((f) => !f)}>
              {folded ? s("unfold") : s("fold")}
            </button>
          </div>
        </div>
        <p className="mt-1 text-xs text-zinc-500">{s("pantrySub")}</p>

        {folded ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {pantry.map((id) => (
              <button key={id} className={chip(true)} onClick={() => toggle(id)}>
                {id} ×
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={s("search")}
              className="w-full rounded-md border border-zinc-300 bg-white/70 px-3 py-2 text-sm outline-none focus:border-violet-500 dark:border-zinc-600 dark:bg-zinc-900/60"
            />
            {ING_CATS.map((c) => {
              const items = INGREDIENTS.filter(
                (i) => i.cat === c && (!query || i.id.includes(query)),
              );
              if (items.length === 0) return null;
              return (
                <div key={c}>
                  <div className="mb-1.5 text-xs font-semibold text-zinc-500">{c}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {items.map((i) => (
                      <button
                        key={i.id}
                        className={chip(have.has(i.id))}
                        onClick={() => toggle(i.id)}
                      >
                        {seasonIds.includes(i.id) ? "🌱" : ""}
                        {i.id}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
            <p className="text-xs text-zinc-400">
              ✓ {s("staples")}: {STAPLES.join(", ")}
            </p>
          </div>
        )}
      </section>

      {/* 제철 */}
      <section className="rounded-xl border border-emerald-200/70 bg-emerald-50/70 p-4 backdrop-blur-sm dark:border-emerald-500/20 dark:bg-emerald-900/20">
        <h3 className="font-semibold text-emerald-800 dark:text-emerald-300">
          🌱 {month}
          {s("season")}
        </h3>
        <p className="mt-1 text-xs text-emerald-700/80 dark:text-emerald-300/70">
          {s("seasonSub")}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {seasonIds.map((id) => (
            <button key={id} className={chip(have.has(id), "green")} onClick={() => toggle(id)}>
              {have.has(id) ? "✓ " : ""}
              {id}
            </button>
          ))}
        </div>
      </section>

      {/* 필터 */}
      <section className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        <div className="flex items-center gap-1.5">
          <span className="text-zinc-500">{s("time")}</span>
          {[0, 15, 30, 60].map((m) => (
            <button key={m} className={chip(maxMin === m)} onClick={() => setMaxMin(m)}>
              {m === 0 ? s("all") : `${m}${s("within")}`}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-zinc-500">{s("missingAllow")}</span>
          {[0, 1, 2, 9].map((k) => (
            <button
              key={k}
              className={chip(allowMissing === k)}
              onClick={() => setAllowMissing(k)}
            >
              {k === 9 ? s("all") : k}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <button className={chip(seasonFirst, "green")} onClick={() => setSeasonFirst((v) => !v)}>
            {s("seasonFirst")}
          </button>
          <button className={chip(seasonOnly, "green")} onClick={() => setSeasonOnly((v) => !v)}>
            {s("seasonOnly")}
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-zinc-500">{s("cuisine")}</span>
          <button className={chip(cuisine === "")} onClick={() => setCuisine("")}>
            {s("all")}
          </button>
          {CUISINES.map((c) => (
            <button key={c} className={chip(cuisine === c)} onClick={() => setCuisine(c)}>
              {CUISINE_EMOJI[c]} {c}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button className={chip(cat === "")} onClick={() => setCat("")}>
            {s("all")}
          </button>
          {RECIPE_CATS.map((c) => (
            <button key={c} className={chip(cat === c)} onClick={() => setCat(c)}>
              {CAT_EMOJI[c]} {c}
            </button>
          ))}
        </div>
      </section>

      {/* 결과 */}
      <section>
        <h3 className="mb-3 font-semibold">
          🍳 {s("results")}{" "}
          <span className="text-sm font-normal text-zinc-500">
            {shown.length} / {matches.length}
          </span>
        </h3>
        {pantry.length === 0 && allowMissing < 9 ? (
          <p className="text-sm text-zinc-500">{s("emptyPantry")}</p>
        ) : shown.length === 0 ? (
          <p className="text-sm text-zinc-500">{s("none")}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((m) => (
              <RecipeCard key={m.recipe.name} m={m} s={s} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
