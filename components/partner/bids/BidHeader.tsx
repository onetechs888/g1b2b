"use client";

import Link from "next/link";

type BidHeaderProps = {
  biddingRequestId: string;
  projectName: string;
  statusLabel: string;
  deadlineLabel: string;
  deadlineVariant:
    | "default"
    | "urgent"
    | "closed";
};

function getRfqNumber(id: string) {
  const normalized = id
    .replaceAll("-", "")
    .slice(0, 8)
    .toUpperCase();

  return `RFQ-${normalized}`;
}

export default function BidHeader({
  biddingRequestId,
  projectName,
  statusLabel,
  deadlineLabel,
  deadlineVariant,
}: BidHeaderProps) {
  const rfqNumber = getRfqNumber(
    biddingRequestId,
  );

  const deadlineClass =
    deadlineVariant === "closed"
      ? "bg-red-50 text-red-700"
      : deadlineVariant === "urgent"
        ? "bg-amber-50 text-amber-700"
        : "bg-blue-50 text-blue-700";

  return (
    <header className="mb-4 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <Link
            href="/workspace/partner/bids"
            aria-label="입찰목록으로 이동"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-lg font-bold text-slate-700 transition hover:bg-slate-50"
          >
            ‹
          </Link>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <strong className="text-sm font-black text-blue-700">
                {rfqNumber}
              </strong>

              <span
                className={`inline-flex rounded-md px-2.5 py-1 text-xs font-bold ${deadlineClass}`}
              >
                {deadlineLabel}
              </span>

              <span className="inline-flex rounded-md bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                {statusLabel}
              </span>
            </div>

            <h1 className="mt-2 truncate text-[25px] font-black tracking-tight text-slate-950">
              {projectName}
            </h1>

            <p className="mt-1 text-sm text-slate-600">
              RFQ 조건과 BOM을 확인하고
              품목별 견적을 작성해 주세요.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/workspace/partner/bids"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            입찰목록
          </Link>

          <Link
            href="/workspace/partner/quotes"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 px-4 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
          >
            견적목록
          </Link>
        </div>
      </div>
    </header>
  );
}