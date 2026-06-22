interface ProductionStatusItem {
  label: string;
  count: number;
  percent: number;
  color?: string;
}

interface ProductionSummaryCardProps {
  items: ProductionStatusItem[];
}

export default function ProductionSummaryCard({
  items,
}: ProductionSummaryCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <h2 className="text-xl font-bold text-slate-900">
          생산 상태 현황
        </h2>

        <button className="text-sm font-semibold text-blue-600">
          전체보기 ›
        </button>
      </div>

      <div className="px-6 py-4">
        <div className="grid grid-cols-[1fr_60px_70px_1.2fr] border-b border-slate-100 bg-slate-50 px-3 py-3 text-xs font-bold text-slate-500">
          <div>항목</div>
          <div className="text-center">건수</div>
          <div className="text-center">비율</div>
          <div>진행 상황</div>
        </div>

        <div className="divide-y divide-slate-100">
          {items.map((item) => (
            <div
              key={item.label}
              className="grid grid-cols-[1fr_60px_70px_1.2fr] items-center px-3 py-3 text-sm"
            >
              <div className="font-semibold text-slate-800">
                {item.label}
              </div>

              <div className="text-center font-bold text-slate-900">
                {item.count}
              </div>

              <div className="text-center font-semibold text-slate-700">
                {item.percent.toFixed(1)}%
              </div>

              <div className="h-2 rounded-full bg-slate-100">
                <div
                  className={`h-2 rounded-full ${item.color ?? "bg-blue-600"}`}
                  style={{
                    width: `${Math.min(item.percent, 100)}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 text-center text-xs font-medium text-slate-500">
          전체{" "}
          {items.reduce((sum, item) => sum + item.count, 0).toLocaleString()}{" "}
          항목 기준
        </div>
      </div>
    </div>
  );
}