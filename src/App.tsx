import { useEffect } from "react";
import { Link, Route, Routes, useParams } from "react-router-dom";
import Layout from "./components/Layout";
import { findTool, tools } from "./tools/registry";
import { findGame, games, localizeGame } from "./games/registry";
import { StarButton, useFavorites } from "./components/favorites";
import { localizeTool, useLang, useT } from "./components/i18n";
import { pushRecent } from "./components/recent";

const CARD =
  "rounded-xl border border-white/50 bg-white/60 backdrop-blur-sm transition-colors dark:border-white/10 dark:bg-zinc-900/50";

function Home() {
  const favs = useFavorites();
  const lang = useLang();
  const t = useT();
  const ordered = [
    ...tools.filter((tool) => favs.includes(tool.slug)),
    ...tools.filter((tool) => !favs.includes(tool.slug)),
  ];
  return (
    <div>
      {/* 히어로 */}
      <div className={`${CARD} px-5 py-7 sm:px-7 sm:py-9`}>
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {t("heroTitle")}
        </h2>
        <p className="mt-2 text-zinc-600 dark:text-zinc-300">{t("heroSub")}</p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="rounded-full bg-white/60 px-3 py-1 dark:bg-white/10">
            🎮 {games.length}
          </span>
          <span className="rounded-full bg-white/60 px-3 py-1 dark:bg-white/10">
            🧰 {tools.length}
          </span>
        </div>
      </div>

      {/* 게임 */}
      <section className="mt-8">
        <h3 className="text-xl font-bold">{t("homeGames")}</h3>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {t("homeGamesSub")}
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {games.map((game) => {
            const loc = localizeGame(game, lang);
            return (
              <Link
                key={game.slug}
                to={`/g/${game.slug}`}
                className={`${CARD} group flex flex-col gap-2 p-5 hover:border-violet-400/70 hover:bg-white/80 dark:hover:bg-zinc-900/70`}
              >
                <div className="text-3xl">{game.emoji}</div>
                <div className="text-lg font-semibold">{loc.name}</div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                  {loc.description}
                </div>
                <div className="mt-1 text-sm font-medium text-violet-600 dark:text-violet-300">
                  {t("playNow")}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 도구 */}
      <section className="mt-10">
        <h3 className="text-xl font-bold">{t("homeTools")}</h3>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {t("homeToolsSub")}
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {ordered.map((tool) => {
            const loc = localizeTool(tool, lang);
            return (
              <Link
                key={tool.slug}
                to={`/t/${tool.slug}`}
                className={`${CARD} group relative p-4 hover:border-violet-400/70 hover:bg-white/80 dark:hover:bg-zinc-900/70`}
              >
                <div className="absolute right-2 top-2">
                  <StarButton slug={tool.slug} size={18} />
                </div>
                <div className="pr-7 font-semibold text-zinc-900 dark:text-zinc-100">
                  {loc.name}
                </div>
                <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {loc.description}
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function ToolPage() {
  const { slug } = useParams();
  const lang = useLang();
  const t = useT();
  const tool = slug ? findTool(slug) : undefined;

  useEffect(() => {
    if (tool) pushRecent(tool.slug);
  }, [tool]);

  if (!tool) {
    return (
      <div>
        <h2 className="text-xl font-bold">{t("notFound")}</h2>
        <Link to="/" className="mt-2 inline-block text-violet-500">
          {t("back")}
        </Link>
      </div>
    );
  }

  const loc = localizeTool(tool, lang);
  const Body = tool.component;
  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold">{loc.name}</h2>
          <StarButton slug={tool.slug} />
        </div>
        <p className="mt-1 text-zinc-500 dark:text-zinc-400">
          {loc.description}
        </p>
      </div>
      <Body />
    </div>
  );
}

function GamePage() {
  const { slug } = useParams();
  const lang = useLang();
  const t = useT();
  const game = slug ? findGame(slug) : undefined;

  if (!game) {
    return (
      <div>
        <h2 className="text-xl font-bold">{t("gameNotFound")}</h2>
        <Link to="/" className="mt-2 inline-block text-violet-500">
          {t("back")}
        </Link>
      </div>
    );
  }

  const loc = localizeGame(game, lang);
  const Body = game.component;
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">
          {game.emoji} {loc.name}
        </h2>
        <p className="mt-1 text-zinc-500 dark:text-zinc-400">
          {loc.description}
        </p>
      </div>
      <Body />
    </div>
  );
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/t/:slug" element={<ToolPage />} />
        <Route path="/g/:slug" element={<GamePage />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </Layout>
  );
}
