import { useEffect } from "react";
import { Link, Route, Routes, useParams } from "react-router-dom";
import Layout from "./components/Layout";
import { findTool, tools } from "./tools/registry";
import { StarButton, useFavorites } from "./components/favorites";
import { localizeTool, useLang, useT } from "./components/i18n";
import { pushRecent } from "./components/recent";

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
      <h2 className="text-2xl font-bold">{t("homeTitle")}</h2>
      <p className="mt-1 text-zinc-500 dark:text-zinc-400">{t("homeSub")}</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {ordered.map((tool) => {
          const loc = localizeTool(tool, lang);
          return (
            <Link
              key={tool.slug}
              to={`/t/${tool.slug}`}
              className="group relative rounded-lg border border-zinc-200 bg-white p-4 transition-colors hover:border-indigo-500/50 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:bg-zinc-900"
            >
              <div className="absolute right-2 top-2">
                <StarButton slug={tool.slug} size={18} />
              </div>
              <div className="pr-7 font-semibold text-zinc-900 dark:text-zinc-100">
                {loc.name}
              </div>
              <div className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {loc.description}
              </div>
            </Link>
          );
        })}
      </div>
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
        <Link to="/" className="mt-2 inline-block text-indigo-400">
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

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/t/:slug" element={<ToolPage />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </Layout>
  );
}
