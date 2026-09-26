/**
 * 게임 규칙 자체 점검.
 *   npm run check:games
 */
import assert from "node:assert/strict";
import {
  EDGE_TOL,
  edgeMargin,
  isCylinder,
  landOn,
  resolveLanding,
  nextPad,
  sliceBlock,
  jumpDist,
  MAX_JUMP,
  MIN_JUMP,
  PAD_KINDS,
  R_MAX,
  R_MIN,
  type Pad,
} from "./logic.ts";
import {
  defaultOrder,
  effectiveLayout,
  engineName,
  firesFromOrder,
  firingPattern,
  gearRatios,
  halvesOf,
  idleRpm,
  newSim,
  oddEven,
  parseOrder,
  engineInertia,
  shift,
  VEHICLES,
  stepSim,
  torqueShape,
  wheelRpm,
  type Setup,
} from "./engine.ts";
import { PRESETS, curveOf, cycleOf, findPreset, hpAt, presetFires, torqueAt } from "./enginePresets.ts";

// ── 스택: 겹침 계산 ──────────────────────────────────────
const base = { x: 100, w: 100 }; // [100,200]

// 오른쪽으로 30 어긋남 → [130,200] 남고 [200,230] 잘림
assert.deepEqual(sliceBlock(base, { x: 130, w: 100 }), {
  hit: true,
  perfect: false,
  x: 130,
  w: 70,
  cut: { x: 200, w: 30 },
});

// 왼쪽으로 30 어긋남 → [100,170] 남고 [70,100] 잘림
assert.deepEqual(sliceBlock(base, { x: 70, w: 100 }), {
  hit: true,
  perfect: false,
  x: 100,
  w: 70,
  cut: { x: 70, w: 30 },
});

// 오차 4 미만은 퍼펙트 → 폭 유지, 조각 없음
assert.deepEqual(sliceBlock(base, { x: 102, w: 100 }), {
  hit: true,
  perfect: true,
  x: 100,
  w: 100,
  cut: null,
});

// 완전히 빗나감 (딱 붙은 경우 포함)
assert.deepEqual(sliceBlock(base, { x: 250, w: 100 }), { hit: false });
assert.deepEqual(sliceBlock(base, { x: 200, w: 100 }), { hit: false });

// 자른 폭 + 남은 폭 = 원래 폭 (불변식)
for (let d = -99; d <= 99; d++) {
  const r = sliceBlock(base, { x: base.x + d, w: base.w });
  if (!r.hit || r.perfect) continue;
  assert.equal(r.w + r.cut!.w, base.w, `d=${d}`);
  assert.ok(r.x >= base.x && r.x + r.w <= base.x + base.w, `d=${d} 범위 이탈`);
}

// ── 점프점프: 충전 → 거리 ────────────────────────────────
assert.equal(jumpDist(0), MIN_JUMP);
assert.equal(jumpDist(1), MAX_JUMP);
assert.equal(jumpDist(2), MAX_JUMP); // 클램프
assert.equal(jumpDist(-1), MIN_JUMP);

// ── 점프점프: 생성된 발판이 항상 도달 가능한가 ────────────
let cur: Pad = { x: 0, y: 0, r: 34, kind: 0, dir: 0 };
const dirsSeen = new Set<number>();
const kindsSeen = new Set<number>();
for (let seed = 1; seed < 3000; seed++) {
  const next = nextPad(cur, seed);
  dirsSeen.add(next.dir);
  kindsSeen.add(next.kind);

  assert.ok(next.r >= R_MIN && next.r <= R_MAX, `seed=${seed} 반경 범위`);
  assert.ok(next.kind >= 0 && next.kind < PAD_KINDS, `seed=${seed} 종류 범위`);
  // 한 축으로만 이동
  assert.ok(
    (next.dir === 0 && next.y === cur.y) || (next.dir === 1 && next.x === cur.x),
    `seed=${seed} 두 축 동시 이동`,
  );

  // 이동축 기준 중심간 거리
  const gap = next.dir === 0 ? next.x - cur.x : next.y - cur.y;
  // 넘어지지 않고 살아있다면 현재 발판 안전지대(±(r-EDGE))에 서 있다.
  // 거기서 다음 발판 안전지대(±(r-EDGE))까지 항상 닿을 수 있어야 한다.
  const from = cur.r - EDGE_TOL;
  const to = next.r - EDGE_TOL;
  assert.ok(
    gap - from + to >= MIN_JUMP,
    `seed=${seed} 최소 점프가 안전지대를 넘어감`,
  );
  assert.ok(
    gap + from - to <= MAX_JUMP,
    `seed=${seed} 최대 점프로도 안전지대에 못 닿음`,
  );
  cur = next;
}
assert.equal(dirsSeen.size, 2, "두 방향 모두 나와야 함");
assert.equal(kindsSeen.size, PAD_KINDS, "발판 종류가 모두 나와야 함");

// ── 점프점프: 착지 판정 (정사각 footprint) ────────────────
const pads: Pad[] = [
  { x: 0, y: 0, r: 30, kind: 0, dir: 0 }, // 정육면체
  { x: 120, y: 0, r: 25, kind: 1, dir: 0 }, // 정육면체
];
assert.ok(!isCylinder(0) && !isCylinder(1));
assert.equal(landOn(pads, 120, 0), 1); // 정중앙
assert.equal(landOn(pads, 95, 0), 1); // 가까운 모서리
assert.equal(landOn(pads, 145, 0), 1); // 먼 모서리
assert.equal(landOn(pads, 94, 0), -1); // 살짝 못 미침
assert.equal(landOn(pads, 146, 0), -1); // 살짝 지나침
assert.equal(landOn(pads, 120, 26), -1); // 옆으로 벗어남

// ── 점프점프: 착지 판정 (헛디딤 / 가장자리 / 정중앙) ─────
const p1 = pads[1]; // x=120, r=25

assert.deepEqual(resolveLanding(pads, 120, 0), {
  kind: "land",
  index: 1,
  centered: true,
});
assert.deepEqual(resolveLanding(pads, 132, 0), {
  kind: "land",
  index: 1,
  centered: false,
});
// 오른쪽 가장자리(안쪽 5 이내) → 바깥(+)으로 넘어짐
assert.deepEqual(resolveLanding(pads, p1.x + p1.r - 2, 0), {
  kind: "topple",
  index: 1,
  axis: 0,
  away: 1,
});
// 왼쪽 가장자리 → 바깥(-)으로 넘어짐
assert.deepEqual(resolveLanding(pads, p1.x - p1.r + 2, 0), {
  kind: "topple",
  index: 1,
  axis: 0,
  away: -1,
});
// 다른 축 가장자리
assert.deepEqual(resolveLanding(pads, p1.x, p1.r - 1), {
  kind: "topple",
  index: 1,
  axis: 1,
  away: 1,
});
// 가장자리 경계 바로 안쪽은 안전
assert.equal(
  resolveLanding(pads, p1.x + p1.r - EDGE_TOL, 0).kind,
  "land",
  "EDGE_TOL 경계는 안전해야",
);
// 발판을 벗어나면 헛디딤
assert.deepEqual(resolveLanding(pads, p1.x + p1.r + 1, 0), { kind: "miss" });

// ── 발판 형상: 정육면체는 정사각, 원통은 원형 바닥 ─────────
const cube: Pad = { x: 0, y: 0, r: 30, kind: 0, dir: 0 };
const cyl: Pad = { x: 0, y: 0, r: 30, kind: 4, dir: 0 };
assert.ok(isCylinder(4) && isCylinder(7), "4~7 은 원통");
// 정사각 모서리 쪽(대각 24,24 → 중심거리 33.9)은 큐브 안 / 원통 밖
assert.ok(edgeMargin(cube, 24, 24) >= 0, "큐브 모서리는 발판 안");
assert.ok(edgeMargin(cyl, 24, 24) < 0, "원통 모서리는 발판 밖");
// 축 위에서는 둘 다 동일
assert.equal(edgeMargin(cube, 25, 0), 5);
assert.equal(edgeMargin(cyl, 25, 0), 5);
assert.equal(landOn([cyl], 24, 24), -1);
assert.equal(landOn([cube], 24, 24), 0);
// 원통 가장자리도 넘어진다
assert.deepEqual(resolveLanding([cyl], 27, 0), {
  kind: "topple",
  index: 0,
  axis: 0,
  away: 1,
});

// ── 로또 6/45 ────────────────────────────────────────────
{
  const { pickUnique, draw, rankOf, simulate, seededRng, PRIZES, TICKET_PRICE } =
    await import("./lotto.ts");

  // 뽑기: 개수 / 범위 / 중복 없음 / 오름차순
  const rng = seededRng(42);
  for (let i = 0; i < 500; i++) {
    const p = pickUnique(6, rng);
    assert.equal(p.length, 6);
    assert.equal(new Set(p).size, 6, "중복 번호");
    assert.ok(p.every((n) => n >= 1 && n <= 45), "범위 이탈");
    assert.deepEqual(p, [...p].sort((a, b) => a - b), "정렬 안 됨");
  }
  // 500번 뽑는 동안 1~45 전부 등장해야 정상
  const seen = new Set<number>();
  const rng2 = seededRng(7);
  for (let i = 0; i < 500; i++) pickUnique(6, rng2).forEach((n) => seen.add(n));
  assert.equal(seen.size, 45, "안 나오는 번호 존재");

  // 추첨: 보너스는 당첨 6개와 겹치지 않는다
  for (let i = 0; i < 200; i++) {
    const d = draw(rng);
    assert.equal(d.nums.length, 6);
    assert.ok(!d.nums.includes(d.bonus), "보너스가 당첨번호와 중복");
  }

  // 등수 판정
  const d = { nums: [1, 2, 3, 4, 5, 6], bonus: 7 };
  assert.equal(rankOf([1, 2, 3, 4, 5, 6], d), 1);
  assert.equal(rankOf([1, 2, 3, 4, 5, 7], d), 2); // 5개 + 보너스
  assert.equal(rankOf([1, 2, 3, 4, 5, 8], d), 3); // 5개
  assert.equal(rankOf([1, 2, 3, 4, 8, 9], d), 4);
  assert.equal(rankOf([1, 2, 3, 8, 9, 10], d), 5);
  assert.equal(rankOf([1, 2, 8, 9, 10, 11], d), 0);
  assert.equal(rankOf([1, 2, 7, 9, 10, 11], d), 0); // 보너스는 2등 판정에만 쓰임

  // 시뮬레이션: 지출 = 티켓 × 가격, 당첨금 = Σ 등수×상금
  const sim = simulate(520, 5, seededRng(1));
  assert.equal(sim.tickets, 2600);
  assert.equal(sim.spent, 2600 * TICKET_PRICE);
  const expectWon = [1, 2, 3, 4, 5].reduce(
    (acc, rk) => acc + sim.ranks[rk] * PRIZES[rk],
    0,
  );
  assert.equal(sim.won, expectWon, "당첨금 합계 불일치");
  // 5등(3개 일치) 확률 ≈ 1/45 → 2600장이면 수십 회는 나온다
  assert.ok(sim.ranks[5] > 10, "5등이 비정상적으로 적음");
}

// ── 2048 ─────────────────────────────────────────────────
{
  const { slideRow, moveBoard, addTile, canMove } = await import("./arcade.ts");

  // 병합: 한 타일은 한 번만 합쳐진다
  assert.deepEqual(slideRow([2, 2, 2, 2]), { row: [4, 4, 0, 0], gained: 8 });
  assert.deepEqual(slideRow([2, 0, 2, 4]), { row: [4, 4, 0, 0], gained: 4 });
  assert.deepEqual(slideRow([4, 2, 2, 0]), { row: [4, 4, 0, 0], gained: 4 });
  assert.deepEqual(slideRow([2, 4, 2, 4]), { row: [2, 4, 2, 4], gained: 0 });
  assert.deepEqual(slideRow([0, 0, 0, 0]), { row: [0, 0, 0, 0], gained: 0 });

  // 방향 이동: 오른쪽/위/아래가 왼쪽 정규화와 일치하는가
  const b = [
    [2, 0, 0, 2],
    [0, 4, 4, 0],
    [2, 0, 0, 0],
    [0, 0, 0, 2],
  ];
  assert.deepEqual(moveBoard(b, "right").board, [
    [0, 0, 0, 4],
    [0, 0, 0, 8],
    [0, 0, 0, 2],
    [0, 0, 0, 2],
  ]);
  assert.deepEqual(moveBoard(b, "up").board, [
    [4, 4, 4, 4],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ]);
  assert.deepEqual(moveBoard(b, "down").board, [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [4, 4, 4, 4],
  ]);
  assert.equal(moveBoard(b, "left").gained, 12); // 4 + 8

  // 안 움직이는 이동은 moved=false
  const full = [
    [2, 4, 2, 4],
    [4, 2, 4, 2],
    [2, 4, 2, 4],
    [4, 2, 4, 2],
  ];
  assert.equal(moveBoard(full, "left").moved, false);
  assert.equal(canMove(full), false, "체커보드는 게임 오버");
  assert.equal(canMove(b), true);

  // addTile: 빈 칸 하나 채움, 값은 2 또는 4, 가득 차면 그대로
  const added = addTile(b, () => 0.5);
  const diff: number[] = [];
  added.forEach((row, r) =>
    row.forEach((v, c) => {
      if (v !== b[r][c]) diff.push(v);
    }),
  );
  assert.equal(diff.length, 1);
  assert.ok(diff[0] === 2 || diff[0] === 4);
  assert.deepEqual(addTile(full), full);
}

// ── 숫자야구 ─────────────────────────────────────────────
{
  const { secretDigits, judge } = await import("./arcade.ts");
  const { seededRng } = await import("./lotto.ts");

  const rng = seededRng(3);
  for (let i = 0; i < 300; i++) {
    const s = secretDigits(rng);
    assert.equal(new Set(s).size, 3, "중복 숫자");
    assert.ok(s.every((n) => n >= 1 && n <= 9), "범위 이탈");
  }

  assert.deepEqual(judge([1, 2, 3], [1, 2, 3]), { s: 3, b: 0 });
  assert.deepEqual(judge([1, 2, 3], [3, 2, 1]), { s: 1, b: 2 });
  assert.deepEqual(judge([1, 2, 3], [2, 3, 1]), { s: 0, b: 3 });
  assert.deepEqual(judge([1, 2, 3], [4, 5, 6]), { s: 0, b: 0 });
  assert.deepEqual(judge([1, 2, 3], [1, 5, 2]), { s: 1, b: 1 });
}

// ── 사다리타기 · 돌림판 ──────────────────────────────────
{
  const { makeLadder, traceLadder, wheelWinner } = await import("./arcade.ts");
  const { seededRng } = await import("./lotto.ts");

  const rng = seededRng(9);
  for (let cols = 2; cols <= 8; cols++) {
    for (let i = 0; i < 50; i++) {
      const rungs = makeLadder(cols, 10, rng);
      // 같은 줄에 인접 가로대 금지
      for (const row of rungs) {
        const sorted = [...row].sort((a, b) => a - b);
        for (let k = 1; k < sorted.length; k++) {
          assert.ok(sorted[k] - sorted[k - 1] >= 2, "인접 가로대 발생");
        }
      }
      // 모든 기둥 사이에 가로대 최소 1개
      for (let c = 0; c < cols - 1; c++) {
        assert.ok(
          rungs.some((row) => row.includes(c)),
          `기둥 ${c} 사이 가로대 없음`,
        );
      }
      // 결과는 항상 순열 (겹침/누락 없음)
      const ends = Array.from(
        { length: cols },
        (_, st) => traceLadder(rungs, st).end,
      );
      assert.deepEqual(
        [...ends].sort((a, b) => a - b),
        Array.from({ length: cols }, (_, k) => k),
        "순열 아님",
      );
    }
  }

  // 돌림판: 회전 0 이면 조각 0 이 12시… 살짝 돌리면 마지막 조각
  assert.equal(wheelWinner(0, 4), 0);
  assert.equal(wheelWinner(10, 4), 3);
  assert.equal(wheelWinner(90, 4), 3);
  assert.equal(wheelWinner(91, 4), 2);
  assert.equal(wheelWinner(360, 4), 0);
  assert.equal(wheelWinner(45, 4), 3);
  // 전 구간에서 유효한 인덱스
  for (let a = 0; a < 720; a += 7) {
    const w = wheelWinner(a, 6);
    assert.ok(w >= 0 && w < 6, `angle=${a}`);
  }
}

// ── 냉장고 요리 ──────────────────────────────────────────
{
  const { INGREDIENTS, RECIPES, STAPLES, CUISINES, SEASONAL, matchRecipes, seasonalOf } =
    await import("./recipes.ts");

  // 데이터 무결성: 레시피 재료는 전부 카탈로그에 있어야 하고, 기본 양념은 적지 않는다
  const ids = new Set(INGREDIENTS.map((i) => i.id));
  assert.equal(ids.size, INGREDIENTS.length, "재료 카탈로그 중복");
  const names = new Set<string>();
  for (const rc of RECIPES) {
    assert.ok(!names.has(rc.name), `레시피 중복: ${rc.name}`);
    names.add(rc.name);
    assert.ok(CUISINES.includes(rc.cuisine), `${rc.name}: 종류 "${rc.cuisine}"`);
    assert.ok(rc.min > 0 && rc.serves > 0 && rc.steps.length > 0, rc.name);
    for (const i of [...rc.req, ...rc.opt]) {
      assert.ok(ids.has(i), `${rc.name}: 카탈로그에 없는 재료 "${i}"`);
      assert.ok(!STAPLES.includes(i), `${rc.name}: 기본 양념 "${i}" 는 적지 않음`);
    }
    assert.ok(rc.req.length > 0, `${rc.name}: 필수 재료 없음`);
    assert.equal(
      new Set([...rc.req, ...rc.opt]).size,
      rc.req.length + rc.opt.length,
      `${rc.name}: 필수/선택 재료 중복`,
    );
  }
  assert.ok(RECIPES.length >= 150, `레시피 수 ${RECIPES.length}`);

  // 사진: 모든 레시피에 정적 사진 URL (scripts/findPhotos.mjs 로 생성)
  const { PHOTOS } = await import("./photos.ts");
  const noPhoto = RECIPES.filter((x) => !PHOTOS[x.name]).map((x) => x.name);
  assert.deepEqual(noPhoto, [], "사진 없는 레시피");
  for (const u of Object.values(PHOTOS))
    assert.ok(/^https:\/\/(upload|thumb)\.wikimedia\.org\//.test(u), u);
  for (const c of CUISINES)
    assert.ok(RECIPES.some((x) => x.cuisine === c), `${c} 레시피 없음`);

  // 제철표: 12개월 전부, 카탈로그에 있는 재료만
  for (let mo = 1; mo <= 12; mo++) {
    assert.ok(SEASONAL[mo]?.length > 0, `${mo}월 제철 없음`);
    for (const i of SEASONAL[mo]) assert.ok(ids.has(i), `${mo}월 제철 "${i}" 카탈로그 없음`);
  }
  // 제철 우선 정렬: 같은 부족 수 안에서 제철 재료 많은 순
  const sept = matchRecipes([], { month: 9, seasonFirst: true });
  for (let i = 1; i < sept.length; i++) {
    const a = sept[i - 1];
    const b = sept[i];
    if (a.missing.length === b.missing.length)
      assert.ok(a.seasonal.length >= b.seasonal.length, "제철 우선 정렬 깨짐");
  }
  const gogu = RECIPES.find((x) => x.name === "고구마" || x.req.includes("고구마"))!;
  assert.ok(seasonalOf(gogu, 9).includes("고구마"));
  assert.ok(!seasonalOf(gogu, 3).includes("고구마"));

  // 매칭: 필수 재료 다 있으면 missing 0, 정렬은 부족 수 → 시간
  const m = matchRecipes(["계란", "대파"]);
  const gukmul = m.find((x) => x.recipe.name === "계란국")!;
  assert.deepEqual(gukmul.missing, []);
  const mari = m.find((x) => x.recipe.name === "계란말이")!;
  assert.deepEqual(mari.missing, []);
  assert.deepEqual(mari.optHave, ["대파"]);
  for (let i = 1; i < m.length; i++) {
    const a = m[i - 1];
    const b = m[i];
    assert.ok(
      a.missing.length < b.missing.length ||
        (a.missing.length === b.missing.length && a.recipe.min <= b.recipe.min),
      "정렬 깨짐",
    );
  }
  // 아무것도 없으면 필수 재료 전부 부족, 기본 양념은 부족으로 세지 않음
  const empty = matchRecipes([]);
  for (const x of empty) assert.equal(x.missing.length, x.recipe.req.length);
}

// ── 엔진 시뮬레이터 ──────────────────────────────────────
{
  // 점화 패턴
  const i4 = firingPattern(4, "inline");
  assert.deepEqual(i4.map((f) => f.a), [0, 180, 360, 540]);
  assert.ok(i4.every((f) => f.b === 0));
  assert.deepEqual(firingPattern(8, "vee", "cross").map((f) => f.b), [0, 1, 1, 0, 1, 0, 0, 1]);
  assert.deepEqual(firingPattern(8, "vee", "flat").map((f) => f.b), [0, 1, 0, 1, 0, 1, 0, 1]);
  assert.deepEqual(firingPattern(2, "vee").map((f) => f.a), [0, 270]);
  assert.equal(effectiveLayout(3, "vee"), "inline");
  assert.ok(firingPattern(5, "flat").every((f) => f.b === 0), "홀수 기통은 직렬 강제");
  assert.deepEqual(firingPattern(4, "flat").map((f) => f.a), [0, 200, 360, 560], "수평대향 2번 뱅크 20° 지연");
  for (let n = 1; n <= 12; n++)
    for (const lay of ["inline", "vee", "flat"] as const) {
      const p = firingPattern(n, lay);
      assert.equal(p.length, n);
      assert.ok(p.every((f) => f.a >= 0 && f.a < 720 && (f.b === 0 || f.b === 1)));
    }
  assert.equal(engineName(8, "vee"), "V8");
  assert.equal(engineName(3, "vee"), "I3");

  // 기어비 단조 감소, 양끝 고정
  const r = gearRatios(6);
  for (let i = 1; i < 6; i++) assert.ok(r[i] < r[i - 1]);
  assert.ok(Math.abs(r[0] - 12.5) < 1e-9 && Math.abs(r[5] - 2.7) < 1e-9, "기본 차량(스포츠 세단) 종합 감속비");
  assert.ok(gearRatios(6, VEHICLES.f1)[5] > gearRatios(6, VEHICLES.sedan)[5], "F1 은 최종단도 감속비가 크다");

  // 1단 풀스로틀 10초: 가속되고 리미터(+150) 못 넘음
  const set: Setup = { cyl: 4, redline: 7000, trans: "mt", lcOn: false, lcRpm: 4000 };
  const s = newSim();
  s.rpm = 900;
  assert.ok(shift(s, 1, set));
  s.shiftT = 0;
  let maxRpm = 0;
  for (let i = 0; i < 600; i++) {
    stepSim(s, { thr: 1, brake: false }, set, 1 / 60);
    maxRpm = Math.max(maxRpm, s.rpm);
  }
  assert.ok(s.v > 10, "가속 안 됨");
  assert.ok(maxRpm <= 7150 + 1e-6, "리미터 초과");
  assert.ok(s.rpm > 6500, "10초 후 1단은 리미터 근처여야");

  // 브레이크 → 정지, 아이들 복귀
  for (let i = 0; i < 1200; i++) stepSim(s, { thr: 0, brake: true }, set, 1 / 60);
  assert.equal(s.v, 0);
  assert.ok(Math.abs(s.rpm - idleRpm(4)) < 0.5, `아이들 복귀 실패 ${s.rpm}`);

  // 주행 중 다운시프트: 수동은 블립, rpm 은 프레임당 급변 없이 수렴
  s.gear = 4;
  s.v = 25;
  s.shiftT = 0;
  for (let i = 0; i < 60; i++) stepSim(s, { thr: 0, brake: false }, set, 1 / 60);
  assert.ok(shift(s, -1, set) && s.blipT > 0, "수동 다운시프트 블립 없음");
  let maxJump = 0;
  for (let i = 0; i < 60; i++) {
    const before = s.rpm;
    stepSim(s, { thr: 0, brake: false }, set, 1 / 60);
    maxJump = Math.max(maxJump, Math.abs(s.rpm - before));
  }
  assert.ok(maxJump < 400, `다운시프트 rpm 급변 ${maxJump}`);
  assert.ok(Math.abs(s.rpm - wheelRpm(s.v, gearRatios(6)[2])) < 200, "다운시프트 후 새 기어 회전수로 수렴 안 함");
  // AT 는 블립 없음
  const at = newSim();
  at.rpm = 3000;
  at.gear = 4;
  at.v = 25;
  assert.ok(shift(at, -1, { ...set, trans: "at" }) && at.blipT === 0);

  // 오버레브 다운시프트 거부 (55 m/s: 6→5 허용 ≈5900rpm, 5→4 거부 ≈7900rpm)
  s.gear = 6;
  s.v = 55;
  s.shiftT = 0;
  assert.equal(shift(s, -1, set), true);
  s.shiftT = 0;
  assert.equal(shift(s, -1, set), false);
  assert.equal(s.gear, 5);

  // 중립 풀스로틀 → 리미터에서 컷 반복 (바운스)
  const n = newSim();
  n.rpm = 900;
  let cuts = 0;
  for (let i = 0; i < 300; i++) {
    stepSim(n, { thr: 1, brake: false }, set, 1 / 60);
    if (n.cut) cuts++;
  }
  assert.ok(cuts > 5 && cuts < 300, `리미터 바운스 없음 (${cuts})`);
  assert.ok(n.rpm <= 7150 && n.rpm > 6000);
  // 놓으면 아이들로
  for (let i = 0; i < 600; i++) stepSim(n, { thr: 0, brake: false }, set, 1 / 60);
  assert.equal(n.rpm, idleRpm(4));

  // 런치컨트롤: 브레이크+엑셀 정지 → lcRpm(+150) 에서 제한, 차는 안 움직임
  const lset: Setup = { ...set, lcOn: true, lcRpm: 4000 };
  const l = newSim();
  l.rpm = 900;
  shift(l, 1, lset);
  l.shiftT = 0;
  let mx = 0;
  for (let i = 0; i < 300; i++) {
    stepSim(l, { thr: 1, brake: true }, lset, 1 / 60);
    mx = Math.max(mx, l.rpm);
  }
  assert.ok(l.lc && mx <= 4150 + 1e-6 && mx > 3500, `런치 rpm ${mx}`);
  assert.equal(l.v, 0);
  // 브레이크 떼면 출발
  for (let i = 0; i < 120; i++) stepSim(l, { thr: 1, brake: false }, lset, 1 / 60);
  assert.ok(!l.lc && l.v > 3);

  // 자동변속(DCT) 풀스로틀 20초 → 기어 올라가고 레드라인 안 넘음
  const aset: Setup = { ...set, trans: "dct" };
  const a = newSim();
  a.rpm = 900;
  shift(a, 1, aset);
  let amax = 0;
  for (let i = 0; i < 1200; i++) {
    stepSim(a, { thr: 1, brake: false }, aset, 1 / 60);
    amax = Math.max(amax, a.rpm);
  }
  assert.ok(a.gear >= 3, `자동 변속 안 됨 (gear ${a.gear})`);
  assert.ok(amax <= 7150 + 1e-6);
  // 코스팅으로 감속하면 다운시프트
  for (let i = 0; i < 3600; i++) stepSim(a, { thr: 0, brake: true }, aset, 1 / 60);
  assert.equal(a.v, 0);
  assert.equal(a.gear, 1);

  // 고속에서 엑셀 뗌: 1초간 기어 유지, 이후 한 단씩 1초 이상 간격, 최종은 rpm 이 0.3 레드라인 밑인 기어 (7단 직행 금지)
  const lift = newSim();
  lift.gear = 3;
  lift.v = 30; // 108 km/h, 3단 ≈ 6200 rpm
  lift.rpm = wheelRpm(30, gearRatios(7)[2]);
  lift.prevThr = 1;
  for (let i = 0; i < 6; i++) stepSim(lift, { thr: 1, brake: false }, aset, 1 / 60);
  const gearAtLift = lift.gear;
  const shiftFrames: number[] = [];
  for (let i = 0; i < 600; i++) {
    const before = lift.gear;
    stepSim(lift, { thr: 0, brake: false }, aset, 1 / 60);
    if (lift.gear !== before) shiftFrames.push(i);
  }
  assert.ok(shiftFrames.length > 0 && shiftFrames[0] >= 60, `리프트 직후 기어 유지 안 됨 ${shiftFrames[0]}`);
  for (let i = 1; i < shiftFrames.length; i++)
    assert.ok(shiftFrames[i] - shiftFrames[i - 1] >= 60, `연속 업시프트 ${shiftFrames}`);
  assert.ok(lift.gear > gearAtLift, `코스팅 업시프트 없음 ${lift.gear}`);
  // 한 단 아래였다면 아직 0.25×레드라인 위 → 필요한 만큼만 올렸다 (108km/h 면 7단 ≈ 2300rpm 이 실차 정상)
  assert.ok(wheelRpm(lift.v, gearRatios(7)[lift.gear - 2]) > 0.25 * aset.redline, "불필요한 업시프트");
  assert.ok(lift.rpm < 0.3 * aset.redline + 400, `코스팅 rpm ${lift.rpm}`);

  // 패들 개입: DCT 4단 주행 중 수동 다운시프트 → 부분 개도로 5초간 자동이 되돌리지 않음
  const pad = newSim();
  pad.gear = 4;
  pad.v = 15; // 54 km/h — 3단으로 내려도 5초간 리미터엔 안 닿음 (자동이면 0.56×레드라인에서 되올릴 상황)
  pad.rpm = wheelRpm(15, gearRatios(7)[3]);
  assert.ok(shift(pad, -1, aset, true) && pad.manualT > 0);
  for (let i = 0; i < 300; i++) stepSim(pad, { thr: 0.4, brake: false }, aset, 1 / 60);
  assert.equal(pad.gear, 3, "수동 개입 후 자동이 되돌림");
  // N→1 은 수동 유지 아님
  const d = newSim();
  d.rpm = 900;
  assert.ok(shift(d, 1, aset, true) && d.manualT === 0);

  // 토크 곡선 형태
  assert.ok(torqueShape(0.6) === 1 && torqueShape(0.1) < torqueShape(0.6) && torqueShape(1) < 1);

  // 점화순서 파싱 · 순서 지정 패턴
  assert.deepEqual(parseOrder("1-8-4-3-6-5-7-2", 8), [1, 8, 4, 3, 6, 5, 7, 2]);
  assert.equal(parseOrder("1-8-4-3-6-5-7", 8), null);
  assert.equal(parseOrder("1-1-4-3-6-5-7-2", 8), null);
  assert.equal(parseOrder("1 8 4 3 6 5 7 9", 8), null);
  assert.deepEqual(firesFromOrder([1, 5, 4, 8, 6, 3, 7, 2], halvesOf(8)).map((f) => f.b), [0, 1, 0, 1, 1, 0, 1, 0], "Ford 크로스플레인 뱅크 패턴");
  assert.deepEqual(firingPattern(8, "vee", "cross", [1, 2, 3, 4, 5, 6, 7, 8]).map((f) => f.b), [0, 1, 0, 1, 0, 1, 0, 1]);
  assert.deepEqual(firingPattern(4, "inline", "cross", [1, 3, 4, 2]).map((f) => f.b), [0, 0, 0, 0], "직렬은 뱅크 하나");
  const d8 = defaultOrder(8, "vee", "cross");
  assert.deepEqual([...d8].sort((a, b) => a - b), [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.deepEqual(firingPattern(8, "vee", "cross", d8).map((f) => f.b), [0, 1, 1, 0, 1, 0, 0, 1], "기본 순서는 기본 패턴 재현");
  assert.deepEqual(firesFromOrder([1, 2, 3], oddEven, 360).map((f) => f.a), [0, 120, 240], "2행정 360° 사이클");

  // 엔진 관성: 큰 엔진·디젤이 무겁다
  assert.ok(engineInertia(2) < engineInertia(5) && engineInertia(5.9, true) > engineInertia(5.9));
}

// ── 엔진 프리셋 ──────────────────────────────────────────
{
  const ids = new Set<string>();
  for (const p of PRESETS) {
    assert.ok(!ids.has(p.id), `중복 id ${p.id}`);
    ids.add(p.id);
    assert.ok(p.cyl >= 1 && p.cyl <= 12 && p.redline > p.idle && p.torque > 0 && p.liters > 0, p.id);
    if (p.order) assert.deepEqual([...p.order].sort((a, b) => a - b), Array.from({ length: p.cyl }, (_, i) => i + 1), `${p.id} 점화순서`);
    const fires = presetFires(p);
    assert.equal(fires.length, p.cyl, `${p.id} 점화 수`);
    const cyc = cycleOf(p);
    assert.ok(fires.every((f) => f.a >= 0 && f.a < cyc && (f.b === 0 || f.b === 1)), `${p.id} 점화각`);
    const c = curveOf(p);
    assert.ok(c.end >= 0.3 && c.end <= 1 && c.peakAt > 0 && c.peakAt < 1, `${p.id} 곡선`);
    // 곡선이 카탈로그 출력에 근접 (±20%)
    let hpMax = 0;
    for (let r = p.idle; r <= p.redline; r += 50) hpMax = Math.max(hpMax, hpAt(p, r));
    assert.ok(Math.abs(hpMax - p.hp) / p.hp < 0.2, `${p.id} 출력 ${hpMax.toFixed(0)} vs ${p.hp}`);
    assert.ok(Math.abs(torqueAt(p, p.torqueRpm) - p.torque) < 1e-6, `${p.id} 최대토크점`);
  }
  // 수평대향 4기통(스바루)은 한 뱅크 두 번 연속 → R R L L
  assert.deepEqual(presetFires(findPreset("ej20")!).map((f) => f.b), [0, 0, 1, 1]);
  // 포르쉐 수평대향 6기통은 교대
  assert.deepEqual(presetFires(findPreset("m64")!).map((f) => f.b), [0, 1, 0, 1, 0, 1]);
  // 할리 315/405 부등간격
  assert.deepEqual(presetFires(findPreset("evo1340")!).map((f) => f.a), [0, 315]);
  // 사용자가 순서를 바꾸면 뱅크 패턴이 바뀐다 (크로스 → 교대)
  assert.deepEqual(presetFires(findPreset("coyote")!, [1, 5, 2, 6, 3, 7, 4, 8]).map((f) => f.b), [0, 1, 0, 1, 0, 1, 0, 1]);
  // 프리셋으로 물리: F1 V8 중립 풀스로틀 3초면 리미터 근처
  const f1 = findPreset("ca2006")!;
  const fset: Setup = { cyl: f1.cyl, redline: f1.redline, trans: "mt", lcOn: false, lcRpm: 4000, torque: f1.torque, idle: f1.idle, liters: f1.liters, curve: curveOf(f1) };
  const fs = newSim();
  fs.rpm = f1.idle;
  for (let i = 0; i < 180; i++) stepSim(fs, { thr: 1, brake: false }, fset, 1 / 60);
  assert.ok(fs.rpm > 17000 && fs.rpm <= f1.redline + 150, `F1 회전 ${fs.rpm}`);
  // 코요테 V8 + 머슬카(1750kg RWD): 풀스로틀 발진은 휠스핀 → rpm 이 차속보다 높게 치솟고, 부분 개도 발진이 더 빠르거나 비슷
  const cy = findPreset("coyote")!;
  const cset: Setup = { ...fset, cyl: cy.cyl, redline: cy.redline, torque: cy.torque, idle: cy.idle, liters: cy.liters, curve: curveOf(cy), veh: VEHICLES.muscle };
  const launch = (thr1: number, vset: Setup = cset) => {
    const cs = newSim();
    cs.rpm = cy.idle;
    shift(cs, 1, vset);
    let t100 = -1;
    let spun = false;
    let maxGap = 0; // 휠스핀 중 (엔진 기준 구동륜 rpm − 차속 기준 rpm)
    for (let i = 0; i < 900 && t100 < 0; i++) {
      const thr = cs.gear === 1 ? thr1 : 1;
      if (cs.rpm > cy.redline - 200 && cs.shiftT <= 0) shift(cs, 1, vset);
      stepSim(cs, { thr, brake: false }, vset, 1 / 60);
      if (cs.slip) {
        spun = true;
        const ratio = gearRatios(6, VEHICLES.muscle)[cs.gear - 1];
        maxGap = Math.max(maxGap, wheelRpm(cs.vw, ratio, VEHICLES.muscle.wheel) - wheelRpm(cs.v, ratio, VEHICLES.muscle.wheel));
      }
      if (cs.v >= 100 / 3.6) t100 = i / 60;
    }
    return { t100, spun, maxGap };
  };
  const full = launch(1);
  // 같은 차에 접지만 넉넉하면(μ 2배) 스핀 없이 더 빠르다 → 휠스핀은 시간 손해
  const grip = launch(1, { ...cset, veh: { ...VEHICLES.muscle, mu: VEHICLES.muscle.mu * 2 } });
  assert.ok(full.spun && full.maxGap > 1500, `풀스로틀 휠스핀 rpm 분리 ${full.maxGap.toFixed(0)}`);
  assert.ok(full.t100 > 4.5 && full.t100 < 7.5, `코요테 풀스로틀 0→100 ${full.t100.toFixed(2)}s (실차 머스탱 GT ≈5.3)`);
  assert.ok(!grip.spun && grip.t100 > 0 && grip.t100 < full.t100, `접지 충분 ${grip.t100.toFixed(2)}s vs 스핀 ${full.t100.toFixed(2)}s`);
  // 휠스핀 중 엑셀을 떼면 구동륜이 차속으로 내려와 다시 물린다
  const ws = newSim();
  ws.rpm = cy.idle;
  shift(ws, 1, cset);
  ws.shiftT = 0;
  for (let i = 0; i < 60; i++) stepSim(ws, { thr: 1, brake: false }, cset, 1 / 60);
  assert.ok(ws.slip && ws.vw > ws.v + 1, "휠스핀 상태여야");
  for (let i = 0; i < 60; i++) stepSim(ws, { thr: 0, brake: false }, cset, 1 / 60);
  assert.ok(!ws.slip && Math.abs(ws.vw - ws.v) < 1e-9, "엑셀 떼면 재접지");
  // AWD 슈퍼카는 같은 엔진으로 더 빨리 (접지 우위)
  const aset: Setup = { ...cset, veh: VEHICLES.awd };
  const as = newSim();
  as.rpm = cy.idle;
  shift(as, 1, aset);
  let tAwd = -1;
  for (let i = 0; i < 900 && tAwd < 0; i++) {
    if (as.rpm > cy.redline - 200 && as.shiftT <= 0) shift(as, 1, aset);
    stepSim(as, { thr: 1, brake: false }, aset, 1 / 60);
    if (as.v >= 100 / 3.6) tAwd = i / 60;
  }
  assert.ok(tAwd > 0 && tAwd < full.t100, `AWD ${tAwd.toFixed(2)}s 가 RWD 풀스로틀 ${full.t100.toFixed(2)}s 보다 빨라야`);
  // 디젤 1단 발진도 됨
  const dz = findPreset("6bt")!;
  const dset: Setup = { ...fset, cyl: dz.cyl, redline: dz.redline, torque: dz.torque, idle: dz.idle, liters: dz.liters, curve: curveOf(dz) };
  const ds = newSim();
  ds.rpm = dz.idle;
  shift(ds, 1, dset);
  for (let i = 0; i < 300; i++) stepSim(ds, { thr: 1, brake: false }, dset, 1 / 60);
  assert.ok(ds.v > 5 && ds.rpm <= dz.redline + 150, `디젤 발진 ${ds.v} ${ds.rpm}`);
}

console.log("games logic ok");
