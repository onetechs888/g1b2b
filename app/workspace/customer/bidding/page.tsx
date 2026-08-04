"use client";

import Link from "next/link";
import {
  useMemo,
  useState,
} from "react";

import WorkspaceLayout from "@/components/workspace/WorkspaceLayout";
import { useSubmittedQuotes } from "@/hooks/customer/useSubmittedQuotes";

import type {
  CustomerQuoteListItem,
  CustomerQuoteStatus,
} from "@/services/customer/quoteService";

type BiddingStatus =
  | "in_progress"
  | "evaluating"
  | "completed";

type BiddingStatusFilter =
  | "all"
  | BiddingStatus;

type RfqGroup = {
  bidding_request_id: string;
  project_name: string;
  due_date: string | null;
  quotes: CustomerQuoteListItem[];
  participant_count: number;
  submitted_count: number;
  lowest_amount: number;
  highest_amount: number;
  average_amount: number;
  awarded_partner_name: string | null;
  status: BiddingStatus;
  latest_submitted_at: string | null;
};

type StatusInfo = {
  label: string;
  className: string;
};

function formatDate(
  value: string | null,
): string {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    "ko-KR",
    {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    },
  ).format(date);
}

function formatCurrency(
  value: number,
): string {
  return `₩${value.toLocaleString(
    "ko-KR",
  )}`;
}

function getShortCode(
  value: string,
): string {
  return `BID-${value
    .replaceAll("-", "")
    .slice(0, 8)
    .toUpperCase()}`;
}

function getBiddingStatusInfo(
  status: BiddingStatus,
): StatusInfo {
  switch (status) {
    case "in_progress":
      return {
        label: "입찰 진행",
        className:
          "bg-blue-50 text-blue-700",
      };

    case "evaluating":
      return {
        label: "평가 중",
        className:
          "bg-orange-50 text-orange-700",
      };

    case "completed":
      return {
        label: "선정 완료",
        className:
          "bg-emerald-50 text-emerald-700",
      };
  }
}

function getRfqStatus(
  quotes: CustomerQuoteListItem[],
): BiddingStatus {
  if (
    quotes.some(
      (quote) =>
        quote.status === "awarded",
    )
  ) {
    return "completed";
  }

  if (
    quotes.some(
      (quote) =>
        quote.status === "waiting",
    )
  ) {
    return "evaluating";
  }

  return "in_progress";
}

function buildRfqGroups(
  quotes: CustomerQuoteListItem[],
): RfqGroup[] {
  const groupMap = new Map<
    string,
    CustomerQuoteListItem[]
  >();

  quotes.forEach((quote) => {
    const current =
      groupMap.get(
        quote.bidding_request_id,
      ) ?? [];

    current.push(quote);

    groupMap.set(
      quote.bidding_request_id,
      current,
    );
  });

  return Array.from(
    groupMap.entries(),
  )
    .map(
      ([
        biddingRequestId,
        groupQuotes,
      ]) => {
        const sortedQuotes = [
          ...groupQuotes,
        ].sort(
          (first, second) =>
            first.total_amount -
            second.total_amount,
        );

        const totalAmount =
          groupQuotes.reduce(
            (sum, quote) =>
              sum +
              quote.total_amount,
            0,
          );

        const awardedQuote =
          groupQuotes.find(
            (quote) =>
              quote.status ===
              "awarded",
          ) ?? null;

        const latestSubmittedAt =
          groupQuotes
            .map(
              (quote) =>
                quote.submitted_at,
            )
            .filter(
              (
                value,
              ): value is string =>
                Boolean(value),
            )
            .sort()
            .at(-1) ?? null;

        return {
          bidding_request_id:
            biddingRequestId,
          project_name:
            groupQuotes[0]
              ?.project_name ??
            "프로젝트명 미확인",
          due_date:
            groupQuotes[0]
              ?.due_date ?? null,
          quotes: groupQuotes,
          participant_count:
            groupQuotes.length,
          submitted_count:
            groupQuotes.filter(
              (quote) =>
                quote.status !==
                "rejected",
            ).length,
          lowest_amount:
            sortedQuotes[0]
              ?.total_amount ?? 0,
          highest_amount:
            sortedQuotes.at(-1)
              ?.total_amount ?? 0,
          average_amount:
            groupQuotes.length > 0
              ? Math.round(
                  totalAmount /
                    groupQuotes.length,
                )
              : 0,
          awarded_partner_name:
            awardedQuote
              ?.partner_company_name ??
            null,
          status:
            getRfqStatus(
              groupQuotes,
            ),
          latest_submitted_at:
            latestSubmittedAt,
        };
      },
    )
    .sort((first, second) => {
      const firstTime =
        first.latest_submitted_at
          ? new Date(
              first.latest_submitted_at,
            ).getTime()
          : 0;

      const secondTime =
        second.latest_submitted_at
          ? new Date(
              second.latest_submitted_at,
            ).getTime()
          : 0;

      return secondTime - firstTime;
    });
}

export default function CustomerBiddingPage() {
  const {
    quotes,
    loading,
    error,
    refresh,
  } = useSubmittedQuotes();

  const [
    searchKeyword,
    setSearchKeyword,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<BiddingStatusFilter>(
      "all",
    );

  const rfqGroups = useMemo(
    () =>
      buildRfqGroups(quotes),
    [quotes],
  );

  const filteredGroups =
    useMemo(() => {
      const keyword =
        searchKeyword
          .trim()
          .toLowerCase();

      return rfqGroups.filter(
        (group) => {
          const matchesKeyword =
            keyword.length === 0 ||
            [
              group.bidding_request_id,
              group.project_name,
              group.awarded_partner_name ??
                "",
            ]
              .join(" ")
              .toLowerCase()
              .includes(keyword);

          const matchesStatus =
            statusFilter ===
              "all" ||
            group.status ===
              statusFilter;

          return (
            matchesKeyword &&
            matchesStatus
          );
        },
      );
    }, [
      rfqGroups,
      searchKeyword,
      statusFilter,
    ]);

  const summary = useMemo(() => {
    const totalQuoteAmount =
      quotes.reduce(
        (sum, quote) =>
          sum +
          quote.total_amount,
        0,
      );

    const awardedQuotes =
      quotes.filter(
        (quote) =>
          quote.status ===
          "awarded",
      );

    const lowestAwardedTotal =
      awardedQuotes.reduce(
        (sum, quote) =>
          sum +
          quote.total_amount,
        0,
      );

    const expectedSaving =
      Math.max(
        0,
        totalQuoteAmount -
          lowestAwardedTotal,
      );

    return {
      totalRfq:
        rfqGroups.length,
      totalParticipants:
        quotes.length,
      completed:
        rfqGroups.filter(
          (group) =>
            group.status ===
            "completed",
        ).length,
      evaluating:
        rfqGroups.filter(
          (group) =>
            group.status ===
            "evaluating",
        ).length,
      averageQuote:
        quotes.length > 0
          ? Math.round(
              totalQuoteAmount /
                quotes.length,
            )
          : 0,
      averageLeadDays: 0,
      expectedSaving,
    };
  }, [
    quotes,
    rfqGroups,
  ]);

  const recentGroups =
    useMemo(
      () =>
        rfqGroups.slice(0, 5),
      [rfqGroups],
    );

  const partnerRanking =
    useMemo(() => {
      const partnerMap =
        new Map<
          string,
          {
            name: string;
            participationCount: number;
            awardCount: number;
          }
        >();

      quotes.forEach((quote) => {
        const current =
          partnerMap.get(
            quote.partner_company_id,
          ) ?? {
            name:
              quote.partner_company_name,
            participationCount: 0,
            awardCount: 0,
          };

        current.participationCount +=
          1;

        if (
          quote.status ===
          "awarded"
        ) {
          current.awardCount += 1;
        }

        partnerMap.set(
          quote.partner_company_id,
          current,
        );
      });

      return Array.from(
        partnerMap.values(),
      )
        .sort(
          (first, second) =>
            second.awardCount -
              first.awardCount ||
            second.participationCount -
              first.participationCount,
        )
        .slice(0, 5);
    }, [quotes]);

  if (loading) {
    return (
      <WorkspaceLayout role="customer">
        <div className="flex min-h-[480px] items-center justify-center bg-[#f7f9fc]">
          <p className="text-sm font-semibold text-slate-600">
            입찰현황을 불러오는 중입니다.
          </p>
        </div>
      </WorkspaceLayout>
    );
  }

  if (error) {
    return (
      <WorkspaceLayout role="customer">
        <div className="flex min-h-[480px] items-center justify-center bg-[#f7f9fc] px-6">
          <section className="w-full max-w-md rounded-xl border border-red-200 bg-white p-6 text-center shadow-sm">
            <h1 className="text-lg font-extrabold text-red-700">
              입찰현황을 불러오지 못했습니다.
            </h1>

            <p className="mt-2 text-sm text-slate-600">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                void refresh()
              }
              className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-5 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              다시 불러오기
            </button>
          </section>
        </div>
      </WorkspaceLayout>
    );
  }

  return (
    <WorkspaceLayout role="customer">
      <div className="min-h-full bg-[#f7f9fc]">
        <div className="mx-auto w-full max-w-[1760px] px-5 py-5 lg:px-7">
          <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-[26px] font-extrabold tracking-tight text-slate-950">
                입찰관리
              </h1>

              <p className="mt-1 text-sm text-slate-600">
                견적 요청부터 업체 비교와 선정까지
                입찰 현황을 한눈에 확인합니다.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/workspace/customer/bidding/request"
                className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
              >
                + 입찰 요청하기
              </Link>

              <button
                type="button"
                disabled
                className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-bold text-slate-400 shadow-sm"
              >
                엑셀 다운로드
              </button>
            </div>
          </header>

          <section className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            <KpiCard
              title="전체 입찰 요청"
              value={`${summary.totalRfq}건`}
              description={`평가중 ${summary.evaluating}건`}
            />

            <KpiCard
              title="입찰 참여"
              value={`${summary.totalParticipants}건`}
              description="제출 견적 기준"
            />

            <KpiCard
              title="선정 완료"
              value={`${summary.completed}건`}
              description={
                summary.totalRfq > 0
                  ? `선정률 ${Math.round(
                      (summary.completed /
                        summary.totalRfq) *
                        100,
                    )}%`
                  : "선정률 0%"
              }
            />

            <KpiCard
              title="평균 입찰가"
              value={formatCurrency(
                summary.averageQuote,
              )}
              description="VAT 별도"
            />

            <KpiCard
              title="평균 납기"
              value="-"
              description="제안 납기 집계 예정"
            />

            <KpiCard
              title="절감 예상 금액"
              value={formatCurrency(
                summary.expectedSaving,
              )}
              description="선정 결과 기준"
            />
          </section>

          <section className="mt-4 grid gap-4 2xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="min-w-0">
              <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-5 pt-4">
                  <div className="flex flex-wrap gap-7">
                    {[
                      {
                        label: "전체",
                        value: "all",
                        count:
                          rfqGroups.length,
                      },
                      {
                        label: "입찰 진행",
                        value:
                          "in_progress",
                        count:
                          rfqGroups.filter(
                            (group) =>
                              group.status ===
                              "in_progress",
                          ).length,
                      },
                      {
                        label: "평가 중",
                        value:
                          "evaluating",
                        count:
                          rfqGroups.filter(
                            (group) =>
                              group.status ===
                              "evaluating",
                          ).length,
                      },
                      {
                        label: "선정 완료",
                        value:
                          "completed",
                        count:
                          summary.completed,
                      },
                    ].map(
                      (tab) => {
                        const active =
                          statusFilter ===
                          tab.value;

                        return (
                          <button
                            key={
                              tab.value
                            }
                            type="button"
                            onClick={() =>
                              setStatusFilter(
                                tab.value as BiddingStatusFilter,
                              )
                            }
                            className={[
                              "border-b-2 pb-3 text-sm font-bold transition",
                              active
                                ? "border-blue-600 text-blue-700"
                                : "border-transparent text-slate-500 hover:text-slate-800",
                            ].join(
                              " ",
                            )}
                          >
                            {tab.label} (
                            {tab.count})
                          </button>
                        );
                      },
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs font-bold text-slate-500">
                      상태
                    </span>

                    <select
                      value={
                        statusFilter
                      }
                      onChange={(
                        event,
                      ) =>
                        setStatusFilter(
                          event
                            .target
                            .value as BiddingStatusFilter,
                        )
                      }
                      className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="all">
                        전체
                      </option>
                      <option value="in_progress">
                        입찰 진행
                      </option>
                      <option value="evaluating">
                        평가 중
                      </option>
                      <option value="completed">
                        선정 완료
                      </option>
                    </select>
                  </div>

                  <div className="flex w-full gap-2 xl:w-auto">
                    <input
                      type="search"
                      value={
                        searchKeyword
                      }
                      onChange={(
                        event,
                      ) =>
                        setSearchKeyword(
                          event.target
                            .value,
                        )
                      }
                      placeholder="프로젝트명, 입찰번호 검색"
                      className="h-10 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 xl:w-[300px]"
                    />

                    <button
                      type="button"
                      onClick={() => {
                        setSearchKeyword(
                          "",
                        );
                        setStatusFilter(
                          "all",
                        );
                      }}
                      className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                    >
                      필터 초기화
                    </button>
                  </div>
                </div>

                {filteredGroups.length ===
                0 ? (
                  <EmptyState />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1160px] border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-[#f7f9fc]">
                          <TableHeader align="center">
                            No.
                          </TableHeader>
                          <TableHeader>
                            입찰번호
                          </TableHeader>
                          <TableHeader>
                            프로젝트명
                          </TableHeader>
                          <TableHeader>
                            최근 제출일
                          </TableHeader>
                          <TableHeader>
                            희망 납기
                          </TableHeader>
                          <TableHeader align="center">
                            참여업체
                          </TableHeader>
                          <TableHeader align="right">
                            최저가
                          </TableHeader>
                          <TableHeader align="center">
                            상태
                          </TableHeader>
                          <TableHeader>
                            선정업체
                          </TableHeader>
                          <TableHeader align="center">
                            액션
                          </TableHeader>
                        </tr>
                      </thead>

                      <tbody>
                        {filteredGroups.map(
                          (
                            group,
                            index,
                          ) => {
                            const status =
                              getBiddingStatusInfo(
                                group.status,
                              );

                            return (
                              <tr
                                key={
                                  group.bidding_request_id
                                }
                                className="border-b border-slate-100 transition last:border-b-0 hover:bg-slate-50"
                              >
                                <TableCell align="center">
                                  {index +
                                    1}
                                </TableCell>

                                <TableCell>
                                  <span className="font-bold text-blue-700">
                                    {getShortCode(
                                      group.bidding_request_id,
                                    )}
                                  </span>
                                </TableCell>

                                <TableCell>
                                  <p className="max-w-[240px] truncate font-bold text-slate-900">
                                    {
                                      group.project_name
                                    }
                                  </p>
                                </TableCell>

                                <TableCell>
                                  {formatDate(
                                    group.latest_submitted_at,
                                  )}
                                </TableCell>

                                <TableCell>
                                  {formatDate(
                                    group.due_date,
                                  )}
                                </TableCell>

                                <TableCell align="center">
                                  <span className="font-bold text-slate-800">
                                    {
                                      group.participant_count
                                    }
                                  </span>
                                  <span className="text-slate-400">
                                    {" "}
                                    /{" "}
                                    {
                                      group.submitted_count
                                    }
                                  </span>
                                </TableCell>

                                <TableCell align="right">
                                  <span className="font-extrabold text-slate-950">
                                    {formatCurrency(
                                      group.lowest_amount,
                                    )}
                                  </span>

                                  {group.highest_amount >
                                  group.lowest_amount ? (
                                    <p className="mt-1 text-[11px] font-semibold text-emerald-600">
                                      최고가 대비{" "}
                                      {Math.round(
                                        ((group.highest_amount -
                                          group.lowest_amount) /
                                          group.highest_amount) *
                                          100,
                                      )}
                                      % 절감
                                    </p>
                                  ) : null}
                                </TableCell>

                                <TableCell align="center">
                                  <span
                                    className={`inline-flex rounded-md px-2.5 py-1 text-xs font-bold ${status.className}`}
                                  >
                                    {
                                      status.label
                                    }
                                  </span>
                                </TableCell>

                                <TableCell>
                                  {group.awarded_partner_name ??
                                    "-"}
                                </TableCell>

                                <TableCell align="center">
                                  <Link
                                    href={`/workspace/customer/bidding/${group.bidding_request_id}`}
                                    className="inline-flex h-8 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
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
                )}

                <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4">
                  <p className="text-sm font-bold text-slate-700">
                    총{" "}
                    {
                      filteredGroups.length
                    }
                    건
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled
                      className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-300"
                    >
                      ‹
                    </button>

                    <button
                      type="button"
                      className="flex h-9 min-w-9 items-center justify-center rounded-md bg-slate-950 px-2 text-sm font-bold text-white"
                    >
                      1
                    </button>

                    <button
                      type="button"
                      disabled
                      className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-300"
                    >
                      ›
                    </button>
                  </div>
                </div>
              </section>
            </div>

            <aside className="space-y-4">
              <StatusSummaryPanel
                groups={rfqGroups}
              />

              <RecentRfqPanel
                groups={recentGroups}
              />

              <PartnerRankingPanel
                partners={
                  partnerRanking
                }
              />

              <section className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-xs leading-5 text-blue-800">
                  입찰 선정은 품질,
                  납기, 가격, 기술력,
                  거래이력을 종합적으로
                  평가하여 결정합니다.
                </p>
              </section>
            </aside>
          </section>
        </div>
      </div>
    </WorkspaceLayout>
  );
}

function KpiCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <p className="text-sm font-bold text-slate-700">
        {title}
      </p>

      <p className="mt-3 break-words text-[24px] font-black leading-tight text-slate-950">
        {value}
      </p>

      <p className="mt-2 text-xs text-slate-500">
        {description}
      </p>
    </article>
  );
}

function StatusSummaryPanel({
  groups,
}: {
  groups: RfqGroup[];
}) {
  const items = [
    {
      label: "입찰 진행",
      count:
        groups.filter(
          (group) =>
            group.status ===
            "in_progress",
        ).length,
      className: "bg-blue-600",
    },
    {
      label: "평가 중",
      count:
        groups.filter(
          (group) =>
            group.status ===
            "evaluating",
        ).length,
      className: "bg-orange-400",
    },
    {
      label: "선정 완료",
      count:
        groups.filter(
          (group) =>
            group.status ===
            "completed",
        ).length,
      className: "bg-emerald-500",
    },
  ];

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-extrabold text-slate-950">
        입찰 현황 요약
      </h2>

      <div className="mt-5 space-y-4">
        {items.map((item) => {
          const percentage =
            groups.length > 0
              ? Math.round(
                  (item.count /
                    groups.length) *
                    100,
                )
              : 0;

          return (
            <div
              key={item.label}
              className="space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">
                  {item.label}
                </span>

                <span className="text-xs font-bold text-slate-900">
                  {item.count}건 (
                  {percentage}%)
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full ${item.className}`}
                  style={{
                    width: `${percentage}%`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 rounded-lg bg-slate-950 px-4 py-4 text-center text-white">
        <p className="text-xs text-slate-300">
          전체 입찰
        </p>

        <p className="mt-1 text-2xl font-black">
          {groups.length}건
        </p>
      </div>
    </section>
  );
}

function RecentRfqPanel({
  groups,
}: {
  groups: RfqGroup[];
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-extrabold text-slate-950">
          최근 입찰 요청
        </h2>
      </div>

      {groups.length === 0 ? (
        <p className="py-6 text-center text-xs text-slate-500">
          최근 입찰 요청이 없습니다.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {groups.map((group) => (
            <Link
              key={
                group.bidding_request_id
              }
              href={`/workspace/customer/bidding/${group.bidding_request_id}`}
              className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 text-xs last:border-b-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="font-bold text-slate-800">
                  {getShortCode(
                    group.bidding_request_id,
                  )}
                </p>

                <p className="mt-1 truncate text-slate-500">
                  {
                    group.project_name
                  }
                </p>
              </div>

              <span className="shrink-0 text-slate-400">
                {formatDate(
                  group.latest_submitted_at,
                )}
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function PartnerRankingPanel({
  partners,
}: {
  partners: Array<{
    name: string;
    participationCount: number;
    awardCount: number;
  }>;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-extrabold text-slate-950">
        참여 업체 TOP 5
      </h2>

      {partners.length === 0 ? (
        <p className="py-6 text-center text-xs text-slate-500">
          참여 업체 데이터가 없습니다.
        </p>
      ) : (
        <div className="mt-4 overflow-hidden rounded-lg border border-slate-100">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500">
                <th className="px-3 py-2 text-left">
                  업체명
                </th>
                <th className="px-3 py-2 text-right">
                  참여
                </th>
                <th className="px-3 py-2 text-right">
                  선정
                </th>
              </tr>
            </thead>

            <tbody>
              {partners.map(
                (partner) => (
                  <tr
                    key={
                      partner.name
                    }
                    className="border-t border-slate-100"
                  >
                    <td className="max-w-[150px] truncate px-3 py-2.5 font-semibold text-slate-700">
                      {
                        partner.name
                      }
                    </td>

                    <td className="px-3 py-2.5 text-right font-bold text-slate-700">
                      {
                        partner.participationCount
                      }
                    </td>

                    <td className="px-3 py-2.5 text-right font-bold text-slate-900">
                      {
                        partner.awardCount
                      }
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-[380px] items-center justify-center px-6 py-12">
      <div className="max-w-md text-center">
        <p className="text-base font-extrabold text-slate-800">
          표시할 입찰현황이 없습니다.
        </p>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          파트너가 견적을 제출하면 RFQ
          기준으로 업체 수와 최저가가
          자동 집계됩니다.
        </p>
      </div>
    </div>
  );
}

function TableHeader({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "center" | "right";
}) {
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

function TableCell({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "center" | "right";
}) {
  const alignClass =
    align === "center"
      ? "text-center"
      : align === "right"
        ? "text-right"
        : "text-left";

  return (
    <td
      className={`whitespace-nowrap px-4 py-3.5 text-sm text-slate-700 ${alignClass}`}
    >
      {children}
    </td>
  );
}