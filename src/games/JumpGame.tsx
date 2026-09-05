import { useCallback, useEffect, useRef, useState } from "react";
import GameFrame from "./frame";
import { getBest, saveBest } from "./registry";
import { useT } from "../components/i18n";
import {
  isCylinder,
  jumpDist,
  nextPad,
  PAD_SKINS,
  resolveLanding,
  type Pad,
} from "./logic";
import { drawSkyline, HH, HW, isoX, isoY } from "./iso";

const W = 360;
const H = 520;
const PSIZE = 26; // 플레이어 크기
const MAX_CHARGE = 1.15; // 최대 충전 시간(초)
const ANCHOR_X = 132; // 현재 발판이 놓이는 화면 좌표
const ANCHOR_Y = 392;
const TIP_DUR = 0.5; // 넘어지는 데 걸리는 시간(초)

type Mode = "idle" | "charge" | "fly" | "topple" | "fall" | "done";

interface State {
  pads: Pad[];
  idx: number;
  /** 플레이어 지면 좌표 */
  px: number;
  py: number;
  /** 점프 중 화면상 추가 높이 */
  hop: number;
  spin: number;
  drop: number; // 낙하 화면 오프셋
  tip: number; // 넘어짐 진행도 0~1
  tipDir: number; // 넘어지는 화면 방향 (+1 오른쪽 / -1 왼쪽)
  slide: number; // 넘어진 뒤 옆으로 미끄러진 화면 거리
  landT: number; // 착지 충격 스쿼시 잔여(0~1)
  mode: Mode;
  charge: number;
  vy: number;
  fly: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
    t: number;
    dur: number;
    hmax: number;
  };
  cam: { x: number; y: number };
  combo: number;
  toast: { text: string; life: number } | null;
  score: number;
  seed: number;
}

const projX = isoX;
const projY = isoY;

function init(): State {
  const first: Pad = { x: 0, y: 0, r: 34, kind: 0, dir: 0 };
  return {
    pads: [first, nextPad(first, 1)],
    idx: 0,
    px: 0,
    py: 0,
    hop: 0,
    spin: 0,
    drop: 0,
    tip: 0,
    tipDir: 0,
    slide: 0,
    landT: 0,
    mode: "idle",
    charge: 0,
    vy: 0,
    fly: { x0: 0, y0: 0, x1: 0, y1: 0, t: 0, dur: 0.5, hmax: 90 },
    cam: { x: projX(0, 0) - ANCHOR_X, y: projY(0, 0) - ANCHOR_Y },
    combo: 0,
    toast: null,
    score: 0,
    seed: 2,
  };
}

export default function JumpGame() {
  const t = useT();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const st = useRef<State>(init());
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [over, setOver] = useState(false);

  useEffect(() => setBest(getBest("jump")), []);

  const restart = useCallback(() => {
    st.current = init();
    setScore(0);
    setOver(false);
  }, []);

  const press = useCallback(() => {
    const s = st.current;
    if (s.mode !== "idle") return;
    s.mode = "charge";
    s.charge = 0;
  }, []);

  const release = useCallback(() => {
    const s = st.current;
    if (s.mode !== "charge") return;
    const p = Math.min(1, s.charge / MAX_CHARGE);
    const dist = jumpDist(p);
    const dir = s.pads[s.idx + 1]?.dir ?? 0;
    s.mode = "fly";
    s.fly = {
      x0: s.px,
      y0: s.py,
      x1: s.px + (dir === 0 ? dist : 0),
      y1: s.py + (dir === 1 ? dist : 0),
      t: 0,
      dur: 0.34 + p * 0.22,
      // 도약 높이는 거리에 비례 (짧게 뛰면 낮게, 멀리 뛰면 높게)
      hmax: 14 + dist * 0.22,
    };
  }, []);

  // 입력: 스페이스 홀드
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      e.preventDefault();
      if (e.repeat) return;
      if (over) restart();
      else press();
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space") release();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [press, release, over, restart]);

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

    const land = () => {
      const s = st.current;
      const { x1: x, y1: y } = s.fly;
      s.px = x;
      s.py = y;
      s.hop = 0;
      s.spin = 0;

      const r = resolveLanding(s.pads, x, y);
      if (r.kind === "miss") {
        s.mode = "fall";
        s.vy = 0;
        return;
      }
      if (r.kind === "topple") {
        // 가장자리를 밟음 → 발판 바깥으로 기울어져 넘어진다
        s.mode = "topple";
        s.tip = 0;
        // +x 바깥은 화면 오른쪽, +y 바깥은 화면 왼쪽
        s.tipDir = r.axis === 0 ? r.away : -r.away;
        s.combo = 0;
        s.toast = { text: "OOPS", life: 0.9 };
        return;
      }

      if (r.index === s.idx) {
        // 너무 약하게 뛰어 제자리 발판에 도로 내려앉음 → 점수 없음
        s.combo = 0;
        s.mode = "idle";
        s.charge = 0;
        return;
      }

      const centered = r.centered;
      s.combo = centered ? s.combo + 1 : 0;
      const gain = centered ? 1 + s.combo * 2 : 1;
      s.score += gain;
      s.toast = centered
        ? { text: `PERFECT +${gain}`, life: 0.9 }
        : { text: `+${gain}`, life: 0.5 };
      setScore(s.score);

      s.idx = r.index;
      s.landT = 1;
      s.mode = "idle";
      s.charge = 0;

      while (s.pads.length - 1 - s.idx < 2) {
        s.pads.push(nextPad(s.pads[s.pads.length - 1], s.seed++));
      }
      if (s.idx > 3) {
        s.pads.splice(0, s.idx - 3);
        s.idx = 3;
      }
    };

    const update = (dt: number) => {
      const s = st.current;
      if (s.toast) {
        s.toast.life -= dt;
        if (s.toast.life <= 0) s.toast = null;
      }
      if (s.landT > 0) s.landT = Math.max(0, s.landT - dt / 0.16);

      if (s.mode === "charge") {
        s.charge = Math.min(MAX_CHARGE, s.charge + dt);
      } else if (s.mode === "fly") {
        const f = s.fly;
        f.t += dt / f.dur;
        if (f.t >= 1) {
          land();
        } else {
          s.px = f.x0 + (f.x1 - f.x0) * f.t;
          s.py = f.y0 + (f.y1 - f.y0) * f.t;
          s.hop = 4 * f.hmax * f.t * (1 - f.t);
          s.spin = Math.PI * 2 * (1 - Math.pow(1 - f.t, 2.2));
        }
      } else if (s.mode === "topple") {
        s.tip = Math.min(1, s.tip + dt / TIP_DUR);
        // 처음엔 천천히 기울다 가속 (무게중심이 넘어가는 느낌)
        s.spin = s.tipDir * 1.6 * s.tip * s.tip;
        s.slide += s.tipDir * 26 * dt;
        if (s.tip >= 1) {
          s.mode = "fall";
          s.vy = 160;
        }
      } else if (s.mode === "fall") {
        s.vy += 1500 * dt;
        s.drop += s.vy * dt;
        s.spin += s.tipDir * dt * 2.2 + (s.tipDir === 0 ? dt * 3 : 0);
        s.slide += s.tipDir * 48 * dt;
        if (s.drop > H + 160) {
          s.mode = "done";
          setOver(true);
          setBest(saveBest("jump", s.score));
        }
      }

      const pad = s.pads[s.idx];
      const wantX = projX(pad.x, pad.y) - ANCHOR_X;
      const wantY = projY(pad.x, pad.y) - ANCHOR_Y;
      const k = Math.min(1, dt * 5);
      s.cam.x += (wantX - s.cam.x) * k;
      s.cam.y += (wantY - s.cam.y) * k;
    };

    // ───── 발판: 스킨이 씌워진 입체 (정육면체 / 원통) ─────
    const pt = (x: number, y: number): [number, number] => [
      projX(x, y) - st.current.cam.x,
      projY(x, y) - st.current.cam.y,
    ];

    type Mat = [number, number, number, number, number, number];

    /** 면 로컬좌표로 그리기: fn 안에서는 그 면이 평면인 것처럼 좌표를 쓴다 */
    const onFace = (m: Mat, clip: () => void, fn: () => void) => {
      ctx.save();
      ctx.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
      clip();
      ctx.clip();
      fn();
      ctx.restore();
    };

    const poly = (pts: [number, number][], fill: string) => {
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.closePath();
      ctx.fill();
    };

    const drawCube = (p: Pad, cx: number, cy: number, h: number) => {
      const r = p.r;
      const A: [number, number] = [cx, cy + r]; // 앞(아래) 꼭짓점
      const B: [number, number] = [cx + 2 * r * HW, cy]; // 오른쪽
      const C: [number, number] = [cx, cy - r]; // 뒤(위)
      const D: [number, number] = [cx - 2 * r * HW, cy]; // 왼쪽
      const down = (q: [number, number]): [number, number] => [q[0], q[1] + h];
      const skin = PAD_SKINS[p.kind];

      const wall =
        skin === "hanok"
          ? ["#efe7d6", "#d6cbb4"]
          : skin === "dice"
            ? ["#fbfbf7", "#e3e2d9"]
            : skin === "store"
              ? ["#f3f5f8", "#dbe0e8"]
              : ["#e6ebf3", "#ccd4e0"];
      const topFill =
        skin === "hanok"
          ? "#3c4560"
          : skin === "dice"
            ? "#ffffff"
            : skin === "store"
              ? "#e8ecf2"
              : "#dfe5ee";

      poly([A, B, down(B), down(A)], wall[0]); // 오른쪽 면
      poly([D, A, down(A), down(D)], wall[1]); // 왼쪽 면
      poly([A, B, C, D], topFill); // 윗면

      // 면 로컬 좌표: 윗면 (u,v) ∈ [-r,r]², 측면 (u,w) ∈ [0,2r]×[0,h]
      const mTop: Mat = [HW, -HH, -HW, -HH, cx, cy];
      const mRight: Mat = [HW, -HH, 0, 1, A[0], A[1]];
      const mLeft: Mat = [HW, HH, 0, 1, D[0], D[1]];
      const clipTop = () => {
        ctx.beginPath();
        ctx.rect(-r, -r, 2 * r, 2 * r);
      };
      const clipSide = () => {
        ctx.beginPath();
        ctx.rect(0, 0, 2 * r, h);
      };

      if (skin === "dice") {
        // 주사위: 윗면 5, 오른쪽 3, 왼쪽 2 (1의 눈은 붉게)
        const pip = (u: number, v: number, red = false) => {
          ctx.fillStyle = red ? "#d8452f" : "#22202c";
          ctx.beginPath();
          ctx.arc(u, v, r * 0.11, 0, Math.PI * 2);
          ctx.fill();
        };
        const k = r * 0.42;
        onFace(mTop, clipTop, () => {
          pip(-k, -k);
          pip(k, -k);
          pip(0, 0, true);
          pip(-k, k);
          pip(k, k);
        });
        onFace(mRight, clipSide, () => {
          const d = r * 0.5;
          pip(r - d, h / 2 - d * 0.6);
          pip(r, h / 2);
          pip(r + d, h / 2 + d * 0.6);
        });
        onFace(mLeft, clipSide, () => {
          const d = r * 0.45;
          pip(r - d, h / 2 - d * 0.6);
          pip(r + d, h / 2 + d * 0.6);
        });
      } else if (skin === "hanok") {
        // 기와지붕: 윗면에 기왓골 + 용마루, 측면은 회벽 + 나무 기둥
        onFace(mTop, clipTop, () => {
          ctx.fillStyle = "rgba(255,255,255,0.10)";
          for (let u = -r + 3; u < r; u += 7) ctx.fillRect(u, -r, 2.6, 2 * r);
          ctx.fillStyle = "#5a6480";
          ctx.fillRect(-r, -2, 2 * r, 4);
        });
        for (const m of [mRight, mLeft]) {
          onFace(m, clipSide, () => {
            ctx.fillStyle = "#8b5a3c";
            ctx.fillRect(0, 0, 2 * r, h * 0.16); // 처마 밑 목재
            ctx.fillStyle = "rgba(139,90,60,0.8)";
            for (let u = 4; u < 2 * r - 2; u += 12) ctx.fillRect(u, h * 0.16, 3, h);
          });
        }
      } else if (skin === "apart") {
        onFace(mTop, clipTop, () => {
          ctx.fillStyle = "#b9c1d0";
          ctx.fillRect(-r + 4, -r + 4, 2 * r - 8, 2 * r - 8);
          ctx.fillStyle = "#8f9ab0"; // 옥상 물탱크
          ctx.fillRect(-r * 0.3, -r * 0.5, r * 0.5, r * 0.4);
        });
        for (const m of [mRight, mLeft]) {
          onFace(m, clipSide, () => {
            ctx.fillStyle = "#5f6f92";
            for (let u = 4; u < 2 * r - 6; u += 10)
              for (let w = 6; w < h - 6; w += 11) ctx.fillRect(u, w, 6, 6);
          });
        }
      } else {
        // 편의점: 상단 간판 띠 + 통유리
        onFace(mTop, clipTop, () => {
          ctx.fillStyle = "#c8cedb";
          ctx.fillRect(r * 0.1, -r * 0.4, r * 0.6, r * 0.5); // 실외기
        });
        for (const m of [mRight, mLeft]) {
          onFace(m, clipSide, () => {
            ctx.fillStyle = "#2f7fd6";
            ctx.fillRect(0, 0, 2 * r, h * 0.26);
            ctx.fillStyle = "#38b06f";
            ctx.fillRect(0, h * 0.26, 2 * r, h * 0.06);
            ctx.fillStyle = "rgba(190,225,245,0.9)";
            ctx.fillRect(4, h * 0.42, 2 * r - 8, h * 0.44);
          });
        }
      }

      ctx.strokeStyle = "rgba(20,24,50,0.18)"; // 앞 모서리
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(A[0], A[1]);
      ctx.lineTo(A[0], A[1] + h);
      ctx.stroke();
    };

    const drawCylinder = (p: Pad, cx: number, cy: number, h: number) => {
      const skin = PAD_SKINS[p.kind];
      const rx = p.r * Math.SQRT2 * HW; // 지면 원 → 화면 타원
      const ry = p.r * Math.SQRT2 * HH;
      const taper = skin === "cup" ? 0.78 : skin === "jar" ? 0.86 : 0.97;
      const rb = rx * taper;
      const ryb = ry * taper;

      const body = () => {
        ctx.beginPath();
        ctx.moveTo(cx - rx, cy);
        ctx.lineTo(cx - rb, cy + h);
        ctx.ellipse(cx, cy + h, rb, ryb, 0, Math.PI, 0, true);
        ctx.lineTo(cx + rx, cy);
        ctx.closePath();
      };

      const tone =
        skin === "can"
          ? ["#8e97a8", "#e8edf4", "#aab3c2"]
          : skin === "drum"
            ? ["#8d2b28", "#d9483f", "#a53430"]
            : skin === "cup"
              ? ["#c9cdd6", "#ffffff", "#dfe3ea"]
              : ["#3b2b23", "#6b4a38", "#4a352a"];
      const g = ctx.createLinearGradient(cx - rx, 0, cx + rx, 0);
      g.addColorStop(0, tone[0]);
      g.addColorStop(0.45, tone[1]);
      g.addColorStop(1, tone[2]);
      body();
      ctx.fillStyle = g;
      ctx.fill();

      ctx.save(); // 라벨/디테일은 몸통 안쪽으로 클립
      body();
      ctx.clip();
      if (skin === "can") {
        ctx.fillStyle = "#d8402f";
        ctx.fillRect(cx - rx, cy + h * 0.3, rx * 2, h * 0.34);
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.fillRect(cx - rx, cy + h * 0.44, rx * 2, h * 0.05);
      } else if (skin === "drum") {
        ctx.fillStyle = "#1f1b26";
        ctx.fillRect(cx - rx, cy + h * 0.12, rx * 2, h * 0.07);
        ctx.fillRect(cx - rx, cy + h * 0.78, rx * 2, h * 0.07);
        ctx.fillStyle = "#e8c76a"; // 장식 못
        for (let i = -3; i <= 3; i++) {
          ctx.beginPath();
          ctx.arc(cx + (i * rx) / 3.5, cy + h * 0.155, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (skin === "cup") {
        ctx.fillStyle = "#b07a4e"; // 컵 슬리브
        ctx.fillRect(cx - rx, cy + h * 0.34, rx * 2, h * 0.34);
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.fillRect(cx - rx, cy + h * 0.5, rx * 2, h * 0.04);
      } else {
        ctx.fillStyle = "rgba(255,255,255,0.14)"; // 항아리 유약 하이라이트
        ctx.beginPath();
        ctx.ellipse(cx - rx * 0.35, cy + h * 0.45, rx * 0.16, h * 0.3, -0.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      ctx.beginPath(); // 윗면
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fillStyle =
        skin === "can"
          ? "#c9d0dc"
          : skin === "drum"
            ? "#efe0c2"
            : skin === "cup"
              ? "#f4f6fa"
              : "#5c4232";
      ctx.fill();
      ctx.strokeStyle = "rgba(20,24,50,0.35)";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      if (skin === "can") {
        ctx.beginPath(); // 캔 따개
        ctx.ellipse(cx, cy, rx * 0.4, ry * 0.4, 0, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(60,70,90,0.7)";
        ctx.stroke();
      } else if (skin === "drum") {
        ctx.beginPath(); // 북 가죽 테두리
        ctx.ellipse(cx, cy, rx * 0.72, ry * 0.72, 0, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(120,60,50,0.5)";
        ctx.stroke();
      } else if (skin === "cup") {
        ctx.beginPath(); // 뚜껑 음료구
        ctx.ellipse(cx + rx * 0.25, cy - ry * 0.1, rx * 0.22, ry * 0.22, 0, 0, Math.PI * 2);
        ctx.fillStyle = "#c8ccd6";
        ctx.fill();
      }
    };

    const drawPad = (p: Pad, squash: number) => {
      const [cx, cy] = pt(p.x, p.y);
      const h = p.r * 1.25 * (1 - squash); // 충전 중이면 눌린다

      ctx.fillStyle = "rgba(10,14,34,0.25)"; // 바닥 그림자
      ctx.beginPath();
      ctx.ellipse(cx, cy + h + 4, p.r * 1.25, p.r * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();

      if (isCylinder(p.kind)) drawCylinder(p, cx, cy, h);
      else drawCube(p, cx, cy, h);

      ctx.fillStyle = "rgba(227,90,61,0.5)"; // 정중앙 표식
      ctx.beginPath();
      ctx.ellipse(cx, cy, 4, 2.3, 0, 0, Math.PI * 2);
      ctx.fill();
    };

    const draw = () => {
      const s = st.current;
      ctx.clearRect(0, 0, W, H);
      drawSkyline(ctx, W, s.cam.x * 0.06, 300);

      const p = Math.min(1, s.charge / MAX_CHARGE);
      // ponytail: 먼 발판(x+y 큰 순)부터 그려 깊이 정렬. 플레이어는 항상 맨 위 — 뒤로 넘어간 순간엔 겹침이 어색할 수 있지만 게임상 드묾
      const order = [...s.pads].sort((m, n) => n.x + n.y - (m.x + m.y));
      for (const pad of order) {
        drawPad(pad, s.mode === "charge" && pad === s.pads[s.idx] ? p * 0.3 : 0);
      }

      // 플레이어
      const sx = projX(s.px, s.py) - s.cam.x + s.slide;
      const groundY = projY(s.px, s.py) - s.cam.y + s.drop; // 발이 닿는 지면 높이
      const sy = groundY - s.hop;
      const squash =
        (s.mode === "charge" ? p * 0.45 : 0) + s.landT * 0.3;
      const flying = s.mode === "fly";
      // 올라갈 때·내려올 때 늘어나고 정점에서 원래대로 (부피 보존)
      const stretch = flying ? 1 + 0.25 * Math.abs(1 - 2 * s.fly.t) : 1;
      const hgt = PSIZE * (1 - squash) * stretch;
      const wid = (PSIZE * 0.72 * (1 + squash * 0.5)) / stretch;

      // 그림자는 지면에 남고, 높이 뜰수록 작고 옅어진다
      if (s.mode !== "fall" && s.mode !== "done") {
        const lift = Math.max(0.25, 1 - s.hop / 150);
        ctx.globalAlpha = 0.3 * lift;
        ctx.fillStyle = "rgba(20,16,40,1)";
        ctx.beginPath();
        ctx.ellipse(sx, groundY + 2, wid * 0.62 * lift, wid * 0.28 * lift, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      ctx.save();
      if (s.mode === "topple" || s.mode === "fall") {
        ctx.translate(sx, sy); // 넘어질 땐 발밑이 축
        ctx.rotate(s.spin);
        ctx.translate(0, -hgt / 2);
      } else {
        ctx.translate(sx, sy - hgt / 2); // 공중제비는 몸 중심이 축
        ctx.rotate(s.spin);
      }
      ctx.fillStyle = "#1a1633";
      ctx.strokeStyle = "rgba(255,240,220,0.85)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(-wid / 2, -hgt / 2, wid, hgt, 6);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#ff8a5c"; // 스카프
      ctx.fillRect(-wid / 2, -hgt / 2 + 5, wid, 4);
      ctx.fillStyle = "rgba(255,240,220,0.9)"; // 얼굴 쪽 하이라이트
      ctx.fillRect(-wid / 2 + 3, -hgt / 2 + 12, wid - 6, 2);
      ctx.restore();

      if (s.mode === "charge") {
        ctx.fillStyle = "rgba(10,14,34,0.35)";
        ctx.beginPath();
        ctx.roundRect(sx - 24, sy - PSIZE - 26, 48, 5, 3);
        ctx.fill();
        ctx.fillStyle = "#ffb26b";
        ctx.beginPath();
        ctx.roundRect(sx - 24, sy - PSIZE - 26, 48 * p, 5, 3);
        ctx.fill();
      }

      if (s.toast) {
        ctx.globalAlpha = Math.min(1, s.toast.life * 2);
        ctx.fillStyle = "#ffd08a";
        ctx.font = "bold 15px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(s.toast.text, sx, sy - 52 - (0.9 - s.toast.life) * 20);
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
      hint={t("hintHold")}
    >
      <canvas
        ref={canvasRef}
        onPointerDown={(e) => {
          e.preventDefault();
          press();
        }}
        onPointerUp={release}
        onPointerLeave={release}
        className="block w-full touch-none"
        style={{ aspectRatio: `${W} / ${H}`, height: "auto" }}
      />
    </GameFrame>
  );
}
