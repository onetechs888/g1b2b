"use client";

import Link from "next/link";
import {
  useEffect,
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

  const [
    selectedBidId,
    setSelectedBidId,
  ] = useState<string | null>(null);

  useEffect(() => {
    if (bids.length === 0) {
      setSelectedBidId(null);
      return;
    }

    const selectedBidExists =
      bids.some(
        (bid) => bid.id === selectedBidId,
      );

    if (!selectedBidExists) {
      setSelectedBidId(bids[0].id);
    }
  }, [bids, selectedBidId]);

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

  const selectedBid = useMemo(() => {
    if (!selectedBidId) {
      return filteredBids[0] ?? null;
    }

    return (
      bids.find(
        (bid) =>
          bid.id === selectedBidId,
      ) ??
      filteredBids[0] ??
      null
    );
  }, [
    bids,
    filteredBids,
    selectedBidId,
  ]);

  const selectedBidIndex =
    selectedBid
      ? bids.findIndex(
          (bid) =>
            bid.id === selectedBid.id,
        )
      : -1;

  const tierDistribution =
    useMemo(() => {
      const distribution =
        new Map<string, number>();

      bids.forEach((bid) => {
        const tier = getTierLabel(
          bid.minimum_partner_tier,
        );

        distribution.set(
          tier,
          (distribution.get(tier) ?? 0) +
            1,
        );
      });

      return Array.from(
        distribution.entries(),
      )
        .map(([tier, count]) => ({
          tier,
          count,
        }))
        .sort((first, second) =>
          first.tier.localeCompare(
            second.tier,
          ),
        );
    }, [bids]);

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
      <div className="min-h-full bg-[#f7f9fc]">
        <div className="mx-auto w-full max-w-[1700px] px-5 py-5 lg:px-7">
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
              icon="참"
              title="전체 입찰"
              value={summary.totalCount}
              description="현재 조회된 공개 RFQ"
            />

            <StatusSummaryCard
              tone="green"
              icon="가"
              title="참여 가능"
              value={summary.availableCount}
              description="마감까지 8일 이상 남은 입찰"
            />

            <StatusSummaryCard
              tone="orange"
              icon="임"
              title="마감 임박"
              value={summary.urgentCount}
              description="7일 이내 마감되는 입찰"
            />

            <StatusSummaryCard
              tone="red"
              icon="마"
              title="입찰 마감"
              value={summary.closedCount}
              description={`전체 BOM ${summary.totalBomCount.toLocaleString(
                "ko-KR",
              )}개 품목`}
            />
          </section>

          <section className="mt-4 grid gap-4 2xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="min-w-0 space-y-4">
              <BidListPanel
                bids={bids}
                filteredBids={filteredBids}
                isLoading={isLoading}
                error={error}
                selectedBidId={
                  selectedBid?.id ?? null
                }
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
                onSelectBid={
                  setSelectedBidId
                }
                onReload={reload}
              />

              <SelectedBidPanel
                bid={selectedBid}
                rfqNumber={
                  selectedBid
                    ? getRfqNumber(
                        selectedBid.id,
                        selectedBidIndex,
                      )
                    : null
                }
              />
            </div>

            <aside className="space-y-4">
              <BidStatusPanel
                totalCount={
                  summary.totalCount
                }
                availableCount={
                  summary.availableCount
                }
                urgentCount={
                  summary.urgentCount
                }
                closedCount={
                  summary.closedCount
                }
              />

              <TierStatusPanel
                data={tierDistribution}
                totalCount={
                  summary.totalCount
                }
              />

              <SelectedSummaryPanel
                bid={selectedBid}
                rfqNumber={
                  selectedBid
                    ? getRfqNumber(
                        selectedBid.id,
                        selectedBidIndex,
                      )
                    : null
                }
              />

              <QuickLinksPanel />
            </aside>
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
        <p className="text-xs font-semibold text-blue-700">
          입찰관리 / 입찰목록
        </p>

        <h1 className="mt-1 text-[26px] font-extrabold tracking-tight text-slate-950">
          입찰목록
        </h1>

        <p className="mt-1 text-sm text-slate-600">
          참여 가능한 RFQ와 입찰 마감
          현황을 확인할 수 있습니다.
        </p>
      </div>

      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
        <div className="relative">
          <input
            type="search"
            value={searchKeyword}
            onChange={(event) =>
              onSearchKeywordChange(
                event.target.value,
              )
            }
            placeholder="프로젝트명, 고객사 검색"
            className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-4 pr-11 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-[310px]"
          />

          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-lg text-slate-800">
            ⌕
          </span>
        </div>

        <button
          type="button"
          onClick={onReload}
          disabled={isLoading}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span
            className={
              isLoading
                ? "animate-spin"
                : ""
            }
          >
            ↻
          </span>

          새로고침
        </button>
      </div>

      <div className="hidden w-full text-right lg:absolute lg:right-7 lg:top-[76px] lg:block lg:w-auto">
        <p className="text-xs text-slate-500">
          마지막 업데이트{" "}
          <span className="font-medium text-slate-700">
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
    | "green"
    | "orange"
    | "red";
  icon: string;
  title: string;
  value: number;
  description: string;
};

function StatusSummaryCard({
  tone,
  icon,
  title,
  value,
  description,
}: StatusSummaryCardProps) {
  const styles = {
    blue: {
      icon: "bg-blue-600 text-white shadow-blue-200",
      glow: "bg-blue-100",
    },
    green: {
      icon: "bg-emerald-500 text-white shadow-emerald-200",
      glow: "bg-emerald-100",
    },
    orange: {
      icon: "bg-orange-500 text-white shadow-orange-200",
      glow: "bg-orange-100",
    },
    red: {
      icon: "bg-red-500 text-white shadow-red-200",
      glow: "bg-red-100",
    },
  }[tone];

  return (
    <article className="relative overflow-hidden rounded-xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
      <div
        className={`absolute -right-7 -top-7 h-24 w-24 rounded-full opacity-60 ${styles.glow}`}
      />

      <div className="relative flex items-center gap-4">
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-black shadow-lg ${styles.icon}`}
        >
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-800">
            {title}
          </p>

          <div className="mt-1 flex items-end gap-1.5">
            <strong className="text-[30px] font-black leading-none tracking-tight text-slate-950">
              {value.toLocaleString(
                "ko-KR",
              )}
            </strong>

            <span className="pb-0.5 text-sm font-bold text-slate-600">
              건
            </span>
          </div>

          <p className="mt-2 truncate text-xs text-slate-500">
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
  selectedBidId: string | null;
  deadlineFilter: DeadlineFilter;
  tierFilter: TierFilter;
  tierOptions: string[];
  onDeadlineFilterChange: (
    value: DeadlineFilter,
  ) => void;
  onTierFilterChange: (
    value: TierFilter,
  ) => void;
  onSelectBid: (id: string) => void;
  onReload: () => void;
};

function BidListPanel({
  bids,
  filteredBids,
  isLoading,
  error,
  selectedBidId,
  deadlineFilter,
  tierFilter,
  tierOptions,
  onDeadlineFilterChange,
  onTierFilterChange,
  onSelectBid,
  onReload,
}: BidListPanelProps) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-slate-950">
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
          <select
            value={deadlineFilter}
            onChange={(event) =>
              onDeadlineFilterChange(
                event.target
                  .value as DeadlineFilter,
              )
            }
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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

          <select
            value={tierFilter}
            onChange={(event) =>
              onTierFilterChange(
                event.target.value,
              )
            }
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] border-collapse">
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

                      const isSelected =
                        selectedBidId ===
                        bid.id;

                      return (
                        <tr
                          key={bid.id}
                          onClick={() =>
                            onSelectBid(
                              bid.id,
                            )
                          }
                          className={`cursor-pointer border-b border-slate-100 transition last:border-b-0 ${
                            isSelected
                              ? "bg-blue-50/80"
                              : "hover:bg-slate-50"
                          }`}
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
                              <p className="truncate text-sm font-bold text-slate-900">
                                {
                                  bid.project_name
                                }
                              </p>

                              <p className="mt-0.5 text-xs text-slate-400">
                                BOM{" "}
                                {bid.bom_count.toLocaleString(
                                  "ko-KR",
                                )}
                                개
                              </p>
                            </div>
                          </TableCell>

                          <TableCell>
                            <span className="text-sm font-semibold text-slate-700">
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
                            <span className="text-sm font-medium text-slate-700">
                              {formatDate(
                                bid.bid_deadline,
                              )}
                            </span>
                          </TableCell>

                          <TableCell>
                            <span className="text-sm font-medium text-slate-700">
                              {formatDate(
                                bid.due_date,
                              )}
                            </span>
                          </TableCell>

                          <TableCell align="center">
                            <span
                              className={`text-sm font-black ${
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
                              className="inline-flex h-8 items-center justify-center whitespace-nowrap rounded-md border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                            >
                              상세보기
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
          <strong className="text-xl font-black text-blue-700">
            {rfqNumber}
          </strong>

          <h2 className="text-xl font-extrabold text-slate-950">
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
          className="inline-flex h-9 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-bold text-white transition hover:bg-blue-700"
        >
          상세보기
        </Link>
      </div>

      <div className="grid divide-y divide-slate-200 lg:grid-cols-5 lg:divide-x lg:divide-y-0">
        <SelectedInfoItem
          label="고객사"
          value={
            bid.customer_company_name
          }
        />

        <SelectedInfoItem
          label="참여 가능 Tier"
          value={getTierLabel(
            bid.minimum_partner_tier,
          )}
        />

        <SelectedInfoItem
          label="입찰 마감일"
          value={formatDate(
            bid.bid_deadline,
          )}
          subValue={
            deadline.shortLabel
          }
        />

        <SelectedInfoItem
          label="납품 요청일"
          value={formatDate(
            bid.due_date,
          )}
        />

        <SelectedInfoItem
          label="BOM 품목"
          value={`${bid.bom_count.toLocaleString(
            "ko-KR",
          )}개`}
        />
      </div>

      <div className="grid gap-0 border-t border-slate-200 lg:grid-cols-[1fr_1fr_300px]">
        <div className="border-b border-slate-200 p-5 lg:border-b-0 lg:border-r">
          <p className="text-xs font-bold text-slate-500">
            요청 설명
          </p>

          <p className="mt-3 line-clamp-4 whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {bid.description ||
              "등록된 요청 설명이 없습니다."}
          </p>
        </div>

        <div className="border-b border-slate-200 p-5 lg:border-b-0 lg:border-r">
          <p className="text-xs font-bold text-slate-500">
            고객 메모
          </p>

          <p className="mt-3 line-clamp-4 whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {bid.memo ||
              "등록된 고객 메모가 없습니다."}
          </p>
        </div>

        <div className="p-5">
          <p className="text-xs font-bold text-slate-500">
            입찰 검토
          </p>

          <p className="mt-3 text-sm font-bold text-slate-900">
            RFQ 상세정보와 BOM을
            확인해 주세요.
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            도면 및 첨부문서는 상세
            화면에서 확인할 수 있습니다.
          </p>

          <Link
            href={`/workspace/partner/bids/${bid.id}`}
            className="mt-4 inline-flex h-9 w-full items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
          >
            RFQ 검토하기 →
          </Link>
        </div>
      </div>
    </section>
  );
}

type SelectedInfoItemProps = {
  label: string;
  value: string;
  subValue?: string;
};

function SelectedInfoItem({
  label,
  value,
  subValue,
}: SelectedInfoItemProps) {
  return (
    <div className="px-5 py-4">
      <p className="text-xs font-bold text-slate-500">
        {label}
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <p className="text-sm font-extrabold text-slate-900">
          {value}
        </p>

        {subValue && (
          <span className="text-xs font-black text-red-600">
            {subValue}
          </span>
        )}
      </div>
    </div>
  );
}

type BidStatusPanelProps = {
  totalCount: number;
  availableCount: number;
  urgentCount: number;
  closedCount: number;
};

function BidStatusPanel({
  totalCount,
  availableCount,
  urgentCount,
  closedCount,
}: BidStatusPanelProps) {
  const unknownCount = Math.max(
    totalCount -
      availableCount -
      urgentCount -
      closedCount,
    0,
  );

  const items = [
    {
      label: "참여 가능",
      value: availableCount,
      dotClassName: "bg-emerald-500",
    },
    {
      label: "마감 임박",
      value: urgentCount,
      dotClassName: "bg-amber-500",
    },
    {
      label: "입찰 마감",
      value: closedCount,
      dotClassName: "bg-red-500",
    },
    {
      label: "마감일 미정",
      value: unknownCount,
      dotClassName: "bg-slate-400",
    },
  ];

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-extrabold text-slate-950">
        입찰 현황
      </h2>

      <div className="mt-5 flex items-center gap-5">
        <div className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-[conic-gradient(#10b981_0_35%,#f59e0b_35%_60%,#ef4444_60%_85%,#94a3b8_85%_100%)]">
          <div className="flex h-[72px] w-[72px] flex-col items-center justify-center rounded-full bg-white">
            <strong className="text-2xl font-black text-slate-950">
              {totalCount}
            </strong>

            <span className="text-[11px] font-semibold text-slate-500">
              전체
            </span>
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          {items.map((item) => {
            const percentage =
              totalCount > 0
                ? Math.round(
                    (item.value /
                      totalCount) *
                      100,
                  )
                : 0;

            return (
              <div
                key={item.label}
                className="flex items-center justify-between gap-3"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${item.dotClassName}`}
                  />

                  <span className="truncate text-xs font-semibold text-slate-700">
                    {item.label}
                  </span>
                </div>

                <span className="whitespace-nowrap text-xs font-bold text-slate-800">
                  {item.value}건 (
                  {percentage}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

type TierStatusPanelProps = {
  data: {
    tier: string;
    count: number;
  }[];
  totalCount: number;
};

function TierStatusPanel({
  data,
  totalCount,
}: TierStatusPanelProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-extrabold text-slate-950">
        Tier 현황
      </h2>

      <div className="mt-5 space-y-4">
        {data.length === 0 ? (
          <p className="py-5 text-center text-xs text-slate-500">
            등록된 Tier 정보가 없습니다.
          </p>
        ) : (
          data.map((item, index) => {
            const percentage =
              totalCount > 0
                ? Math.round(
                    (item.count /
                      totalCount) *
                      100,
                  )
                : 0;

            const barClassNames = [
              "bg-violet-500",
              "bg-purple-500",
              "bg-blue-500",
              "bg-emerald-500",
              "bg-orange-500",
              "bg-slate-500",
            ];

            return (
              <div
                key={item.tier}
                className="grid grid-cols-[76px_1fr_48px] items-center gap-3"
              >
                <span className="text-xs font-bold text-slate-700">
                  {item.tier}
                </span>

                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${
                      barClassNames[
                        index %
                          barClassNames.length
                      ]
                    }`}
                    style={{
                      width: `${Math.max(
                        percentage,
                        4,
                      )}%`,
                    }}
                  />
                </div>

                <span className="text-right text-xs font-bold text-slate-600">
                  {item.count}건
                </span>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

type SelectedSummaryPanelProps = {
  bid: PartnerOpenBiddingRequest | null;
  rfqNumber: string | null;
};

function SelectedSummaryPanel({
  bid,
  rfqNumber,
}: SelectedSummaryPanelProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-extrabold text-slate-950">
        선택 RFQ
      </h2>

      {!bid || !rfqNumber ? (
        <p className="py-6 text-center text-xs text-slate-500">
          목록에서 RFQ를 선택해 주세요.
        </p>
      ) : (
        <div className="mt-4">
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
            <p className="text-sm font-black text-blue-700">
              {rfqNumber}
            </p>

            <p className="mt-1 truncate text-base font-extrabold text-slate-950">
              {bid.project_name}
            </p>

            <p className="mt-1 text-xs font-medium text-slate-600">
              {bid.customer_company_name}
            </p>
          </div>

          <div className="mt-4 space-y-3">
            <SummaryLine
              label="입찰 마감"
              value={formatDate(
                bid.bid_deadline,
              )}
            />

            <SummaryLine
              label="납품 요청"
              value={formatDate(
                bid.due_date,
              )}
            />

            <SummaryLine
              label="참여 Tier"
              value={getTierLabel(
                bid.minimum_partner_tier,
              )}
            />

            <SummaryLine
              label="BOM"
              value={`${bid.bom_count.toLocaleString(
                "ko-KR",
              )}개`}
            />
          </div>
        </div>
      )}
    </section>
  );
}

type SummaryLineProps = {
  label: string;
  value: string;
};

function SummaryLine({
  label,
  value,
}: SummaryLineProps) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
      <span className="text-xs font-medium text-slate-500">
        {label}
      </span>

      <span className="text-right text-xs font-bold text-slate-800">
        {value}
      </span>
    </div>
  );
}

function QuickLinksPanel() {
  const quickLinks = [
    {
      label: "견적목록",
      href: "/workspace/partner/quotes",
      icon: "견",
    },
    {
      label: "프로젝트",
      href: "/workspace/partner",
      icon: "P",
    },
    {
      label: "생산관리",
      href: "/workspace/partner/production",
      icon: "생",
    },
    {
      label: "품질관리",
      href: "/workspace/partner/quality",
      icon: "품",
    },
    {
      label: "출하관리",
      href: "/workspace/partner/shipping",
      icon: "출",
    },
    {
      label: "문서관리",
      href: "/workspace/partner/documents",
      icon: "문",
    },
  ];

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-extrabold text-slate-950">
        바로가기
      </h2>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {quickLinks.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex min-h-[82px] flex-col items-center justify-center rounded-lg border border-slate-100 bg-slate-50 px-2 py-3 text-center transition hover:border-blue-200 hover:bg-blue-50"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-xs font-black text-blue-700 shadow-sm">
              {item.icon}
            </span>

            <span className="mt-2 text-[11px] font-bold text-slate-700">
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
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
      className={`whitespace-nowrap px-4 py-3 text-xs font-extrabold text-slate-600 ${alignClass}`}
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
      className={`whitespace-nowrap px-4 py-3.5 align-middle ${alignClass}`}
    >
      {children}
    </td>
  );
}