"use client";

type RFQSummaryCardsProps = {
  customerName: string;
  minimumTier: string;
  bidDeadline: string;
  bidDeadlineLabel?: string;
  dueDate: string;
  bomCount: number;
  status: string;
};

type CardProps = {
  label: string;
  value: string;
  subValue?: string;
  highlight?: boolean;
};

function SummaryCard({
  label,
  value,
  subValue,
  highlight = false,
}: CardProps) {
  return (
    <div className="min-w-0 border-l border-slate-200 pl-4 first:border-l-0 first:pl-0">
      <p className="text-xs font-semibold text-slate-500">
        {label}
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <p className="truncate text-sm font-black text-slate-900">
          {value}
        </p>

        {subValue && (
          <span
            className={`text-xs font-black ${
              highlight
                ? "text-red-600"
                : "text-slate-500"
            }`}
          >
            ({subValue})
          </span>
        )}
      </div>
    </div>
  );
}

export default function RFQSummaryCards({
  customerName,
  minimumTier,
  bidDeadline,
  bidDeadlineLabel,
  dueDate,
  bomCount,
  status,
}: RFQSummaryCardsProps) {
  return (
    <section className="mb-4 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <SummaryCard
          label="고객사"
          value={customerName}
        />

        <SummaryCard
          label="참여 가능 Tier"
          value={minimumTier}
        />

        <SummaryCard
          label="입찰 마감일"
          value={bidDeadline}
          subValue={bidDeadlineLabel}
          highlight
        />

        <SummaryCard
          label="납품 요청일"
          value={dueDate}
        />

        <SummaryCard
          label="BOM 품목"
          value={`${bomCount.toLocaleString()}개`}
        />

        <SummaryCard
          label="입찰 상태"
          value={status}
        />
      </div>
    </section>
  );
}