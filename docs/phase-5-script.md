# Phase 5 script — ไฟดับตอนแดดแรง โซลาร์ยังจ่ายไฟให้บ้านไหม?

Status: **script approved by the owner (2026-11-28)**; claims still await human technical verification before the episode can be marked approved. No real voices generated yet; the animatic uses free mock voices.

Cast: Sunny = Pat, Ton = Suwapoj, Narrator = Thanawat (clone) · model `eleven_v4`, `language_code: th`. Captions show the **Caption** column; the voice says the **Spoken** column (direction tags in [ ] are performed, never shown).

## Hook — the question

- Location: `modern-thai-house` · light: `midday-sun` · system: grid-tied, grid connected

| # | Speaker | Caption | Spoken (to ElevenLabs) | chars |
|---|---|---|---|---|
| 1 | Narrator | ไฟดับตอนแดดแรงแบบนี้ โซลาร์บนหลังคายังจ่ายไฟให้บ้านได้ไหม? | ไฟดับตอนแดดแรงแบบนี้... โซลาร์บนหลังคา ยังจ่ายไฟให้บ้านได้ไหม? | 62 |

## Living room — the power goes out

- Location: `living-room` · light: `midday-sun` · claims: `c-ongrid-stops`

| # | Speaker | Caption | Spoken (to ElevenLabs) | chars |
|---|---|---|---|---|
| 1 | Ton | อ้าว ไฟดับ! แต่แดดแรงขนาดนี้ โซลาร์บนหลังคาก็น่าจะยังจ่ายไฟได้นี่นา | [surprised] อ้าว ไฟดับ! [curious] แต่แดดแรงขนาดนี้... โซลาร์บนหลังคา ก็น่าจะยังจ่ายไฟได้นี่นา | 93 |
| 2 | Sunny | ไม่ได้ครับพี่ต้น บ้านเราเป็นระบบออนกริด พอไฟจากการไฟฟ้าดับ อินเวอร์เตอร์จะหยุดจ่ายไฟทันทีครับ | [warmly] ไม่ได้ครับพี่ต้น บ้านเราเป็นระบบออนกริด... พอไฟจากการไฟฟ้าดับ อินเวอร์เตอร์จะหยุดจ่ายไฟทันทีครับ | 105 |
| 3 | Ton | อ้าว แล้วทำไมล่ะ แดดก็ยังมีอยู่นะ | [puzzled] อ้าว... แล้วทำไมล่ะ แดดก็ยังมีอยู่นะ | 46 |
| 4 | Sunny | เดี๋ยวผมให้ดูครับ! | [cheerful] เดี๋ยวผมให้ดูครับ! | 29 |

## Cutaway — on-grid inverter stops (anti-islanding)

- Location: `energy-cutaway-house` · light: `midday-sun` · system: grid-tied, grid outage · claims: `c-ongrid-stops`, `c-lineworker-safety`

| # | Speaker | Caption | Spoken (to ElevenLabs) | chars |
|---|---|---|---|---|
| 1 | Sunny | ดูนี่ครับ แดดยังส่องแผงอยู่ แต่ทุกเส้นหยุดหมด เพราะอินเวอร์เตอร์หยุดจ่ายไฟ | [curious] ดูนี่ครับ... แดดยังส่องแผงอยู่ แต่ทุกเส้นหยุดหมดเลย เพราะอินเวอร์เตอร์หยุดจ่ายไฟครับ | 94 |
| 2 | Sunny | ระบบออกแบบมาแบบนี้ เพื่อไม่ให้ไฟย้อนกลับเข้าสายไฟฟ้า ตอนที่ช่างกำลังซ่อมอยู่ครับ | [warmly] ระบบออกแบบมาแบบนี้ เพื่อไม่ให้ไฟย้อนกลับเข้าสายไฟฟ้า... ตอนที่ช่างกำลังซ่อมอยู่ครับ | 92 |
| 3 | Ton | อ๋อ เพื่อความปลอดภัยของช่างนี่เอง | [warmly] อ๋อ... เพื่อความปลอดภัยของช่างนี่เอง | 45 |

## Cutaway — hybrid + battery with a backup circuit

- Location: `energy-cutaway-house` · light: `midday-sun` · system: hybrid, grid outage · claims: `c-hybrid-backup-needs`, `c-backup-isolation`

| # | Speaker | Caption | Spoken (to ElevenLabs) | chars |
|---|---|---|---|---|
| 1 | Ton | แล้วถ้าอยากมีไฟใช้ตอนไฟดับล่ะ ทำได้ไหม | [curious] แล้วถ้าอยากมีไฟใช้ตอนไฟดับล่ะ... ทำได้ไหม? | 52 |
| 2 | Sunny | ทำได้ครับ! ถ้าเป็นระบบไฮบริดที่มีแบตเตอรี่ และตั้งค่าวงจรไฟสำรองไว้ | [excited] ทำได้ครับ! ถ้าเป็นระบบไฮบริดที่มีแบตเตอรี่... และตั้งค่าวงจรไฟสำรองไว้ครับ | 84 |
| 3 | Sunny | ระบบจะแยกตัวออกจากสายการไฟฟ้า แล้วจ่ายไฟเฉพาะวงจรสำรอง อย่างตู้เย็น ไฟ และพัดลมครับ | [cheerful] ระบบจะแยกตัวออกจากสายการไฟฟ้า แล้วจ่ายไฟเฉพาะวงจรสำรอง อย่างตู้เย็น ไฟ และพัดลมครับ | 94 |

## Garage — limits and a qualified installer

- Location: `garage-service-area` · light: `midday-sun` · system: hybrid, grid outage · claims: `c-backup-limits`, `c-qualified-installer`

| # | Speaker | Caption | Spoken (to ElevenLabs) | chars |
|---|---|---|---|---|
| 1 | Sunny | แต่ไฟสำรองจ่ายได้ตามกำลังของอินเวอร์เตอร์และแบตเตอรี่นะครับ | [warmly] แต่ไฟสำรอง จ่ายได้ตามกำลังของอินเวอร์เตอร์และแบตเตอรี่นะครับ | 69 |
| 2 | Sunny | จะเลือกระบบแบบไหน ให้ช่างผู้เชี่ยวชาญช่วยประเมินและติดตั้งดีที่สุดครับ | [cheerful] จะเลือกระบบแบบไหน... ให้ช่างผู้เชี่ยวชาญช่วยประเมินและติดตั้ง ดีที่สุดครับ | 85 |
| 3 | Ton | เข้าใจแล้ว ขอบคุณนะซันนี่! | [warmly] เข้าใจแล้ว... ขอบคุณนะซันนี่! | 38 |

## Closing — summary + official logo

- Location: `modern-thai-house` · light: `golden-hour` · claims: `c-ongrid-stops`, `c-hybrid-backup-needs`

| # | Speaker | Caption | Spoken (to ElevenLabs) | chars |
|---|---|---|---|---|
| 1 | Narrator | ไฟดับตอนแดดแรง โซลาร์จะจ่ายไฟได้หรือไม่ ขึ้นอยู่กับระบบที่บ้านคุณติดตั้ง | ไฟดับตอนแดดแรง... โซลาร์จะจ่ายไฟได้หรือไม่ ขึ้นอยู่กับระบบที่บ้านคุณติดตั้งครับ | 79 |

**Total to generate: 1067 characters** (eleven_v4).

## Technical claims (all `needs-human-review`)

| ID | Claim (Thai) | Meaning | References |
|---|---|---|---|
| `c-ongrid-stops` | ระบบออนกริด พอไฟจากการไฟฟ้าดับ อินเวอร์เตอร์จะหยุดจ่ายไฟ | A grid-tied (on-grid) PV inverter stops supplying power when the utility grid fails (anti-islanding), even in strong sun. | r-iec-62116, r-ieee-1547 |
| `c-lineworker-safety` | เพื่อไม่ให้ไฟย้อนกลับเข้าสายไฟฟ้าตอนที่ช่างกำลังซ่อม | Anti-islanding prevents the PV system from energising the utility lines during an outage, protecting utility workers. | r-ieee-1547, r-iec-62116 |
| `c-hybrid-backup-needs` | ต้องเป็นระบบไฮบริดที่มีแบตเตอรี่ และตั้งค่าวงจรไฟสำรองไว้ | Supplying power during an outage needs equipment with a configured backup output (e.g. a hybrid inverter with battery) and a backup circuit. | r-hybrid-manual, r-bl-policy |
| `c-backup-isolation` | ระบบจะแยกตัวออกจากสายการไฟฟ้า แล้วจ่ายไฟเฉพาะวงจรสำรอง | During backup operation the system isolates from the grid and supplies only the loads on the backup circuit. | r-hybrid-manual, r-ieee-1547 |
| `c-backup-limits` | ไฟสำรองจ่ายได้ตามกำลังของอินเวอร์เตอร์และแบตเตอรี่ | Backup supply is limited by the inverter's and battery's power ratings. | r-hybrid-manual |
| `c-qualified-installer` | ให้ช่างผู้เชี่ยวชาญช่วยประเมินและติดตั้ง | Electrical work and system choice should be assessed and installed by qualified professionals, never DIY. | r-bl-policy |

### References

- `r-iec-62116` — IEC 62116:2014 — Utility-interconnected photovoltaic inverters: test procedure of islanding prevention measures (IEC 62116:2014)
- `r-ieee-1547` — IEEE 1547-2018 — Interconnection and interoperability of distributed energy resources with electric power systems (IEEE Std 1547-2018)
- `r-hybrid-manual` — Hybrid inverter documentation (general) — backup (EPS) output, grid isolation and backup load limits (manufacturers' installation manuals for hybrid inverters with a backup output; general, no specific product) — kept general by the owner; product-specific references in future episodes.
- `r-bl-policy` — Billionslight electrical-accuracy and safety policy (docs/electrical-accuracy.md (internal))

The episode cannot be marked approved until a human technical reviewer verifies each claim (CLAUDE.md). `r-hybrid-manual` is kept general by the owner's decision (2026-11-28); product-specific references come in future episodes. Values (5 kW array, 10 kWh battery, 0.8 kW backup loads) are illustrative scenario values, not product specs.
