import { Link, Route, Routes, useParams } from "react-router-dom";
import Layout from "./components/Layout";
import { findTool, tools } from "./tools/registry";

function Home() {
  return (
    <div>
      <h2 className="text-2xl font-bold">일상 · 개발 도구 모음</h2>
      <p className="mt-1 text-zinc-500 dark:text-zinc-400">
        자주 쓰는 유틸을 한곳에. 아래에서 골라 바로 사용.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {tools.map((t) => (
          <Link
            key={t.slug}
            to={`/t/${t.slug}`}
            className="rounded-lg border border-zinc-200 bg-white p-4 transition-colors hover:border-indigo-500/50 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:bg-zinc-900"
          >
            <div className="font-semibold text-zinc-900 dark:text-zinc-100">
              {t.name}
            </div>
            <div className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {t.description}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function ToolPage() {
  const { slug } = useParams();
  const tool = slug ? findTool(slug) : undefined;

  if (!tool) {
    return (
      <div>
        <h2 className="text-xl font-bold">도구를 찾을 수 없음</h2>
        <Link to="/" className="mt-2 inline-block text-indigo-400">
          ← 홈으로
        </Link>
      </div>
    );
  }

  const Body = tool.component;
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">{tool.name}</h2>
        <p className="mt-1 text-zinc-500 dark:text-zinc-400">
          {tool.description}
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
