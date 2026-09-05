import { useCallback, useEffect, useRef, useState } from "react";
import GameFrame from "./frame";
import { getBest, saveBest } from "./registry";
import { useT } from "../components/i18n";
import { sliceBlock, type Span } from "./logic";
import { drawBox, drawSkyline, isoX, isoY } from "./iso";

const W = 360;
const H = 520;
const BH = 22; // 블록 두께 (화면 px)
const BASE = 86; // 첫 블록 한 변 (지면 단위)
const ORIGIN_X = W / 2;
const BASE_Y = 396; // 1층 윗면 화면 높이
const TOP_LINE = 205; // 탑 꼭대기가 유지될 화면 높이
const TOL = 3; // 퍼펙트 허용 오차
const REGROW = 5; // 퍼펙트 시 되살아나는 크기

/** 지면 중심(cx,cz)과 한 변(w: x축, d: z축) */
type Block = { cx: number; cz: number; w: number; d: number; hue: number };
type Debris = Block & { level: number; y: number; vy: number; life: number };

interface State {
  blocks: Block[];
  cur: Block & { dir: 1 | -1; axis: Axis };
  debris: Debris[];
  cam: number;
  flash: number;
  combo: number;
  toast: { text: string; life: number } | null;
  over: boolean;
  score: number;
}

const hueOf = (i: number) => (196 + i * 9) % 360;
type Axis = "x" | "z";
const other = (a: Axis): Axis => (a === "x" ? "z" : "x");

function init(): State {
  const base: Block = { cx: 0, cz: 0, w: BASE, d: BASE, hue: hueOf(0) };
  return {
    blocks: [base],
    cur: { ...base, cx: -118, hue: hueOf(1), dir: 1, axis: "x" },
    debris: [],
    cam: 0,
    flash: 0,
    combo: 0,
    toast: null,
    over: false,
    score: 0,
  };
}

/** 블록의 이동축 구간 (sliceBlock 용) */
const spanOf = (b: Block, axis: "x" | "z"): Span =>
  axis === "x"
    ? { x: b.cx - b.w / 2, w: b.w }
    : { x: b.cz - b.d / 2, w: b.d };

export default function StackGame() {
  const t = useT();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const st = useRef<State>(init());
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [over, setOver] = useState(false);

  useEffect(() => setBest(getBest("stack")), []);

  const restart = useCallback(() => {
    st.current = init();
    setScore(0);
    setOver(false);
  }, []);

  const drop = useCallback(() => {
    const s = st.current;
    if (s.over) return;
    const level = s.blocks.length; // 지금 놓으려는 층
    const axis = s.cur.axis;
    const prev = s.blocks[level - 1];
    const r = sliceBlock(spanOf(prev, axis), spanOf(s.cur, axis), TOL);

    if (!r.hit) {
      // 완전히 빗나감 → 통째로 떨어지고 종료
      s.debris.push({ ...s.cur, level, y: 0, vy: 0, life: 1 });
      s.over = true;
      setOver(true);
      setBest(saveBest("stack", s.score));
      return;
    }

    // 잘려나간 조각
    if (r.cut) {
      const cut: Block = {
        ...prev,
        hue: s.cur.hue,
        ...(axis === "x"
          ? { cx: r.cut.x + r.cut.w / 2, w: r.cut.w }
          : { cz: r.cut.x + r.cut.w / 2, d: r.cut.w }),
      };
      s.debris.push({ ...cut, level, y: 0, vy: 0, life: 1 });
      s.combo = 0;
    } else {
      s.flash = 0.4;
      s.combo += 1;
    }

    // 남은 블록 (퍼펙트면 조금 되살아난다)
    const grow = r.perfect ? Math.min(REGROW, BASE - r.w) : 0;
    const size = r.w + grow;
    const center = r.x + r.w / 2;
    const placed: Block = {
      ...prev,
      hue: s.cur.hue,
      ...(axis === "x"
        ? { cx: center, w: size }
        : { cz: center, d: size }),
    };
    s.blocks.push(placed);
    s.score += r.perfect ? 2 : 1;
    if (r.perfect) {
      s.toast = {
        text: s.combo > 1 ? `PERFECT ×${s.combo}` : "PERFECT",
        life: 0.8,
      };
    }
    setScore(s.score);

    // 다음 블록: 반대편 끝에서 다른 축으로 출발
    const nextAxis = other(axis);
    const dir: 1 | -1 = s.cur.dir === 1 ? -1 : 1;
    s.cur = {
      ...placed,
      hue: hueOf(level + 1),
      dir,
      axis: nextAxis,
      ...(nextAxis === "x"
        ? { cx: dir === 1 ? -118 : 118 }
        : { cz: dir === 1 ? -118 : 118 }),
    };
  }, []);

  // 입력: 탭 / 스페이스 · 엔터
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space" && e.code !== "Enter") return;
      e.preventDefault();
      if (st.current.over) restart();
      else drop();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drop, restart]);

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cvs.width = W * dpr;
    cvs.height = H * dpr;
    ctx.scale(dpr, dpr);

    let raf = 0;
    let last = performance.now();

    const update = (dt: number) => {
      const s = st.current;
      if (s.flash > 0) s.flash -= dt;
      if (s.toast) {
        s.toast.life -= dt;
        if (s.toast.life <= 0) s.toast = null;
      }

      if (!s.over) {
        const axis = s.cur.axis;
        const speed = Math.min(85 + s.score * 4, 260);
        const pos = (axis === "x" ? s.cur.cx : s.cur.cz) + s.cur.dir * speed * dt;
        const limit = 118;
        let dir = s.cur.dir;
        let next = pos;
        if (pos < -limit) {
          next = -limit;
          dir = 1;
        } else if (pos > limit) {
          next = limit;
          dir = -1;
        }
        s.cur.dir = dir;
        if (axis === "x") s.cur.cx = next;
        else s.cur.cz = next;
      }

      for (const d of s.debris) {
        d.vy += 1300 * dt;
        d.y += d.vy * dt;
        d.life -= dt * 0.7;
      }
      s.debris = s.debris.filter((d) => d.life > 0 && d.y < H + 300);

      const towerTop = BASE_Y - (s.blocks.length + 1) * BH;
      const want = Math.max(0, TOP_LINE - towerTop);
      s.cam += (want - s.cam) * Math.min(1, dt * 6);
    };

    /** 층 i 의 윗면 화면 좌표 */
    const facePos = (b: Block, level: number, extraY = 0) => ({
      sx: ORIGIN_X + isoX(b.cx, b.cz),
      sy: BASE_Y - level * BH + isoY(b.cx, b.cz) + st.current.cam + extraY,
    });

    const paint = (b: Block, level: number, extraY = 0, alpha = 1) => {
      const { sx, sy } = facePos(b, level, extraY);
      if (sy < -80 || sy > H + 120) return null;
      ctx.globalAlpha = alpha;
      const box = drawBox(
        ctx,
        sx,
        sy,
        b.w / 2,
        b.d / 2,
        BH,
        `hsl(${b.hue} 55% 72%)`,
        `hsl(${b.hue} 45% 55%)`,
        `hsl(${b.hue} 40% 40%)`,
      );
      ctx.globalAlpha = 1;
      return box;
    };

    const draw = () => {
      const s = st.current;
      ctx.clearRect(0, 0, W, H);
      drawSkyline(ctx, W, 0, 320);

      // 탑 바닥 그림자
      const g = facePos(s.blocks[0], 0);
      ctx.fillStyle = "rgba(10,14,34,0.22)";
      ctx.beginPath();
      ctx.ellipse(g.sx, g.sy + BH + 10, BASE * 0.8, BASE * 0.34, 0, 0, Math.PI * 2);
      ctx.fill();

      // 아래층부터 (화면 밖은 건너뜀)
      const from = Math.max(0, s.blocks.length - 20);
      for (let i = from; i < s.blocks.length; i++) paint(s.blocks[i], i);

      for (const d of s.debris) paint(d, d.level, d.y, Math.max(0, d.life));

      if (!s.over) {
        const level = s.blocks.length;
        // 놓일 자리 가늠선 (탑 꼭대기에 비치는 그림자)
        const top = s.blocks[level - 1];
        const shadow: Block = {
          ...s.cur,
          cx: s.cur.axis === "x" ? s.cur.cx : top.cx,
          cz: s.cur.axis === "z" ? s.cur.cz : top.cz,
        };
        const sp = facePos(shadow, level - 1);
        ctx.globalAlpha = 0.22;
        ctx.fillStyle = "#0b1024";
        const q = (dx: number, dz: number): [number, number] => [
          sp.sx + isoX(dx, dz),
          sp.sy + isoY(dx, dz),
        ];
        const hx = shadow.w / 2;
        const hz = shadow.d / 2;
        ctx.beginPath();
        const c0 = q(-hx, -hz);
        ctx.moveTo(c0[0], c0[1]);
        for (const c of [q(hx, -hz), q(hx, hz), q(-hx, hz)]) ctx.lineTo(c[0], c[1]);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;

        paint(s.cur, level + 0.6); // 살짝 떠 있게
      }

      // 퍼펙트 섬광
      if (s.flash > 0) {
        const i = s.blocks.length - 1;
        const f = facePos(s.blocks[i], i);
        ctx.globalAlpha = Math.max(0, s.flash / 0.4);
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        const b = s.blocks[i];
        const q = (dx: number, dz: number): [number, number] => [
          f.sx + isoX(dx, dz),
          f.sy + isoY(dx, dz),
        ];
        const pts = [
          q(-b.w / 2, -b.d / 2),
          q(b.w / 2, -b.d / 2),
          q(b.w / 2, b.d / 2),
          q(-b.w / 2, b.d / 2),
        ];
        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        for (let k = 1; k < 4; k++) ctx.lineTo(pts[k][0], pts[k][1]);
        ctx.closePath();
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      if (s.toast) {
        const i = s.blocks.length - 1;
        const f = facePos(s.blocks[i], i);
        ctx.globalAlpha = Math.min(1, s.toast.life * 2.5);
        ctx.fillStyle = "#ffd08a";
        ctx.font = "bold 15px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(s.toast.text, f.sx, f.sy - 26 - (0.8 - s.toast.life) * 22);
        ctx.globalAlpha = 1;
      }
    };

    const tick = (now: number) => {
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      update(dt);
      draw();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <GameFrame
      score={score}
      best={best}
      over={over}
      onRestart={restart}
      hint={t("hintTap")}
    >
      <canvas
        ref={canvasRef}
        onPointerDown={(e) => {
          e.preventDefault();
          drop();
        }}
        className="block w-full touch-none"
        style={{ aspectRatio: `${W} / ${H}`, height: "auto" }}
      />
    </GameFrame>
  );
}
