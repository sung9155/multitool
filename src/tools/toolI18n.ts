export const toolI18n: Record<
  string,
  { en: { name: string; description: string }; zh: { name: string; description: string } }
> = {
  "jwt": {
    en: { name: "JWT Decoder", description: "Decode JWT header & payload + check expiry" },
    zh: { name: "JWT 解码器", description: "解码 JWT 头部和载荷 + 检查过期" },
  },
  "regex": {
    en: { name: "Regex Tester", description: "Match highlighting + capture groups table" },
    zh: { name: "正则测试", description: "匹配高亮 + 分组表" },
  },
  "qr": {
    en: { name: "QR Code Generator", description: "URL/text → QR (offline, PNG download)" },
    zh: { name: "二维码生成器", description: "URL/文本 → 二维码（离线，PNG 下载）" },
  },
  "world-clock": {
    en: {
      name: "World Clock",
      description: "Current time & offsets for major cities (live)",
    },
    zh: {
      name: "世界时间",
      description: "主要城市当前时间 · 时差（实时）",
    },
  },
  "analog-scale": {
    en: {
      name: "Analog Scaling",
      description: "Convert 4-20mA / 0-10V signals ↔ measured values (PLC scaling)",
    },
    zh: {
      name: "模拟量标定",
      description: "4-20mA / 0-10V 信号 ↔ 测量值换算（PLC 标定）",
    },
  },
  "ballscrew": {
    en: {
      name: "Ball Screw Positioning",
      description: "Lead · gear ratio · PPR → resolution, motor RPM, pulse frequency",
    },
    zh: {
      name: "滚珠丝杠定位",
      description: "导程·减速比·PPR → 分辨率、电机 RPM、脉冲频率",
    },
  },
  "encoder": {
    en: {
      name: "Encoder Resolution",
      description: "PPR · multiplier → counts, angular/linear resolution, max speed",
    },
    zh: {
      name: "编码器分辨率",
      description: "PPR·倍频 → 计数、角度/线性分辨率、最大转速",
    },
  },
  "cylinder-force": {
    en: {
      name: "Pneumatic Cylinder Thrust",
      description: "Bore · rod · pressure → extend/retract thrust (N·kgf)",
    },
    zh: {
      name: "气缸推力",
      description: "缸径·活塞杆·压力 → 前进/后退推力（N·kgf）",
    },
  },
  "pid": {
    en: {
      name: "PID Simulator",
      description: "Kp·Ki·Kd tuning → step response graph + overshoot/settling time",
    },
    zh: {
      name: "PID 仿真器",
      description: "Kp·Ki·Kd 整定 → 阶跃响应曲线 + 超调量/调节时间",
    },
  },
  "three-phase": {
    en: {
      name: "Three-Phase Power/Current",
      description: "Voltage · current · power factor ↔ kW·kVA·kVAR",
    },
    zh: {
      name: "三相功率/电流",
      description: "电压·电流·功率因数 ↔ kW·kVA·kVAR",
    },
  },
  "takt": {
    en: {
      name: "Takt Time / Output",
      description: "Cycle time · availability → UPH · daily output · allowable takt",
    },
    zh: {
      name: "节拍时间/产量",
      description: "周期时间·稼动率 → UPH·日产量·允许节拍",
    },
  },
  "oee": {
    en: {
      name: "OEE (Overall Equipment Effectiveness)",
      description: "Availability × Performance × Quality",
    },
    zh: {
      name: "OEE 设备综合效率",
      description: "稼动率 × 性能 × 良品率",
    },
  },
  "pressure": {
    en: {
      name: "Pressure Unit Converter",
      description: "MPa · bar · psi · kgf/cm² · mmHg",
    },
    zh: {
      name: "压力单位换算",
      description: "MPa · bar · psi · kgf/cm² · mmHg",
    },
  },
  "net-salary": {
    en: {
      name: "Take-Home Pay",
      description: "Insurance · income tax deductions → monthly net pay (deduction table)",
    },
    zh: {
      name: "净到手工资",
      description: "四大保险·所得税扣除 → 每月实发工资（扣除明细表）",
    },
  },
  "loan": {
    en: {
      name: "Loan Repayment Calculator",
      description:
        "Equal payment · equal principal · bullet → monthly payment · total interest + balance curve",
    },
    zh: {
      name: "贷款还款计算器",
      description: "等额本息·等额本金·到期一次性 → 月还款额·总利息 + 余额曲线",
    },
  },
  "percent": {
    en: {
      name: "Percentage Calculator",
      description: "Ratio · change rate · discount and other % calculations",
    },
    zh: {
      name: "百分比计算器",
      description: "比例·增减率·折扣等 % 计算",
    },
  },
  "unit-convert": {
    en: {
      name: "Unit Converter",
      description: "Length · weight · temperature · area · volume conversion table",
    },
    zh: {
      name: "单位换算器",
      description: "长度·重量·温度·面积·体积同步换算表",
    },
  },
  "bmi": {
    en: {
      name: "BMI Calculator",
      description: "Body mass index + classification gauge (Asian standard)",
    },
    zh: {
      name: "BMI 计算器",
      description: "身体质量指数 + 分类标尺（亚洲标准）",
    },
  },
  "date-calc": {
    en: {
      name: "Date Calculator / D-Day",
      description: "Difference between two dates, date N days after/before",
    },
    zh: {
      name: "日期计算器 / 倒数日",
      description: "两个日期之差，N 天后·前的日期",
    },
  },
  "split-bill": {
    en: {
      name: "Tip · Split Bill",
      description: "Total · people · tip → amount per person",
    },
    zh: {
      name: "小费·AA 分账",
      description: "总额·人数·小费 → 每人金额",
    },
  },
  "char-count": {
    en: {
      name: "Character Counter",
      description: "Character · word · line · byte count (check text/SNS limits)",
    },
    zh: {
      name: "字数统计",
      description: "字符·单词·行·字节数（检查文本/社交媒体限制）",
    },
  },
  "json-format": {
    en: {
      name: "JSON Formatter",
      description: "Beautify, minify, and validate JSON",
    },
    zh: {
      name: "JSON 格式化",
      description: "JSON 美化、压缩、有效性校验",
    },
  },
  "base64": {
    en: {
      name: "Base64 Converter",
      description: "Base64 encoding / decoding (UTF-8)",
    },
    zh: {
      name: "Base64 转换",
      description: "Base64 编码 / 解码（UTF-8）",
    },
  },
  "url-encode": {
    en: {
      name: "URL Encoding",
      description: "URL component encoding / decoding",
    },
    zh: {
      name: "URL 编码",
      description: "URL 组件编码 / 解码",
    },
  },
  "timestamp": {
    en: {
      name: "Timestamp Converter",
      description: "Unix timestamp ↔ date/time",
    },
    zh: {
      name: "时间戳转换",
      description: "Unix 时间戳 ↔ 日期/时间",
    },
  },
  "uuid": {
    en: {
      name: "UUID Generator",
      description: "Bulk generation of UUID v4",
    },
    zh: {
      name: "UUID 生成器",
      description: "批量生成 UUID v4",
    },
  },
  "hash": {
    en: {
      name: "Hash Generator",
      description: "Compute SHA-1/256/384/512 hashes",
    },
    zh: {
      name: "哈希生成器",
      description: "计算 SHA-1/256/384/512 哈希",
    },
  },
  "vat": {
    en: {
      name: "VAT Calculator",
      description: "Calculate supply value · VAT · total",
    },
    zh: {
      name: "增值税计算器",
      description: "计算供货金额·增值税·合计",
    },
  },
  "color": {
    en: {
      name: "Color Converter",
      description: "HEX ↔ RGB ↔ HSL conversion",
    },
    zh: {
      name: "颜色转换",
      description: "HEX ↔ RGB ↔ HSL 转换",
    },
  },
};
