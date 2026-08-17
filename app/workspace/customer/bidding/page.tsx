"use client";

import Link from "next/link";
import {
  Award,
  CalendarDays,
  Download,
  FileText,
  Pencil,
  PiggyBank,
  Plus,
  Search,
  Trash2,
  Users,
  WalletCards,
} from "lucide-react";
import {
  useMemo,
  useState,
} from "react";

import WorkspaceLayout from "@/components/workspace/WorkspaceLayout";
import {
  useCustomerBiddingList,
} from "@/hooks/customer/useSubmittedQuotes";

import type {
  CustomerBiddingListItem,
  CustomerBiddingListStatus,
} from "@/services/customer/quoteService";

import {
  deleteBiddingRequest,
} from "@/services/customer/biddingRequestService";

type BiddingStatusFilter =
  | "all"
  | CustomerBiddingListStatus;

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
  value: number | null,
): string {
  if (
    value === null ||
    !Number.isFinite(value)
  ) {
    return "-";
  }

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
  status: CustomerBiddingListStatus,
): StatusInfo {
  switch (status) {
    case "draft":
      return {
        label: "임시저장",
        className:
          "bg-slate-100 text-slate-700",
      };

    case "waiting":
      return {
        label: "입찰 대기",
        className:
          "bg-blue-50 text-blue-700",
      };

    case "in_progress":
      return {
        label: "입찰 중",
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

function getEditActionInfo(
  item: CustomerBiddingListItem,
) {
  return {
    label:
      item.display_status ===
      "draft"
        ? "계속 작성"
        : "수정",
    href: `/workspace/customer/bidding/request?id=${item.id}`,
  };
}

export default function CustomerBiddingPage() {
  const {
    biddings,
    loading,
    error,
    refresh,
  } =
    useCustomerBiddingList();

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

  const [
    deletingRequestId,
    setDeletingRequestId,
  ] = useState<string | null>(
    null,
  );

  const activeBiddings =
    useMemo(
      () =>
        biddings.filter(
          (item) =>
            item.request_status !==
            "cancelled",
        ),
      [biddings],
    );

  const handleDeleteBidding =
    async (
      item: CustomerBiddingListItem,
    ) => {
      if (
        item.display_status ===
        "completed"
      ) {
        alert(
          "선정 완료된 입찰요청은 삭제할 수 없습니다.",
        );

        return;
      }

      const message =
        item.display_status ===
        "draft"
          ? [
              "임시저장된 입찰요청을 삭제하시겠습니까?",
              "",
              "삭제된 임시저장은 복구할 수 없습니다.",
            ].join("\n")
          : [
              "이 입찰요청을 취소하시겠습니까?",
              "",
              "공개된 RFQ는 이력 보존을 위해 실제 삭제되지 않고 취소 상태로 처리됩니다.",
              "기존 제출 견적이 있다면 진행보류 처리됩니다.",
            ].join("\n");

      if (
        !window.confirm(message)
      ) {
        return;
      }

      try {
        setDeletingRequestId(
          item.id,
        );

        const result =
          await deleteBiddingRequest(
            item.id,
          );

        if (
          result.mode ===
          "deleted"
        ) {
          alert(
            "임시저장 입찰요청이 삭제되었습니다.",
          );
        } else if (
          result.revision_required_quote_count >
          0
        ) {
          alert(
            [
              "입찰요청이 취소되었습니다.",
              "",
              `기존 제출 견적 ${result.revision_required_quote_count}건은 진행보류 처리되었습니다.`,
            ].join("\n"),
          );
        } else {
          alert(
            "입찰요청이 취소되었습니다.",
          );
        }

        await refresh();
      } catch (deleteError) {
        console.error(
          "입찰요청 삭제/취소 실패:",
          deleteError,
        );

        alert(
          deleteError instanceof Error
            ? deleteError.message
            : "입찰요청 삭제 중 오류가 발생했습니다.",
        );
      } finally {
        setDeletingRequestId(
          null,
        );
      }
    };

  const filteredBiddings =
    useMemo(() => {
      const keyword =
        searchKeyword
          .trim()
          .toLowerCase();

      return activeBiddings.filter(
        (item) => {
          const matchesKeyword =
            keyword.length === 0 ||
            [
              item.id,
              item.project_name,
              item
                .selected_partner_company_name ??
                "",
            ]
              .join(" ")
              .toLowerCase()
              .includes(keyword);

          const matchesStatus =
            statusFilter ===
              "all" ||
            item.display_status ===
              statusFilter;

          return (
            matchesKeyword &&
            matchesStatus
          );
        },
      );
    }, [
      activeBiddings,
      searchKeyword,
      statusFilter,
    ]);

  const summary = useMemo(() => {
    const submittedItems =
      activeBiddings.filter(
        (item) =>
          item.submitted_count >
          0,
      );

    const averageQuote =
      submittedItems.length > 0
        ? Math.round(
            submittedItems.reduce(
              (sum, item) =>
                sum +
                (item.average_amount ??
                  0),
              0,
            ) /
              submittedItems.length,
          )
        : 0;

    const expectedSaving =
      activeBiddings.reduce(
        (sum, item) => {
          if (
            item.lowest_amount ===
              null ||
            item.highest_amount ===
              null
          ) {
            return sum;
          }

          return (
            sum +
            Math.max(
              0,
              item.highest_amount -
                item.lowest_amount,
            )
          );
        },
        0,
      );

    return {
      totalRfq:
        activeBiddings.length,

      draft:
        activeBiddings.filter(
          (item) =>
            item.display_status ===
            "draft",
        ).length,

      waiting:
        activeBiddings.filter(
          (item) =>
            item.display_status ===
            "waiting",
        ).length,

      inProgress:
        activeBiddings.filter(
          (item) =>
            item.display_status ===
            "in_progress",
        ).length,

      completed:
        activeBiddings.filter(
          (item) =>
            item.display_status ===
            "completed",
        ).length,

      totalParticipants:
        activeBiddings.reduce(
          (sum, item) =>
            sum +
            item.participant_count,
          0,
        ),

      averageQuote,

      expectedSaving,
    };
  }, [activeBiddings]);

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
        <div className="g1-scroll-hide mx-auto w-full max-w-[1760px] px-5 py-5 lg:px-7">
          <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-950">
                입찰관리
              </h1>

              <p className="mt-1 text-sm text-slate-600">
                견적 요청부터 업체 비교와 선정까지 입찰 현황을 한눈에 확인합니다.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/workspace/customer/bidding/request"
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
              >
                <Plus size={14} />
                입찰 요청하기
              </Link>

              <button
                type="button"
                disabled
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 text-xs font-bold text-slate-400 shadow-sm"
              >
                <Download size={14} />
                엑셀 다운로드
              </button>
            </div>
          </header>

          <section className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            <KpiCard
              title="전체 입찰 요청"
              value={`${summary.totalRfq}건`}
              description={`임시저장 ${summary.draft}건`}
              icon={FileText}
              tone="blue"
            />

            <KpiCard
              title="입찰 참여"
              value={`${summary.totalParticipants}건`}
              description="Partner 참여 기준"
              icon={Users}
              tone="green"
            />

            <KpiCard
              title="선정 완료"
              value={`${summary.completed}건`}
              icon={Award}
              tone="violet"
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
              description="제출 견적 기준"
              icon={WalletCards}
              tone="amber"
            />

            <KpiCard
              title="평균 납기"
              value="-"
              description="제안 납기 집계 예정"
              icon={CalendarDays}
              tone="cyan"
            />

            <KpiCard
              title="절감 예상 금액"
              value={formatCurrency(
                summary.expectedSaving,
              )}
              description="최고가 대비 최저가"
              icon={PiggyBank}
              tone="rose"
            />
          </section>

          <section className="mt-4">
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-5 pt-4">
                <div className="flex flex-wrap gap-7">
                  {[
                    {
                      label: "전체",
                      value: "all",
                      count:
                        activeBiddings.length,
                    },
                    {
                      label: "임시저장",
                      value: "draft",
                      count:
                        summary.draft,
                    },
                    {
                      label: "입찰 대기",
                      value: "waiting",
                      count:
                        summary.waiting,
                    },
                    {
                      label: "입찰 중",
                      value:
                        "in_progress",
                      count:
                        summary.inProgress,
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
                            "border-b-2 pb-3 text-xs font-bold transition",
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
                        event.target
                          .value as BiddingStatusFilter,
                      )
                    }
                    className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="all">
                      전체
                    </option>
                    <option value="draft">
                      임시저장
                    </option>
                    <option value="waiting">
                      입찰 대기
                    </option>
                    <option value="in_progress">
                      입찰 중
                    </option>
                    <option value="completed">
                      선정 완료
                    </option>
                  </select>
                </div>

                <div className="flex w-full gap-2 xl:w-auto">
                  <div className="relative min-w-0 flex-1 xl:w-[300px]">
                    <Search
                      size={14}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

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
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-4 text-xs font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 xl:w-[300px]"
                    />
                  </div>

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
                    className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
                  >
                    필터 초기화
                  </button>
                </div>
              </div>

              {filteredBiddings.length ===
              0 ? (
                <EmptyState
                  statusFilter={
                    statusFilter
                  }
                />
              ) : (
                <div className="g1-scroll-hide overflow-x-auto">
                  <table className="w-full min-w-[1260px] border-collapse">
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
                          요청일
                        </TableHeader>

                        <TableHeader>
                          입찰 마감
                        </TableHeader>

                        <TableHeader>
                          희망 납기
                        </TableHeader>

                        <TableHeader align="center">
                          BOM
                        </TableHeader>

                        <TableHeader align="center">
                          참여 / 제출
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
                      {filteredBiddings.map(
                        (
                          item,
                          index,
                        ) => {
                          const status =
                            getBiddingStatusInfo(
                              item.display_status,
                            );

                          const editAction =
                            getEditActionInfo(
                              item,
                            );

                          const isDeleting =
                            deletingRequestId ===
                            item.id;

                          return (
                            <tr
                              key={
                                item.id
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
                                    item.id,
                                  )}
                                </span>
                              </TableCell>

                              <TableCell>
                                <p className="max-w-[240px] truncate font-bold text-slate-900">
                                  {
                                    item.project_name
                                  }
                                </p>
                              </TableCell>

                              <TableCell>
                                {formatDate(
                                  item.created_at,
                                )}
                              </TableCell>

                              <TableCell>
                                {formatDate(
                                  item.bid_deadline,
                                )}
                              </TableCell>

                              <TableCell>
                                {formatDate(
                                  item.due_date,
                                )}
                              </TableCell>

                              <TableCell align="center">
                                <span className="font-bold text-slate-800">
                                  {
                                    item.bom_count
                                  }
                                </span>
                              </TableCell>

                              <TableCell align="center">
                                <span className="font-bold text-slate-800">
                                  {
                                    item.participant_count
                                  }
                                </span>

                                <span className="text-slate-400">
                                  {" "}
                                  /{" "}
                                  {
                                    item.submitted_count
                                  }
                                </span>
                              </TableCell>

                              <TableCell align="right">
                                <span className="font-extrabold text-slate-950">
                                  {formatCurrency(
                                    item.lowest_amount,
                                  )}
                                </span>

                                {item.highest_amount !==
                                  null &&
                                item.lowest_amount !==
                                  null &&
                                item.highest_amount >
                                  item.lowest_amount ? (
                                  <p className="mt-1 text-[11px] font-semibold text-emerald-600">
                                    최고가 대비{" "}
                                    {Math.round(
                                      ((item.highest_amount -
                                        item.lowest_amount) /
                                        item.highest_amount) *
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
                                {item.selected_partner_company_name ??
                                  "-"}
                              </TableCell>

                              <TableCell align="center">
                                <div className="flex items-center justify-center gap-1.5">
                                  {item.display_status !==
                                  "completed" ? (
                                    <>
                                      <Link
                                        href={
                                          editAction.href
                                        }
                                        className="inline-flex h-8 items-center justify-center gap-1 rounded-md border border-blue-600 bg-blue-600 px-2.5 text-xs font-bold text-white transition hover:border-blue-700 hover:bg-blue-700"
                                      >
                                        <Pencil size={12} />
                                        {
                                          editAction.label
                                        }
                                      </Link>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          void handleDeleteBidding(
                                            item,
                                          )
                                        }
                                        disabled={
                                          isDeleting
                                        }
                                        className="inline-flex h-8 items-center justify-center gap-1 rounded-md border border-red-200 bg-white px-2.5 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                      >
                                        <Trash2 size={12} />
                                        {isDeleting
                                          ? "처리중"
                                          : "삭제"}
                                      </button>
                                    </>
                                  ) : null}

                                  {item.display_status !==
                                  "draft" ? (
                                    <Link
                                      href={`/workspace/customer/bidding/${item.id}`}
                                      className="inline-flex h-8 items-center justify-center rounded-md border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                                    >
                                      상세보기
                                    </Link>
                                  ) : null}
                                </div>
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
                <p className="text-xs font-bold text-slate-500">
                  총{" "}
                  {
                    filteredBiddings.length
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
  icon: Icon,
  tone,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ElementType;
  tone:
    | "blue"
    | "green"
    | "violet"
    | "amber"
    | "cyan"
    | "rose";
}) {
  const toneClassMap = {
    blue:
      "bg-blue-50 text-blue-600",
    green:
      "bg-emerald-50 text-emerald-600",
    violet:
      "bg-violet-50 text-violet-600",
    amber:
      "bg-amber-50 text-amber-600",
    cyan:
      "bg-cyan-50 text-cyan-600",
    rose:
      "bg-rose-50 text-rose-600",
  };

  return (
    <article className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${toneClassMap[tone]}`}
        >
          <Icon size={17} />
        </div>

        <div className="min-w-0">
          <p className="text-xs font-black text-slate-600">
            {title}
          </p>

          <p className="mt-2 break-words text-xl font-black leading-tight text-slate-950">
            {value}
          </p>

          <p className="mt-1.5 text-xs font-semibold text-slate-500">
            {description}
          </p>
        </div>
      </div>
    </article>
  );
}

function EmptyState({
  statusFilter,
}: {
  statusFilter:
    BiddingStatusFilter;
}) {
  const description =
    statusFilter === "draft"
      ? "임시저장된 입찰요청이 없습니다."
      : statusFilter ===
          "waiting"
        ? "Partner 견적 제출을 기다리는 입찰요청이 없습니다."
        : statusFilter ===
            "in_progress"
          ? "현재 입찰 진행 중인 RFQ가 없습니다."
          : statusFilter ===
              "completed"
            ? "선정 완료된 입찰요청이 없습니다."
            : "등록된 입찰요청이 없습니다.";

  return (
    <div className="flex min-h-[380px] items-center justify-center px-6 py-12">
      <div className="max-w-md text-center">
        <p className="text-base font-extrabold text-slate-800">
          표시할 입찰현황이 없습니다.
        </p>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          {description}
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
  align?:
    | "left"
    | "center"
    | "right";
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
  align?:
    | "left"
    | "center"
    | "right";
}) {
  const alignClass =
    align === "center"
      ? "text-center"
      : align === "right"
        ? "text-right"
        : "text-left";

  return (
    <td
      className={`whitespace-nowrap px-4 py-3.5 text-xs text-slate-700 ${alignClass}`}
    >
      {children}
    </td>
  );
}