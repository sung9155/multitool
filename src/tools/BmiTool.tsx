import { Field, Stat, TextInput, fmtNum } from "../components/ui";
import { Gauge, PALETTE } from "../components/charts";
import { useLang } from "../components/i18n";
import { useToolState } from "../components/toolState";

const TEXT = {
  ko: {
    height: "키",
    weight: "몸무게",
    classification: "분류 (아시아 기준)",
    normalRange: "정상 체중 범위 (BMI 18.5~23)",
    underweight: "저체중",
    normal: "정상",
    overweight: "과체중",
    obese1: "비만 1단계",
    obese2: "비만 2단계 이상",
    barUnderweight: "저체중",
    barNormal: "정상",
    barOverweight: "과체중",
    barObese1: "비만1",
    barObese2: "비만2+",
    note:
      "BMI = 몸무게(kg) ÷ 키(m)². 대한비만학회 아시아-태평양 기준(정상 18.5~23). 근육량·체지방 미반영이라 참고용.",
  },
  en: {
    height: "Height",
    weight: "Weight",
    classification: "Classification (Asian criteria)",
    normalRange: "Normal weight range (BMI 18.5~23)",
    underweight: "Underweight",
    normal: "Normal",
    overweight: "Overweight",
    obese1: "Obese I",
    obese2: "Obese II+",
    barUnderweight: "Underweight",
    barNormal: "Normal",
    barOverweight: "Overweight",
    barObese1: "Obese I",
    barObese2: "Obese II+",
    note:
      "BMI = weight(kg) ÷ height(m)². Korean Society for the Study of Obesity Asia-Pacific criteria (normal 18.5~23). Excludes muscle mass and body fat, for reference only.",
  },
  zh: {
    height: "身高",
    weight: "体重",
    classification: "分类（亚洲标准）",
    normalRange: "正常体重范围 (BMI 18.5~23)",
    underweight: "偏瘦",
    normal: "正常",
    overweight: "超重",
    obese1: "肥胖1级",
    obese2: "肥胖2级+",
    barUnderweight: "偏瘦",
    barNormal: "正常",
    barOverweight: "超重",
    barObese1: "肥胖1级",
    barObese2: "肥胖2级+",
    note:
      "BMI = 体重(kg) ÷ 身高(m)²。韩国肥胖学会亚太标准（正常 18.5~23）。未计入肌肉量与体脂，仅供参考。",
  },
} as const;

type CatKey = "underweight" | "normal" | "overweight" | "obese1" | "obese2";

// 대한비만학회(아시아 기준) 분류
const CATS: { max: number; key: CatKey; color: string }[] = [
  { max: 18.5, key: "underweight", color: PALETTE.sky },
  { max: 23, key: "normal", color: PALETTE.emerald },
  { max: 25, key: "overweight", color: PALETTE.amber },
  { max: 30, key: "obese1", color: "#fb923c" },
  { max: Infinity, key: "obese2", color: PALETTE.rose },
];

function classify(bmi: number) {
  return CATS.find((c) => bmi < c.max) ?? CATS[CATS.length - 1];
}

export default function BmiTool() {
  const t = TEXT[useLang()];
  const [height, setHeight] = useToolState("height", "172"); // cm
  const [weight, setWeight] = useToolState("weight", "68"); // kg

  const h = Number(height) / 100;
  const w = Number(weight);
  const bmi = h > 0 ? w / (h * h) : 0;
  const cat = classify(bmi);

  // 정상 체중 범위 (BMI 18.5~23)
  const lo = 18.5 * h * h;
  const hi = 23 * h * h;

  // 게이지: BMI 15~35 구간을 0~100%로 매핑
  const gaugePct = Math.max(0, Math.min(100, ((bmi - 15) / (35 - 15)) * 100));

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t.height} hint="cm">
          <TextInput
            mono
            inputMode="decimal"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
          />
        </Field>
        <Field label={t.weight} hint="kg">
          <TextInput
            mono
            inputMode="decimal"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Gauge value={gaugePct} label={`BMI ${fmtNum(bmi, 1)}`} color={cat.color} />
        <div className="space-y-3">
          <div
            className="rounded-lg border p-3"
            style={{ borderColor: cat.color + "66" }}
          >
            <div className="text-xs text-zinc-500">{t.classification}</div>
            <div className="text-2xl font-bold" style={{ color: cat.color }}>
              {t[cat.key]}
            </div>
          </div>
          <Stat
            label={t.normalRange}
            value={`${fmtNum(lo, 1)} ~ ${fmtNum(hi, 1)} kg`}
          />
        </div>
      </div>

      {/* 분류 막대 */}
      <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
        <div className="flex h-8 text-[11px] font-medium text-white">
          {[
            [t.barUnderweight, PALETTE.sky, "~18.5"],
            [t.barNormal, PALETTE.emerald, "18.5~23"],
            [t.barOverweight, PALETTE.amber, "23~25"],
            [t.barObese1, "#fb923c", "25~30"],
            [t.barObese2, PALETTE.rose, "30~"],
          ].map(([l, c, range]) => (
            <div
              key={range as string}
              className="flex flex-1 flex-col items-center justify-center"
              style={{ background: c as string }}
            >
              <span>{l}</span>
              <span className="opacity-80">{range}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-zinc-500">{t.note}</p>
    </div>
  );
}
