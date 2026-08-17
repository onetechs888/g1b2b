"use client";

import Link from "next/link";
import {
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileSearch,
  Filter,
  FolderKanban,
  RefreshCw,
  Search,
  ShieldCheck,
  TimerReset,
  Users,
} from "lucide-react";
import {
  useMemo,
  useState,
} from "react";

import WorkspaceLayout from "@/components/workspace/WorkspaceLayout";
import { usePartnerBids } from "@/hooks/partner/usePartnerBids";
import type { PartnerOpenBiddingRequest } from "@/services/partner/biddingService";

type DeadlineFilter =
  | "all"
  | "available"
  | "urgent"
  | "closed";

type TierFilter = "all" | string;

type DeadlineInformation = {
  type:
    | "available"
    | "urgent"
    | "today"
    | "closed"
    | "unknown";
  label: string;
  shortLabel: string;
  remainingDays: number | null;
  className: string;
  dotClassName: string;
};

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getDateKey(value: Date) {
  const year = value.getFullYear();
  const month = String(
    value.getMonth() + 1,
  ).padStart(2, "0");
  const day = String(
    value.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getStartOfDay(value: Date) {
  return new Date(
    value.getFullYear(),
    value.getMonth(),
    value.getDate(),
  );
}

function getDeadlineInformation(
  deadline: string | null,
): DeadlineInformation {
  if (!deadline) {
    return {
      type: "unknown",
      label: "마감일 미정",
      shortLabel: "-",
      remainingDays: null,
      className:
        "border-slate-200 bg-slate-50 text-slate-600",
      dotClassName: "bg-slate-400",
    };
  }

  const deadlineDate = new Date(deadline);

  if (Number.isNaN(deadlineDate.getTime())) {
    return {
      type: "unknown",
      label: "마감일 미정",
      shortLabel: "-",
      remainingDays: null,
      className:
        "border-slate-200 bg-slate-50 text-slate-600",
      dotClassName: "bg-slate-400",
    };
  }

  const today = getStartOfDay(new Date());
  const targetDate =
    getStartOfDay(deadlineDate);

  const difference =
    targetDate.getTime() - today.getTime();

  const remainingDays = Math.ceil(
    difference / (1000 * 60 * 60 * 24),
  );

  if (remainingDays < 0) {
    return {
      type: "closed",
      label: "입찰 마감",
      shortLabel: "마감",
      remainingDays,
      className:
        "border-red-200 bg-red-50 text-red-700",
      dotClassName: "bg-red-500",
    };
  }

  if (remainingDays === 0) {
    return {
      type: "today",
      label: "오늘 마감",
      shortLabel: "D-Day",
      remainingDays: 0,
      className:
        "border-red-200 bg-red-50 text-red-700",
      dotClassName: "bg-red-500",
    };
  }

  if (remainingDays <= 7) {
    return {
      type: "urgent",
      label: "마감 임박",
      shortLabel: `D-${remainingDays}`,
      remainingDays,
      className:
        "border-amber-200 bg-amber-50 text-amber-700",
      dotClassName: "bg-amber-500",
    };
  }

  return {
    type: "available",
    label: "참여 가능",
    shortLabel: `D-${remainingDays}`,
    remainingDays,
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
    dotClassName: "bg-emerald-500",
  };
}

function getRfqNumber(
  id: string,
  index?: number,
) {
  if (
    typeof index === "number" &&
    index >= 0
  ) {
    return `RFQ-${String(index + 1).padStart(
      2,
      "0",
    )}`;
  }

  const normalizedId = id
    .replaceAll("-", "")
    .slice(0, 8)
    .toUpperCase();

  return `RFQ-${normalizedId}`;
}

function getTierLabel(
  tier: string | null,
) {
  if (!tier) {
    return "제한 없음";
  }

  const normalizedTier =
    tier.trim().toUpperCase();

  if (
    normalizedTier.startsWith("T") &&
    !normalizedTier.includes("이상")
  ) {
    return `${normalizedTier} 이상`;
  }

  return tier;
}

function getTierStyle(
  tier: string | null,
) {
  const normalizedTier =
    tier?.trim().toUpperCase() ?? "";

  if (normalizedTier.startsWith("T1")) {
    return "border-violet-200 bg-violet-50 text-violet-700";
  }

  if (normalizedTier.startsWith("T2")) {
    return "border-purple-200 bg-purple-50 text-purple-700";
  }

  if (normalizedTier.startsWith("T3")) {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (normalizedTier.startsWith("T4")) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (normalizedTier.startsWith("T5")) {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-600";
}

function getStatusLabel(status: string) {
  switch (status) {
    case "open":
      return "입찰 진행";

    case "draft":
      return "임시저장";

    case "closed":
      return "입찰 마감";

    case "awarded":
      return "선정 완료";

    case "cancelled":
      return "취소";

    default:
      return status;
  }
}

export default function PartnerBidsPage() {
  const {
    bids,
    isLoading,
    error,
    reload,
  } = usePartnerBids();

  const [
    searchKeyword,
    setSearchKeyword,
  ] = useState("");

  const [
    deadlineFilter,
    setDeadlineFilter,
  ] = useState<DeadlineFilter>("all");

  const [tierFilter, setTierFilter] =
    useState<TierFilter>("all");

  const tierOptions = useMemo(() => {
    return Array.from(
      new Set(
        bids
          .map(
            (bid) =>
              bid.minimum_partner_tier,
          )
          .filter(
            (
              tier,
            ): tier is string =>
              Boolean(tier),
          ),
      ),
    ).sort((first, second) =>
      first.localeCompare(second),
    );
  }, [bids]);

  const summary = useMemo(() => {
    let availableCount = 0;
    let urgentCount = 0;
    let closedCount = 0;
    let totalBomCount = 0;

    bids.forEach((bid) => {
      const deadline =
        getDeadlineInformation(
          bid.bid_deadline,
        );

      if (
        deadline.type === "available"
      ) {
        availableCount += 1;
      }

      if (
        deadline.type === "urgent" ||
        deadline.type === "today"
      ) {
        urgentCount += 1;
      }

      if (deadline.type === "closed") {
        closedCount += 1;
      }

      totalBomCount += bid.bom_count;
    });

    return {
      totalCount: bids.length,
      availableCount,
      urgentCount,
      closedCount,
      totalBomCount,
    };
  }, [bids]);

  const filteredBids = useMemo(() => {
    const normalizedKeyword =
      searchKeyword
        .trim()
        .toLowerCase();

    return bids.filter((bid, index) => {
      const deadline =
        getDeadlineInformation(
          bid.bid_deadline,
        );

      const rfqNumber = getRfqNumber(
        bid.id,
        index,
      ).toLowerCase();

      const matchesKeyword =
        normalizedKeyword.length === 0 ||
        rfqNumber.includes(
          normalizedKeyword,
        ) ||
        bid.project_name
          .toLowerCase()
          .includes(normalizedKeyword) ||
        bid.customer_company_name
          .toLowerCase()
          .includes(normalizedKeyword);

      if (!matchesKeyword) {
        return false;
      }

      const matchesTier =
        tierFilter === "all" ||
        bid.minimum_partner_tier ===
          tierFilter;

      if (!matchesTier) {
        return false;
      }

      if (deadlineFilter === "all") {
        return true;
      }

      if (
        deadlineFilter === "available"
      ) {
        return (
          deadline.type === "available"
        );
      }

      if (deadlineFilter === "urgent") {
        return (
          deadline.type === "urgent" ||
          deadline.type === "today"
        );
      }

      if (deadlineFilter === "closed") {
        return (
          deadline.type === "closed"
        );
      }

      return true;
    });
  }, [
    bids,
    searchKeyword,
    tierFilter,
    deadlineFilter,
  ]);

  const lastUpdatedAt =
    useMemo(() => {
      if (bids.length === 0) {
        return null;
      }

      const latestTimestamp =
        Math.max(
          ...bids.map((bid) => {
            const timestamp =
              new Date(
                bid.created_at,
              ).getTime();

            return Number.isNaN(timestamp)
              ? 0
              : timestamp;
          }),
        );

      if (latestTimestamp === 0) {
        return null;
      }

      return new Date(
        latestTimestamp,
      ).toISOString();
    }, [bids]);

  return (
    <WorkspaceLayout role="partner">
      <style>{`
        .g1-scroll-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .g1-scroll-hide::-webkit-scrollbar {
          display: none;
          width: 0;
          height: 0;
        }
      `}</style>

      <div className="g1-scroll-hide min-h-full overflow-auto bg-[#f7f9fc]">
        <div className="mx-auto w-full max-w-[1760px] px-5 py-5 lg:px-7">
          <PageHeader
            searchKeyword={searchKeyword}
            onSearchKeywordChange={
              setSearchKeyword
            }
            isLoading={isLoading}
            lastUpdatedAt={lastUpdatedAt}
            onReload={reload}
          />

          <section className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-4">
            <StatusSummaryCard
              tone="blue"
              icon={FileSearch}
              title="전체 입찰"
              value={summary.totalCount}
              description="현재 조회된 공개 RFQ"
            />

            <StatusSummaryCard
              tone="emerald"
              icon={CheckCircle2}
              title="참여 가능"
              value={summary.availableCount}
              description="마감까지 8일 이상 남은 입찰"
            />

            <StatusSummaryCard
              tone="amber"
              icon={CalendarClock}
              title="마감 임박"
              value={summary.urgentCount}
              description="7일 이내 마감되는 입찰"
            />

            <StatusSummaryCard
              tone="rose"
              icon={TimerReset}
              title="입찰 마감"
              value={summary.closedCount}
              description={`전체 BOM ${summary.totalBomCount.toLocaleString(
                "ko-KR",
              )}개 품목`}
            />
          </section>

          <section className="mt-4">
            <BidListPanel
              bids={bids}
              filteredBids={filteredBids}
              isLoading={isLoading}
              error={error}
              deadlineFilter={
                deadlineFilter
              }
              tierFilter={tierFilter}
              tierOptions={tierOptions}
              onDeadlineFilterChange={
                setDeadlineFilter
              }
              onTierFilterChange={
                setTierFilter
              }
              onReload={reload}
            />
          </section>
        </div>
      </div>
    </WorkspaceLayout>
  );
}

type PageHeaderProps = {
  searchKeyword: string;
  onSearchKeywordChange: (
    value: string,
  ) => void;
  isLoading: boolean;
  lastUpdatedAt: string | null;
  onReload: () => void;
};

function PageHeader({
  searchKeyword,
  onSearchKeywordChange,
  isLoading,
  lastUpdatedAt,
  onReload,
}: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <p className="text-[11px] font-black text-blue-700">
          입찰관리 / 입찰목록
        </p>

        <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
          입찰목록
        </h1>

        <p className="mt-1 text-xs font-semibold text-slate-600">
          참여 가능한 RFQ와 입찰 마감 현황을 확인할 수 있습니다.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="search"
            value={searchKeyword}
            onChange={(event) =>
              onSearchKeywordChange(
                event.target.value,
              )
            }
            placeholder="프로젝트명, 고객사 검색"
            className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-4 text-xs font-semibold text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-[300px]"
          />
        </div>

        <button
          type="button"
          onClick={onReload}
          disabled={isLoading}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-xs font-black text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            size={14}
            className={
              isLoading
                ? "animate-spin"
                : ""
            }
          />

          새로고침
        </button>
      </div>

      <div className="hidden w-full text-right lg:absolute lg:right-7 lg:top-[76px] lg:block lg:w-auto">
        <p className="text-[11px] font-semibold text-slate-500">
          마지막 업데이트{" "}
          <span className="font-bold text-slate-700">
            {lastUpdatedAt
              ? formatDateTime(
                  lastUpdatedAt,
                )
              : "-"}
          </span>
        </p>
      </div>
    </header>
  );
}

type StatusSummaryCardProps = {
  tone:
    | "blue"
    | "emerald"
    | "amber"
    | "rose";
  icon: React.ElementType;
  title: string;
  value: number;
  description: string;
};

function StatusSummaryCard({
  tone,
  icon: Icon,
  title,
  value,
  description,
}: StatusSummaryCardProps) {
  const toneMap = {
    blue: {
      icon: "bg-blue-50 text-blue-600",
      ring: "ring-blue-100",
    },
    emerald: {
      icon: "bg-emerald-50 text-emerald-600",
      ring: "ring-emerald-100",
    },
    amber: {
      icon: "bg-amber-50 text-amber-600",
      ring: "ring-amber-100",
    },
    rose: {
      icon: "bg-rose-50 text-rose-600",
      ring: "ring-rose-100",
    },
  }[tone];

  return (
    <article className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-4 ${toneMap.icon} ${toneMap.ring}`}
        >
          <Icon size={18} />
        </div>

        <div className="min-w-0">
          <p className="text-xs font-black text-slate-600">
            {title}
          </p>

          <div className="mt-2 flex items-end gap-1.5">
            <strong className="text-2xl font-black leading-none tracking-tight text-slate-950">
              {value.toLocaleString(
                "ko-KR",
              )}
            </strong>

            <span className="pb-0.5 text-xs font-black text-slate-500">
              건
            </span>
          </div>

          <p className="mt-1.5 truncate text-[11px] font-semibold text-slate-500">
            {description}
          </p>
        </div>
      </div>
    </article>
  );
}

type BidListPanelProps = {
  bids: PartnerOpenBiddingRequest[];
  filteredBids: PartnerOpenBiddingRequest[];
  isLoading: boolean;
  error: string | null;
  deadlineFilter: DeadlineFilter;
  tierFilter: TierFilter;
  tierOptions: string[];
  onDeadlineFilterChange: (
    value: DeadlineFilter,
  ) => void;
  onTierFilterChange: (
    value: TierFilter,
  ) => void;
  onReload: () => void;
};

function BidListPanel({
  bids,
  filteredBids,
  isLoading,
  error,
  deadlineFilter,
  tierFilter,
  tierOptions,
  onDeadlineFilterChange,
  onTierFilterChange,
  onReload,
}: BidListPanelProps) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-base font-black text-slate-950">
            입찰 목록
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            총{" "}
            <span className="font-bold text-slate-800">
              {filteredBids.length}
            </span>
            건 / 전체 {bids.length}건
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative">
            <Filter
              size={13}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <select
            value={deadlineFilter}
            onChange={(event) =>
              onDeadlineFilterChange(
                event.target
                  .value as DeadlineFilter,
              )
            }
            className="h-9 rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-xs font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="all">
              전체 상태
            </option>

            <option value="available">
              참여 가능
            </option>

            <option value="urgent">
              마감 임박
            </option>

            <option value="closed">
              입찰 마감
            </option>
            </select>
          </div>

          <div className="relative">
            <ShieldCheck
              size={13}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <select
            value={tierFilter}
            onChange={(event) =>
              onTierFilterChange(
                event.target.value,
              )
            }
            className="h-9 rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-xs font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="all">
              전체 Tier
            </option>

            {tierOptions.map((tier) => (
              <option
                key={tier}
                value={tier}
              >
                {getTierLabel(tier)}
              </option>
            ))}
            </select>
          </div>
        </div>
      </div>

      {isLoading && (
        <LoadingState />
      )}

      {!isLoading && error && (
        <ErrorState
          message={error}
          onReload={onReload}
        />
      )}

      {!isLoading &&
        !error &&
        filteredBids.length === 0 && (
          <EmptyState />
        )}

      {!isLoading &&
        !error &&
        filteredBids.length > 0 && (
          <>
            <div className="g1-scroll-hide overflow-x-auto">
              <table className="w-full min-w-[1180px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-[#f7f9fc]">
                    <TableHeader>
                      RFQ 번호
                    </TableHeader>

                    <TableHeader>
                      프로젝트명
                    </TableHeader>

                    <TableHeader>
                      고객사
                    </TableHeader>

                    <TableHeader align="center">
                      참여 가능 Tier
                    </TableHeader>

                    <TableHeader>
                      입찰 마감일
                    </TableHeader>

                    <TableHeader>
                      납품 요청일
                    </TableHeader>

                    <TableHeader align="center">
                      D-Day
                    </TableHeader>

                    <TableHeader align="center">
                      입찰 상태
                    </TableHeader>

                    <TableHeader align="right">
                      작업
                    </TableHeader>
                  </tr>
                </thead>

                <tbody>
                  {filteredBids.map(
                    (bid) => {
                      const originalIndex =
                        bids.findIndex(
                          (item) =>
                            item.id ===
                            bid.id,
                        );

                      const deadline =
                        getDeadlineInformation(
                          bid.bid_deadline,
                        );

                      return (
                        <tr
                          key={bid.id}
                          className="border-b border-slate-100 transition last:border-b-0 hover:bg-slate-50"
                        >
                          <TableCell>
                            <span className="font-bold text-blue-700 underline decoration-blue-200 underline-offset-4">
                              {getRfqNumber(
                                bid.id,
                                originalIndex,
                              )}
                            </span>
                          </TableCell>

                          <TableCell>
                            <div className="max-w-[190px]">
                              <p className="truncate text-xs font-black text-slate-900">
                                {
                                  bid.project_name
                                }
                              </p>

                              <p className="mt-0.5 text-[10px] font-semibold text-slate-400">
                                BOM{" "}
                                {bid.bom_count.toLocaleString(
                                  "ko-KR",
                                )}
                                개
                              </p>
                            </div>
                          </TableCell>

                          <TableCell>
                            <span className="text-xs font-bold text-slate-700">
                              {
                                bid.customer_company_name
                              }
                            </span>
                          </TableCell>

                          <TableCell align="center">
                            <span
                              className={`inline-flex rounded-md border px-2 py-1 text-xs font-bold ${getTierStyle(
                                bid.minimum_partner_tier,
                              )}`}
                            >
                              {getTierLabel(
                                bid.minimum_partner_tier,
                              )}
                            </span>
                          </TableCell>

                          <TableCell>
                            <span className="text-xs font-semibold text-slate-700">
                              {formatDate(
                                bid.bid_deadline,
                              )}
                            </span>
                          </TableCell>

                          <TableCell>
                            <span className="text-xs font-semibold text-slate-700">
                              {formatDate(
                                bid.due_date,
                              )}
                            </span>
                          </TableCell>

                          <TableCell align="center">
                            <span
                              className={`text-xs font-black ${
                                deadline.type ===
                                  "closed" ||
                                deadline.type ===
                                  "today"
                                  ? "text-red-600"
                                  : deadline.type ===
                                      "urgent"
                                    ? "text-amber-600"
                                    : "text-blue-700"
                              }`}
                            >
                              {
                                deadline.shortLabel
                              }
                            </span>
                          </TableCell>

                          <TableCell align="center">
                            <span
                              className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-bold ${deadline.className}`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${deadline.dotClassName}`}
                              />

                              {deadline.type ===
                              "closed"
                                ? "입찰 마감"
                                : getStatusLabel(
                                    bid.status,
                                  )}
                            </span>
                          </TableCell>

                          <TableCell align="right">
                            <Link
                              href={`/workspace/partner/bids/${bid.id}`}
                              onClick={(
                                event,
                              ) =>
                                event.stopPropagation()
                              }
                              className="inline-flex h-8 items-center justify-center gap-1 whitespace-nowrap rounded-md border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                            >
                              상세보기
                              <ChevronRight size={13} />
                            </Link>
                          </TableCell>
                        </tr>
                      );
                    },
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3">
              <p className="text-xs font-semibold text-slate-600">
                총{" "}
                {filteredBids.length.toLocaleString(
                  "ko-KR",
                )}
                건
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-400 disabled:cursor-not-allowed"
                >
                  ‹
                </button>

                <button
                  type="button"
                  className="flex h-8 min-w-8 items-center justify-center rounded-md bg-blue-600 px-2 text-sm font-bold text-white"
                >
                  1
                </button>

                <button
                  type="button"
                  disabled
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-400 disabled:cursor-not-allowed"
                >
                  ›
                </button>
              </div>
            </div>
          </>
        )}
    </section>
  );
}

type SelectedBidPanelProps = {
  bid: PartnerOpenBiddingRequest | null;
  rfqNumber: string | null;
};

function SelectedBidPanel({
  bid,
  rfqNumber,
}: SelectedBidPanelProps) {
  if (!bid || !rfqNumber) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
        <p className="text-sm font-bold text-slate-700">
          선택된 입찰이 없습니다.
        </p>

        <p className="mt-1 text-xs text-slate-500">
          목록에서 RFQ를 선택해 주세요.
        </p>
      </section>
    );
  }

  const deadline =
    getDeadlineInformation(
      bid.bid_deadline,
    );

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <strong className="text-base font-black text-blue-700">
            {rfqNumber}
          </strong>

          <h2 className="text-base font-black text-slate-950">
            {bid.project_name}
          </h2>

          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${deadline.className}`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${deadline.dotClassName}`}
            />

            {deadline.label}
          </span>
        </div>

        <Link
          href={`/workspace/partner/bids/${bid.id}`}
          className="inline-flex h-8 items-center justify-center gap-1 rounded-lg bg-blue-600 px-3 text-xs font-black text-white transition hover:bg-blue-700"
        >
          상세보기
          <ChevronRight size={13} />
        </Link>
      </div>

      <div className="grid divide-y divide-slate-200 lg:grid-cols-5 lg:divide-x lg:divide-y-0">
        <SelectedInfoItem
          icon={Building2}
          label="고객사"
          value={
            bid.customer_company_name
          }
        />

        <SelectedInfoItem
          icon={ShieldCheck}
          label="참여 가능 Tier"
          value={getTierLabel(
            bid.minimum_partner_tier,
          )}
        />

        <SelectedInfoItem
          icon={CalendarClock}
          label="입찰 마감일"
          value={formatDate(
            bid.bid_deadline,
          )}
          subValue={
            deadline.shortLabel
          }
        />

        <SelectedInfoItem
          icon={Clock3}
          label="납품 요청일"
          value={formatDate(
            bid.due_date,
          )}
        />

        <SelectedInfoItem
          icon={FolderKanban}
          label="BOM 품목"
          value={`${bid.bom_count.toLocaleString(
            "ko-KR",
          )}개`}
        />
      </div>

      <div className="grid gap-0 border-t border-slate-200 lg:grid-cols-[1fr_1fr_260px]">
        <div className="border-b border-slate-200 p-4 lg:border-b-0 lg:border-r">
          <p className="text-xs font-bold text-slate-500">
            요청 설명
          </p>

          <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-xs leading-5 text-slate-700">
            {bid.description ||
              "등록된 요청 설명이 없습니다."}
          </p>
        </div>

        <div className="border-b border-slate-200 p-4 lg:border-b-0 lg:border-r">
          <p className="text-xs font-bold text-slate-500">
            고객 메모
          </p>

          <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-xs leading-5 text-slate-700">
            {bid.memo ||
              "등록된 고객 메모가 없습니다."}
          </p>
        </div>

        <div className="p-4">
          <p className="text-xs font-bold text-slate-500">
            입찰 검토
          </p>

          <p className="mt-2 text-xs font-black text-slate-900">
            RFQ 상세정보와 BOM을
            확인해 주세요.
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            도면 및 첨부문서는 상세
            화면에서 확인할 수 있습니다.
          </p>

          <Link
            href={`/workspace/partner/bids/${bid.id}`}
            className="mt-3 inline-flex h-8 w-full items-center justify-center gap-1 rounded-lg border border-blue-200 bg-blue-50 text-xs font-black text-blue-700 transition hover:bg-blue-100"
          >
            RFQ 검토하기
            <ChevronRight size={13} />
          </Link>
        </div>
      </div>
    </section>
  );
}

type SelectedInfoItemProps = {
  icon: React.ElementType;
  label: string;
  value: string;
  subValue?: string;
};

function SelectedInfoItem({
  icon: Icon,
  label,
  value,
  subValue,
}: SelectedInfoItemProps) {
  return (
    <div className="flex items-center gap-3 px-5 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
        <Icon size={15} />
      </div>

      <div className="min-w-0">
        <p className="text-[11px] font-bold text-slate-500">
          {label}
        </p>

        <div className="mt-1 flex flex-wrap items-center gap-2">
          <p className="text-xs font-black text-slate-900">
            {value}
          </p>

          {subValue && (
            <span className="text-[11px] font-black text-red-600">
              {subValue}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-[390px] items-center justify-center px-6 py-12">
      <div className="text-center">
        <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

        <p className="mt-4 text-sm font-bold text-slate-700">
          공개 RFQ를 불러오는 중입니다.
        </p>
      </div>
    </div>
  );
}

type ErrorStateProps = {
  message: string;
  onReload: () => void;
};

function ErrorState({
  message,
  onReload,
}: ErrorStateProps) {
  return (
    <div className="flex min-h-[390px] items-center justify-center px-6 py-12">
      <div className="max-w-md text-center">
        <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5">
          <p className="text-sm font-extrabold text-red-800">
            입찰목록 조회 실패
          </p>

          <p className="mt-2 text-sm leading-6 text-red-700">
            {message}
          </p>
        </div>

        <button
          type="button"
          onClick={onReload}
          className="mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-slate-900 px-5 text-sm font-bold text-white transition hover:bg-slate-800"
        >
          다시 조회
        </button>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-[390px] items-center justify-center px-6 py-12">
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-lg font-black text-slate-500">
          0
        </div>

        <p className="mt-4 text-base font-extrabold text-slate-800">
          조회된 RFQ가 없습니다.
        </p>

        <p className="mt-2 text-sm text-slate-500">
          검색어나 필터 조건을 변경해
          주세요.
        </p>
      </div>
    </div>
  );
}

type TableHeaderProps = {
  children: React.ReactNode;
  align?: "left" | "center" | "right";
};

function TableHeader({
  children,
  align = "left",
}: TableHeaderProps) {
  const alignClass =
    align === "center"
      ? "text-center"
      : align === "right"
        ? "text-right"
        : "text-left";

  return (
    <th
      className={`whitespace-nowrap px-4 py-3 text-xs font-black text-slate-600 ${alignClass}`}
    >
      {children}
    </th>
  );
}

type TableCellProps = {
  children: React.ReactNode;
  align?: "left" | "center" | "right";
};

function TableCell({
  children,
  align = "left",
}: TableCellProps) {
  const alignClass =
    align === "center"
      ? "text-center"
      : align === "right"
        ? "text-right"
        : "text-left";

  return (
    <td
      className={`whitespace-nowrap px-4 py-3 align-middle text-xs ${alignClass}`}
    >
      {children}
    </td>
  );
}