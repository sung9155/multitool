import { useEffect, useMemo, useState } from "react";
import { useLang, type Lang } from "../components/i18n";
import { useToolStateJSON } from "../components/toolState";
import {
  INGREDIENTS,
  RECIPE_CATS,
  STAPLES,
  matchRecipes,
  type IngCat,
  type Match,
  type Recipe,
  type RecipeCat,
} from "./recipes";

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
    results: "만들 수 있는 요리",
    time: "조리시간",
    all: "전체",
    within: "분 이내",
    missingAllow: "부족 재료",
    ready: "바로 가능",
    moreN: "개만 더",
    serves: "인분",
    min: "분",
    need: "필요",
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
    results: "What you can cook",
    time: "Cook time",
    all: "All",
    within: " min or less",
    missingAllow: "Missing allowed",
    ready: "Ready now",
    moreN: " more needed",
    serves: " servings",
    min: " min",
    need: "Needs",
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
    results: "可以做的菜",
    time: "烹饪时间",
    all: "全部",
    within: " 分钟内",
    missingAllow: "允许缺少",
    ready: "马上能做",
    moreN: " 样即可",
    serves: " 人份",
    min: " 分钟",
    need: "需要",
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
};

const CARD =
  "rounded-xl border border-white/50 bg-white/60 backdrop-blur-sm dark:border-white/10 dark:bg-zinc-900/50";
const BTN2 =
  "rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800";

const chip = (on: boolean) =>
  `rounded-full px-3 py-1 text-sm transition-colors ${
    on
      ? "bg-violet-600 text-white"
      : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
  }`;

/** 위키백과 대표 이미지 — localStorage 캐시, 없으면 null */
function useWikiThumb(title: string): string | null | undefined {
  const key = `wthumb:${title}`;
  const [url, setUrl] = useState<string | null | undefined>(() => {
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
    const api =
      "https://ko.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&pithumbsize=480&redirects=1&origin=*&titles=" +
      encodeURIComponent(title);
    fetch(api)
      .then((res) => res.json())
      .then((j) => {
        const pages = j?.query?.pages ?? {};
        const first = Object.values(pages)[0] as
          | { thumbnail?: { source?: string } }
          | undefined;
        const src = first?.thumbnail?.source ?? "";
        try {
          localStorage.setItem(key, src);
        } catch {
          /* 무시 */
        }
        if (alive) setUrl(src || null);
      })
      .catch(() => alive && setUrl(null));
    return () => {
      alive = false;
    };
  }, [title, key, url]);
  return url;
}

function Thumb({ recipe }: { recipe: Recipe }) {
  const url = useWikiThumb(recipe.wiki ?? recipe.name);
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
  const { recipe, missing, optHave } = m;
  const ready = missing.length === 0;
  return (
    <div className={`${CARD} overflow-hidden`}>
      <Thumb recipe={recipe} />
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
          {recipe.req.map((i) => (
            <span
              key={i}
              className={`rounded px-1.5 py-0.5 ${
                missing.includes(i)
                  ? "bg-red-100 text-red-600 line-through dark:bg-red-600/20 dark:text-red-300"
                  : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              }`}
            >
              {i}
            </span>
          ))}
          {recipe.opt.map((i) => (
            <span
              key={i}
              className={`rounded border border-dashed px-1.5 py-0.5 ${
                optHave.includes(i)
                  ? "border-violet-400 text-violet-600 dark:text-violet-300"
                  : "border-zinc-300 text-zinc-400 dark:border-zinc-600"
              }`}
              title={s("nice")}
            >
              +{i}
            </span>
          ))}
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

  const [pantry, setPantry] = useToolStateJSON<string[]>("p", []);
  const [folded, setFolded] = useState(() => pantry.length > 0);
  const [q, setQ] = useState("");
  const [maxMin, setMaxMin] = useState(0); // 0 = 전체
  const [cat, setCat] = useState<RecipeCat | "">("");
  const [allowMissing, setAllowMissing] = useState(1);
  const [copied, setCopied] = useState(false);

  const have = useMemo(() => new Set(pantry), [pantry]);
  const toggle = (id: string) =>
    setPantry((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const matches = useMemo(() => matchRecipes(pantry), [pantry]);
  const shown = matches.filter(
    (m) =>
      m.missing.length <= allowMissing &&
      (maxMin === 0 || m.recipe.min <= maxMin) &&
      (cat === "" || m.recipe.cat === cat),
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
          <span className="text-sm font-normal text-zinc-500">{shown.length}</span>
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
