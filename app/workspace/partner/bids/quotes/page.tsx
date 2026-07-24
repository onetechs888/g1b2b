"use client";

import Link from "next/link";
import {
  useMemo,
  useState,
} from "react";

import WorkspaceLayout from "@/components/workspace/WorkspaceLayout";
import { usePartnerQuotes } from "@/hooks/partner/usePartnerQuotes";
import type {
  PartnerQuoteListItem,
  PartnerQuoteStatus,
} from "@/services/partner/biddingService";

type QuoteStatus = PartnerQuoteStatus;

type QuoteStatusFilter =
  | "all"
  | QuoteStatus;

type QuoteStatusInformation = {
  label: string;
  description: string;
  className: string;
  dotClassName: string;
};

function getShortCode(
  prefix: "QT" | "RFQ",
  value: string,
): string {
  const compactValue = value
    .replaceAll("-", "")
    .slice(0, 8)
    .toUpperCase();

  return `${prefix}-${compactValue}`;
}

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

function formatCurrency(value: number | null) {
  if (value === null) {
    return "-";
  }

  return `${value.toLocaleString("ko-KR")}원`;
}

function getQuoteStatusInformation(
  status: QuoteStatus,
): QuoteStatusInformation {
  switch (status) {
    case "draft":
      return {
        label: "임시저장",
        description: "아직 제출하지 않은 견적입니다.",
        className:
          "border-slate-200 bg-slate-50 text-slate-700",
        dotClassName: "bg-slate-400",
      };

    case "submitted":
      return {
        label: "제출완료",
        description: "고객사에 견적 제출이 완료되었습니다.",
        className:
          "border-blue-200 bg-blue-50 text-blue-700",
        dotClassName: "bg-blue-500",
      };

    case "waiting":
      return {
        label: "선정대기",
        description: "고객사의 최종 선정 결과를 기다리고 있습니다.",
        className:
          "border-amber-200 bg-amber-50 text-amber-700",
        dotClassName: "bg-amber-500",
      };

    case "awarded":
      return {
        label: "수주",
        description: "파트너사로 최종 선정되었습니다.",
        className:
          "border-emerald-200 bg-emerald-50 text-emerald-700",
        dotClassName: "bg-emerald-500",
      };

    case "rejected":
      return {
        label: "미선정",
        description: "최종 파트너 선정 대상에서 제외되었습니다.",
        className:
          "border-red-200 bg-red-50 text-red-700",
        dotClassName: "bg-red-500",
      };
  }
}

function getQuoteAction(
  quote: PartnerQuoteListItem,
) {
  switch (quote.status) {
    case "draft":
      return {
        label: "이어 작성",
        href: `/workspace/partner/bids/${quote.bidding_request_id}`,
        disabled: false,
        primary: true,
      };

    case "submitted":
      return {
        label: "제출내역 보기",
        href: `/workspace/partner/bids/${quote.bidding_request_id}`,
        disabled: false,
        primary: false,
      };

    case "waiting":
      return {
        label: "결과 대기",
        href: "#",
        disabled: true,
        primary: false,
      };

    case "awarded":
      return {
        label: "프로젝트 이동",
        href: "/workspace/partner/projects",
        disabled: false,
        primary: true,
      };

    case "rejected":
      return {
        label: "결과 보기",
        href: `/workspace/partner/bids/${quote.bidding_request_id}`,
        disabled: false,
        primary: false,
      };
  }
}

export default function PartnerQuotesPage() {
  const {
    quotes,
    isLoading,
    error,
    reload,
  } = usePartnerQuotes();

  const [
    searchKeyword,
    setSearchKeyword,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState<QuoteStatusFilter>("all");

  const [
    selectedQuoteId,
    setSelectedQuoteId,
  ] = useState<string | null>(null);

  const filteredQuotes = useMemo(() => {
    const normalizedKeyword =
      searchKeyword.trim().toLowerCase();

    return quotes.filter((quote) => {
      const searchableText = [
        quote.id,
        quote.bidding_request_id,
        quote.project_name,
        quote.customer_company_name,
      ]
        .join(" ")
        .toLowerCase();

      const matchesKeyword =
        normalizedKeyword.length === 0 ||
        searchableText.includes(
          normalizedKeyword,
        );

      if (!matchesKeyword) {
        return false;
      }

      return (
        statusFilter === "all" ||
        quote.status === statusFilter
      );
    });
  }, [quotes, searchKeyword, statusFilter]);

  const summary = useMemo(() => {
    const countByStatus = (
      status: QuoteStatus,
    ) =>
      quotes.filter(
        (quote) => quote.status === status,
      ).length;

    return {
      total: quotes.length,
      draft: countByStatus("draft"),
      submitted: countByStatus("submitted"),
      waiting: countByStatus("waiting"),
      awarded: countByStatus("awarded"),
      rejected: countByStatus("rejected"),
    };
  }, [quotes]);

  const selectedQuote = useMemo(() => {
    if (filteredQuotes.length === 0) {
      return null;
    }

    if (!selectedQuoteId) {
      return filteredQuotes[0];
    }

    return (
      filteredQuotes.find(
        (quote) =>
          quote.id === selectedQuoteId,
      ) ?? filteredQuotes[0]
    );
  }, [filteredQuotes, selectedQuoteId]);

  const recentResults = useMemo(() => {
    return [...quotes]
      .filter(
        (quote) =>
          quote.status === "awarded" ||
          quote.status === "rejected",
      )
      .sort((first, second) => {
        const firstTime =
          first.updated_at
            ? new Date(
                first.updated_at,
              ).getTime()
            : 0;

        const secondTime =
          second.updated_at
            ? new Date(
                second.updated_at,
              ).getTime()
            : 0;

        return secondTime - firstTime;
      })
      .slice(0, 5);
  }, [quotes]);

  const lastUpdatedAt = useMemo(() => {
    const timestamps = quotes
      .map((quote) => {
        const value =
          quote.updated_at ??
          quote.submitted_at;

        if (!value) {
          return 0;
        }

        const timestamp =
          new Date(value).getTime();

        return Number.isNaN(timestamp)
          ? 0
          : timestamp;
      })
      .filter((timestamp) => timestamp > 0);

    if (timestamps.length === 0) {
      return null;
    }

    return new Date(
      Math.max(...timestamps),
    ).toISOString();
  }, [quotes]);

  if (isLoading) {
    return (
      <WorkspaceLayout role="partner">
        <div className="flex min-h-[420px] items-center justify-center bg-[#f7f9fc] px-6">
          <p className="text-sm font-semibold text-slate-600">
            견적목록을 불러오는 중입니다.
          </p>
        </div>
      </WorkspaceLayout>
    );
  }

  if (error) {
    return (
      <WorkspaceLayout role="partner">
        <div className="flex min-h-[420px] items-center justify-center bg-[#f7f9fc] px-6">
          <div className="max-w-md rounded-xl border border-red-200 bg-white p-6 text-center shadow-sm">
            <p className="text-base font-extrabold text-red-700">
              견적목록을 불러오지 못했습니다.
            </p>
            <p className="mt-2 text-sm text-slate-600">
              {error}
            </p>
            <button
              type="button"
              onClick={() => void reload()}
              className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-5 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              다시 불러오기
            </button>
          </div>
        </div>
      </WorkspaceLayout>
    );
  }

  return (
    <WorkspaceLayout role="partner">
      <div className="min-h-full bg-[#f7f9fc]">
        <div className="mx-auto w-full max-w-[1700px] px-5 py-5 lg:px-7">
          <PageHeader
            searchKeyword={searchKeyword}
            onSearchKeywordChange={
              setSearchKeyword
            }
            lastUpdatedAt={lastUpdatedAt}
          />

          <section className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            <StatusSummaryCard
              tone="slate"
              title="전체 견적"
              value={summary.total}
              description="제출 견적 전체"
            />

            <StatusSummaryCard
              tone="gray"
              title="임시저장"
              value={summary.draft}
              description="작성 중인 견적"
            />

            <StatusSummaryCard
              tone="blue"
              title="제출완료"
              value={summary.submitted}
              description="고객사 제출 완료"
            />

            <StatusSummaryCard
              tone="orange"
              title="선정대기"
              value={summary.waiting}
              description="최종 결과 대기"
            />

            <StatusSummaryCard
              tone="green"
              title="수주"
              value={summary.awarded}
              description="최종 선정 견적"
            />

            <StatusSummaryCard
              tone="red"
              title="미선정"
              value={summary.rejected}
              description="선정 제외 견적"
            />
          </section>

          <section className="mt-4 grid gap-4 2xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="min-w-0 space-y-4">
              <QuoteListPanel
                quotes={quotes}
                filteredQuotes={filteredQuotes}
                selectedQuoteId={
                  selectedQuote?.id ?? null
                }
                statusFilter={statusFilter}
                onStatusFilterChange={
                  setStatusFilter
                }
                onSelectQuote={
                  setSelectedQuoteId
                }
              />

              <SelectedQuotePanel
                quote={selectedQuote}
              />
            </div>

            <aside className="space-y-4">
              <QuoteStatusPanel
                summary={summary}
              />

              <RecentResultPanel
                quotes={recentResults}
              />

              <SelectedQuoteSummaryPanel
                quote={selectedQuote}
              />

              <QuoteActionGuidePanel />
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
  lastUpdatedAt: string | null;
};

function PageHeader({
  searchKeyword,
  onSearchKeywordChange,
  lastUpdatedAt,
}: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <p className="text-xs font-semibold text-blue-700">
          입찰관리 / 견적목록
        </p>

        <h1 className="mt-1 text-[26px] font-extrabold tracking-tight text-slate-950">
          견적목록
        </h1>

        <p className="mt-1 text-sm text-slate-600">
          제출한 견적의 진행
          상태와 선정 결과를 확인합니다.
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
            placeholder="견적번호, RFQ, 프로젝트명, 고객사 검색"
            className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-4 pr-11 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-[360px]"
          />

          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-lg text-slate-800">
            ⌕
          </span>
        </div>
      </div>

      <div className="hidden w-full text-right lg:absolute lg:right-7 lg:top-[76px] lg:block lg:w-auto">
        <p className="text-xs text-slate-500">
          마지막 상태 변경{" "}
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

type StatusSummaryTone =
  | "slate"
  | "gray"
  | "blue"
  | "orange"
  | "green"
  | "red";

type StatusSummaryCardProps = {
  tone: StatusSummaryTone;
  title: string;
  value: number;
  description: string;
};

function StatusSummaryCard({
  tone,
  title,
  value,
  description,
}: StatusSummaryCardProps) {
  const styles = {
    slate: {
      icon: "bg-slate-900 text-white",
      glow: "bg-slate-100",
      symbol: "전",
    },
    gray: {
      icon: "bg-slate-500 text-white",
      glow: "bg-slate-100",
      symbol: "임",
    },
    blue: {
      icon: "bg-blue-600 text-white",
      glow: "bg-blue-100",
      symbol: "제",
    },
    orange: {
      icon: "bg-orange-500 text-white",
      glow: "bg-orange-100",
      symbol: "대",
    },
    green: {
      icon: "bg-emerald-500 text-white",
      glow: "bg-emerald-100",
      symbol: "수",
    },
    red: {
      icon: "bg-red-500 text-white",
      glow: "bg-red-100",
      symbol: "미",
    },
  }[tone];

  return (
    <article className="relative overflow-hidden rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <div
        className={`absolute -right-7 -top-7 h-20 w-20 rounded-full opacity-60 ${styles.glow}`}
      />

      <div className="relative flex items-center gap-3">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-black shadow-md ${styles.icon}`}
        >
          {styles.symbol}
        </div>

        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-800">
            {title}
          </p>

          <div className="mt-1 flex items-end gap-1">
            <strong className="text-[27px] font-black leading-none tracking-tight text-slate-950">
              {value.toLocaleString(
                "ko-KR",
              )}
            </strong>

            <span className="pb-0.5 text-xs font-bold text-slate-600">
              건
            </span>
          </div>

          <p className="mt-1.5 truncate text-[11px] text-slate-500">
            {description}
          </p>
        </div>
      </div>
    </article>
  );
}

type QuoteListPanelProps = {
  quotes: PartnerQuoteListItem[];
  filteredQuotes: PartnerQuoteListItem[];
  selectedQuoteId: string | null;
  statusFilter: QuoteStatusFilter;
  onStatusFilterChange: (
    value: QuoteStatusFilter,
  ) => void;
  onSelectQuote: (id: string) => void;
};

function QuoteListPanel({
  quotes: allQuotes,
  filteredQuotes,
  selectedQuoteId,
  statusFilter,
  onStatusFilterChange,
  onSelectQuote,
}: QuoteListPanelProps) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-slate-950">
            제출 견적 현황
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            총{" "}
            <span className="font-bold text-slate-800">
              {filteredQuotes.length}
            </span>
            건 / 전체 {allQuotes.length}건
          </p>
        </div>

        <select
          value={statusFilter}
          onChange={(event) =>
            onStatusFilterChange(
              event.target
                .value as QuoteStatusFilter,
            )
          }
          className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        >
          <option value="all">
            전체 상태
          </option>
          <option value="draft">
            임시저장
          </option>
          <option value="submitted">
            제출완료
          </option>
          <option value="waiting">
            선정대기
          </option>
          <option value="awarded">
            수주
          </option>
          <option value="rejected">
            미선정
          </option>
        </select>
      </div>

      {filteredQuotes.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1250px] border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-[#f7f9fc]">
                  <TableHeader>
                    견적번호
                  </TableHeader>

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
                    BOM
                  </TableHeader>

                  <TableHeader align="right">
                    총 견적금액
                  </TableHeader>

                  <TableHeader>
                    제출일
                  </TableHeader>

                  <TableHeader>
                    납품 제안일
                  </TableHeader>

                  <TableHeader align="center">
                    현재 상태
                  </TableHeader>

                  <TableHeader>
                    최근 변경
                  </TableHeader>

                  <TableHeader align="right">
                    작업
                  </TableHeader>
                </tr>
              </thead>

              <tbody>
                {filteredQuotes.map(
                  (quote) => {
                    const status =
                      getQuoteStatusInformation(
                        quote.status,
                      );

                    const action =
                      getQuoteAction(quote);

                    const isSelected =
                      selectedQuoteId ===
                      quote.id;

                    return (
                      <tr
                        key={quote.id}
                        onClick={() =>
                          onSelectQuote(
                            quote.id,
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
                            {getShortCode("QT", quote.id)}
                          </span>
                        </TableCell>

                        <TableCell>
                          <span className="text-sm font-bold text-slate-800">
                            {getShortCode("RFQ", quote.bidding_request_id)}
                          </span>
                        </TableCell>

                        <TableCell>
                          <p className="max-w-[190px] truncate text-sm font-bold text-slate-900">
                            {
                              quote.project_name
                            }
                          </p>
                        </TableCell>

                        <TableCell>
                          <span className="text-sm font-semibold text-slate-700">
                            {
                              quote.customer_company_name
                            }
                          </span>
                        </TableCell>

                        <TableCell align="center">
                          <span className="text-sm font-bold text-slate-700">
                            {quote.bom_count.toLocaleString(
                              "ko-KR",
                            )}
                            개
                          </span>
                        </TableCell>

                        <TableCell align="right">
                          <span className="text-sm font-extrabold text-slate-900">
                            {formatCurrency(
                              quote.total_amount,
                            )}
                          </span>
                        </TableCell>

                        <TableCell>
                          <span className="text-sm font-medium text-slate-700">
                            {formatDate(
                              quote.submitted_at,
                            )}
                          </span>
                        </TableCell>

                        <TableCell>
                          <span className="text-sm font-medium text-slate-700">
                            {formatDate(
                              quote.rfq_due_date,
                            )}
                          </span>
                        </TableCell>

                        <TableCell align="center">
                          <span
                            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-bold ${status.className}`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${status.dotClassName}`}
                            />

                            {status.label}
                          </span>
                        </TableCell>

                        <TableCell>
                          <span className="text-sm font-medium text-slate-600">
                            {formatDateTime(
                              quote.updated_at,
                            )}
                          </span>
                        </TableCell>

                        <TableCell align="right">
                          {action.disabled ? (
                            <button
                              type="button"
                              disabled
                              onClick={(
                                event,
                              ) =>
                                event.stopPropagation()
                              }
                              className="inline-flex h-8 items-center justify-center whitespace-nowrap rounded-md border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-400"
                            >
                              {action.label}
                            </button>
                          ) : (
                            <Link
                              href={action.href}
                              onClick={(
                                event,
                              ) =>
                                event.stopPropagation()
                              }
                              className={`inline-flex h-8 items-center justify-center whitespace-nowrap rounded-md px-3 text-xs font-bold transition ${
                                action.primary
                                  ? "bg-blue-600 text-white hover:bg-blue-700"
                                  : "border border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                              }`}
                            >
                              {action.label}
                            </Link>
                          )}
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
              {filteredQuotes.length.toLocaleString(
                "ko-KR",
              )}
              건
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled
                className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-400"
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
                className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-400"
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

type SelectedQuotePanelProps = {
  quote: PartnerQuoteListItem | null;
};

function SelectedQuotePanel({
  quote,
}: SelectedQuotePanelProps) {
  if (!quote) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
        <p className="text-sm font-bold text-slate-700">
          선택된 견적이 없습니다.
        </p>

        <p className="mt-1 text-xs text-slate-500">
          실데이터가 연결되면 견적별 상태
          상세가 표시됩니다.
        </p>
      </section>
    );
  }

  const status =
    getQuoteStatusInformation(
      quote.status,
    );

  const action = getQuoteAction(quote);

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <strong className="text-xl font-black text-blue-700">
            {getShortCode("QT", quote.id)}
          </strong>

          <h2 className="text-xl font-extrabold text-slate-950">
            {quote.project_name}
          </h2>

          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${status.className}`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${status.dotClassName}`}
            />

            {status.label}
          </span>
        </div>

        {!action.disabled && (
          <Link
            href={action.href}
            className={`inline-flex h-9 items-center justify-center rounded-lg px-4 text-sm font-bold transition ${
              action.primary
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "border border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
            }`}
          >
            {action.label}
          </Link>
        )}
      </div>

      <div className="grid divide-y divide-slate-200 lg:grid-cols-5 lg:divide-x lg:divide-y-0">
        <SelectedInfoItem
          label="RFQ 번호"
          value={getShortCode("RFQ", quote.bidding_request_id)}
        />

        <SelectedInfoItem
          label="고객사"
          value={
            quote.customer_company_name
          }
        />

        <SelectedInfoItem
          label="BOM 품목"
          value={`${quote.bom_count.toLocaleString(
            "ko-KR",
          )}개`}
        />

        <SelectedInfoItem
          label="총 견적금액"
          value={formatCurrency(
            quote.total_amount,
          )}
        />

        <SelectedInfoItem
          label="납품 제안일"
          value={formatDate(
            quote.rfq_due_date,
          )}
        />
      </div>

      <div className="grid border-t border-slate-200 lg:grid-cols-[1fr_320px]">
        <div className="border-b border-slate-200 p-5 lg:border-b-0 lg:border-r">
          <p className="text-xs font-bold text-slate-500">
            현재 진행 상태
          </p>

          <p className="mt-3 text-base font-extrabold text-slate-900">
            {status.label}
          </p>

          <p className="mt-1 text-sm leading-6 text-slate-600">
            {status.description}
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <SummaryCard
              label="견적 제출일"
              value={formatDateTime(
                quote.submitted_at,
              )}
            />

            <SummaryCard
              label="최근 상태 변경"
              value={formatDateTime(
                quote.updated_at,
              )}
            />
          </div>
        </div>

        <div className="p-5">
          <p className="text-xs font-bold text-slate-500">
            다음 작업
          </p>

          <p className="mt-3 text-sm font-bold text-slate-900">
            {action.label}
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            현재 견적 상태에 따라 가능한
            작업만 표시됩니다.
          </p>

          {action.disabled ? (
            <button
              type="button"
              disabled
              className="mt-4 inline-flex h-9 w-full items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-sm font-bold text-slate-400"
            >
              {action.label}
            </button>
          ) : (
            <Link
              href={action.href}
              className="mt-4 inline-flex h-9 w-full items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              {action.label} →
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

type SelectedInfoItemProps = {
  label: string;
  value: string;
};

function SelectedInfoItem({
  label,
  value,
}: SelectedInfoItemProps) {
  return (
    <div className="px-5 py-4">
      <p className="text-xs font-bold text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-sm font-extrabold text-slate-900">
        {value}
      </p>
    </div>
  );
}

type SummaryCardProps = {
  label: string;
  value: string;
};

function SummaryCard({
  label,
  value,
}: SummaryCardProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-bold text-slate-800">
        {value}
      </p>
    </div>
  );
}

type QuoteSummary = {
  total: number;
  draft: number;
  submitted: number;
  waiting: number;
  awarded: number;
  rejected: number;
};

type QuoteStatusPanelProps = {
  summary: QuoteSummary;
};

function QuoteStatusPanel({
  summary,
}: QuoteStatusPanelProps) {
  const items = [
    {
      label: "임시저장",
      value: summary.draft,
      dotClassName: "bg-slate-400",
    },
    {
      label: "제출완료",
      value: summary.submitted,
      dotClassName: "bg-blue-500",
    },
    {
      label: "선정대기",
      value: summary.waiting,
      dotClassName: "bg-amber-500",
    },
    {
      label: "수주",
      value: summary.awarded,
      dotClassName: "bg-emerald-500",
    },
    {
      label: "미선정",
      value: summary.rejected,
      dotClassName: "bg-red-500",
    },
  ];

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-extrabold text-slate-950">
        견적 상태 현황
      </h2>

      <div className="mt-5 space-y-3">
        {items.map((item) => {
          const percentage =
            summary.total > 0
              ? Math.round(
                  (item.value /
                    summary.total) *
                    100,
                )
              : 0;

          return (
            <div
              key={item.label}
              className="grid grid-cols-[88px_1fr_62px] items-center gap-3"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${item.dotClassName}`}
                />

                <span className="text-xs font-semibold text-slate-700">
                  {item.label}
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={item.dotClassName}
                  style={{
                    width: `${percentage}%`,
                    height: "100%",
                  }}
                />
              </div>

              <span className="text-right text-xs font-bold text-slate-700">
                {item.value}건
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

type RecentResultPanelProps = {
  quotes: PartnerQuoteListItem[];
};

function RecentResultPanel({
  quotes: recentQuotes,
}: RecentResultPanelProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-extrabold text-slate-950">
        최근 선정 결과
      </h2>

      {recentQuotes.length === 0 ? (
        <p className="py-7 text-center text-xs text-slate-500">
          최근 확정된 선정 결과가 없습니다.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {recentQuotes.map((quote) => {
            const status =
              getQuoteStatusInformation(
                quote.status,
              );

            return (
              <Link
                key={quote.id}
                href={`/workspace/partner/quotes/${quote.id}`}
                className="block rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 transition hover:border-blue-200 hover:bg-blue-50"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-black text-blue-700">
                    {getShortCode("RFQ", quote.bidding_request_id)}
                  </span>

                  <span
                    className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${status.className}`}
                  >
                    {status.label}
                  </span>
                </div>

                <p className="mt-1 truncate text-sm font-bold text-slate-900">
                  {quote.project_name}
                </p>

                <p className="mt-1 text-[11px] text-slate-500">
                  {formatDateTime(
                    quote.updated_at,
                  )}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}

type SelectedQuoteSummaryPanelProps = {
  quote: PartnerQuoteListItem | null;
};

function SelectedQuoteSummaryPanel({
  quote,
}: SelectedQuoteSummaryPanelProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-extrabold text-slate-950">
        선택 견적
      </h2>

      {!quote ? (
        <p className="py-7 text-center text-xs text-slate-500">
          목록에서 견적을 선택해 주세요.
        </p>
      ) : (
        <div className="mt-4">
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
            <p className="text-sm font-black text-blue-700">
              {getShortCode("QT", quote.id)}
            </p>

            <p className="mt-1 truncate text-base font-extrabold text-slate-950">
              {quote.project_name}
            </p>

            <p className="mt-1 text-xs font-medium text-slate-600">
              {quote.customer_company_name}
            </p>
          </div>

          <div className="mt-4 space-y-3">
            <SummaryLine
              label="RFQ 번호"
              value={getShortCode("RFQ", quote.bidding_request_id)}
            />

            <SummaryLine
              label="현재 상태"
              value={
                getQuoteStatusInformation(
                  quote.status,
                ).label
              }
            />

            <SummaryLine
              label="총 견적금액"
              value={formatCurrency(
                quote.total_amount,
              )}
            />

            <SummaryLine
              label="납품 제안일"
              value={formatDate(
                quote.rfq_due_date,
              )}
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

function QuoteActionGuidePanel() {
  const items = [
    {
      status: "임시저장",
      action: "이어 작성",
    },
    {
      status: "제출완료",
      action: "제출내역 확인",
    },
    {
      status: "선정대기",
      action: "결과 대기",
    },
    {
      status: "수주",
      action: "프로젝트 이동",
    },
    {
      status: "미선정",
      action: "결과 확인",
    },
  ];

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-extrabold text-slate-950">
        상태별 작업
      </h2>

      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div
            key={item.status}
            className="flex items-center justify-between gap-3"
          >
            <span className="text-xs font-semibold text-slate-600">
              {item.status}
            </span>

            <span className="text-xs font-bold text-slate-900">
              {item.action}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-[390px] items-center justify-center px-6 py-12">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-lg font-black text-slate-500">
          0
        </div>

        <p className="mt-4 text-base font-extrabold text-slate-800">
          제출한 견적이 없습니다.
        </p>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          입찰목록에서 RFQ를 검토하고
          견적을 작성하면 이곳에서 현재
          상태를 확인할 수 있습니다.
        </p>

        <Link
          href="/workspace/partner/bids"
          className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-5 text-sm font-bold text-white transition hover:bg-blue-700"
        >
          입찰목록 이동
        </Link>
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