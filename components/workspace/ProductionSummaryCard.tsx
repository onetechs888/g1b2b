import {
  Box,
  CheckCircle2,
  Factory,
  PackageCheck,
  PackageOpen,
  ScanSearch,
  ShieldCheck,
  Truck,
  Wrench,
} from "lucide-react";

interface ProductionStatusItem {
  label: string;
  count: number;
  percent: number;
  tone?: string;
}

interface ProductionSummaryCardProps {
  items: ProductionStatusItem[];
}

const toneClass: Record<string, string> = {
  slate: "bg-slate-500 text-slate-600",
  blue: "bg-blue-600 text-blue-600",
  cyan: "bg-cyan-500 text-cyan-600",
  indigo: "bg-indigo-600 text-indigo-600",
  amber: "bg-amber-500 text-amber-600",
  green: "bg-emerald-600 text-emerald-600",
  emerald: "bg-emerald-500 text-emerald-600",
  violet: "bg-violet-600 text-violet-600",
  purple: "bg-purple-600 text-purple-600",
};

function getTone(tone?: string) {
  return toneClass[tone ?? "blue"] ?? toneClass.blue;
}

function getIcon(label: string) {
  if (label.includes("소재준비")) return PackageOpen;
  if (label.includes("소재입고")) return Box;
  if (label.includes("소재검수")) return ShieldCheck;
  if (label.includes("가공대기")) return Factory;
  if (label.includes("가공중")) return Wrench;
  if (label.includes("가공완료")) return CheckCircle2;
  if (label.includes("검수요청")) return ScanSearch;
  if (label.includes("품질검수")) return ShieldCheck;
  if (label.includes("출하준비")) return Truck;
  if (label.includes("출하")) return PackageCheck;

  return Factory;
}

export default function ProductionSummaryCard({
  items,
}: ProductionSummaryCardProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <h2 className="text-xl font-black tracking-tight text-slate-950">
          생산 상태 현황
        </h2>

        <button className="text-xs font-black text-blue-600">전체보기 ›</button>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-[1.3fr_44px_58px_1fr] rounded-lg bg-slate-50 px-3 py-3 text-[11px] font-black text-slate-500">
          <div>항목</div>
          <div className="text-center">건수</div>
          <div className="text-center">비율</div>
          <div>진행</div>
        </div>

        <div className="divide-y divide-slate-100">
          {items.map((item) => {
            const Icon = getIcon(item.label);
            const tone = getTone(item.tone);
            const barClass = tone.split(" ")[0];
            const textClass = tone.split(" ")[1];

            return (
              <div
                key={item.label}
                className="grid grid-cols-[1.3fr_44px_58px_1fr] items-center px-3 py-3 text-xs"
              >
                <div className="flex items-center gap-2">
                  <Icon size={15} className={textClass} />
                  <span className="font-black text-slate-800">
                    {item.label}
                  </span>
                </div>

                <div className="text-center font-black text-slate-950">
                  {item.count}
                </div>

                <div className="text-center font-black text-slate-700">
                  {item.percent.toFixed(1)}%
                </div>

                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    className={`h-2 rounded-full ${barClass}`}
                    style={{
                      width: `${Math.min(item.percent, 100)}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-4 text-center text-[11px] font-bold text-slate-500">
          전체{" "}
          {items.reduce((sum, item) => sum + item.count, 0).toLocaleString()}{" "}
          항목 기준
        </div>
      </div>
    </div>
  );
}