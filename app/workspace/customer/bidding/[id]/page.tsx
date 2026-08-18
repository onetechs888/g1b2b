"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowDownToLine,
  ArrowUpFromLine,
  BarChart3,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Users,
} from "lucide-react";
import { useParams } from "next/navigation";
import React, {
  useMemo,
  useState,
} from "react";

import WorkspaceLayout from "@/components/workspace/WorkspaceLayout";
import { useCustomerQuoteComparison } from "@/hooks/customer/useCustomerQuoteComparison";
import { useSelectBiddingPartner } from "@/hooks/customer/useSelectBiddingPartner";

import type {
  CustomerPartnerQuote,
  CustomerQuoteComparisonItem,
  CustomerQuoteStatus,
} from "@/services/customer/quoteService";

/* =========================================================
 * Types
 * ======================================================= */

type DetailTab =
  | "vendor"
  | "item";

type QuoteStatusInfo = {
  label: string;
  className: string;
};

/* =========================================================
 * Utils
 * ======================================================= */

function formatCurrency(
  value: number | null,
): string {
  if (value === null) {
    return "-";
  }

  return `₩${value.toLocaleString(
    "ko-KR",
  )}`;
}

function formatDate(
  value: string | null,
): string {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
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

function formatDateTime(
  value: string | null,
): string {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    "ko-KR",
    {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(date);
}

function getShortCode(
  value: string,
): string {
  return `BID-${value
    .replaceAll("-", "")
    .slice(0, 8)
    .toUpperCase()}`;
}

function getQuoteStatusInfo(
  status: CustomerQuoteStatus,
): QuoteStatusInfo {
  switch (status) {
    case "submitted":
      return {
        label: "제출 완료",
        className:
          "bg-blue-50 text-blue-700",
      };

    case "waiting":
      return {
        label: "검토 중",
        className:
          "bg-orange-50 text-orange-700",
      };

    case "awarded":
      return {
        label: "선정",
        className:
          "bg-emerald-50 text-emerald-700",
      };

    case "rejected":
      return {
        label: "미선정",
        className:
          "bg-slate-100 text-slate-500",
      };
  }
}

function getPriceDifferenceRate(
  currentAmount: number,
  lowestAmount: number | null,
): number | null {
  if (
    lowestAmount === null ||
    lowestAmount <= 0
  ) {
    return null;
  }

  return (
    ((currentAmount -
      lowestAmount) /
      lowestAmount) *
    100
  );
}

/* =========================================================
 * Page
 * ======================================================= */

export default function CustomerBiddingDetailPage() {
  const params = useParams();

  const biddingRequestId =
    typeof params.id === "string"
      ? params.id
      : "";

  const {
    comparison,
    loading,
    error,
    refresh,
  } =
    useCustomerQuoteComparison(
      biddingRequestId,
    );

  const {
    selecting,
    creating,
    error: selectionError,
    selectPartner,
    createProject,
    clearError,
  } =
    useSelectBiddingPartner();

  const [
    activeTab,
    setActiveTab,
  ] =
    useState<DetailTab>(
      "vendor",
    );

  const [
    selectedQuoteId,
    setSelectedQuoteId,
  ] =
    useState<string | null>(
      null,
    );

  const selectedQuote =
    useMemo(() => {
      if (!comparison) {
        return null;
      }

      if (selectedQuoteId) {
        return (
          comparison.quotes.find(
            (quote) =>
              quote.id ===
              selectedQuoteId,
          ) ?? null
        );
      }

      return (
        comparison.quotes.find(
          (quote) =>
            quote.status ===
            "awarded",
        ) ??
        comparison.quotes[0] ??
        null
      );
    }, [
      comparison,
      selectedQuoteId,
    ]);

  const sortedQuotes =
    useMemo(() => {
      if (!comparison) {
        return [];
      }

      return [
        ...comparison.quotes,
      ].sort(
        (first, second) =>
          first.total_amount -
          second.total_amount,
      );
    }, [comparison]);

  const handleSelectPartner =
    async (
      quote: CustomerPartnerQuote,
    ) => {
      if (!comparison) {
        return;
      }

      if (
        comparison.rfq
          .selected_partner_company_id
      ) {
        alert(
          "이미 선정된 Partner가 존재합니다.",
        );
        return;
      }

      const confirmed =
        window.confirm(
          [
            `${quote.partner_company_name}을(를) 최종 선정하시겠습니까?`,
            "",
            "선정 시",
            "- 해당 견적은 awarded 처리됩니다.",
            "- 동일 RFQ의 다른 제출 견적은 rejected 처리됩니다.",
            "- RFQ 상태는 awarded로 변경됩니다.",
            "",
            "선정 후에는 현재 단계에서 다시 변경할 수 없습니다.",
          ].join("\n"),
        );

      if (!confirmed) {
        return;
      }

      clearError();

      const result =
        await selectPartner(
          comparison.rfq.id,
          quote.id,
        );

      await refresh();

      if (!result) {
        return;
      }

      alert(
        [
          `${quote.partner_company_name} 업체가 최종 선정되었습니다.`,
          `Project ${result.project.project_code}가 생성되었습니다.`,
        ].join("\n"),
      );
    };

  const handleCreateMissingProject =
    async () => {
      if (!comparison) {
        return;
      }

      if (
        !comparison.rfq
          .selected_partner_company_id ||
        comparison.rfq.project_id
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          [
            "선정 완료된 RFQ의 Project를 생성하시겠습니까?",
            "",
            "- 선정 Partner 기준으로 Project가 생성됩니다.",
            "- RFQ BOM이 운영 BOM으로 변환됩니다.",
            "- 중복 Project는 생성되지 않습니다.",
          ].join("\n"),
        );

      if (!confirmed) {
        return;
      }

      clearError();

      const result =
        await createProject(
          comparison.rfq.id,
        );

      await refresh();

      if (!result) {
        return;
      }

      alert(
        `Project ${result.project_code}가 생성되었습니다.`,
      );
    };

  if (loading) {
    return (
      <WorkspaceLayout role="customer">
        <div className="flex min-h-[520px] items-center justify-center bg-[#f7f9fc]">
          <p className="text-sm font-semibold text-slate-600">
            RFQ 견적정보를
            불러오는 중입니다.
          </p>
        </div>
      </WorkspaceLayout>
    );
  }

  if (
    error ||
    !comparison
  ) {
    return (
      <WorkspaceLayout role="customer">
        <div className="flex min-h-[520px] items-center justify-center bg-[#f7f9fc] px-6">
          <section className="w-full max-w-md rounded-xl border border-red-200 bg-white p-6 text-center shadow-sm">
            <h1 className="text-lg font-extrabold text-red-700">
              RFQ 정보를
              불러오지 못했습니다.
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              {error ??
                "RFQ 정보를 찾을 수 없습니다."}
            </p>

            <div className="mt-5 flex justify-center gap-2">
              <Link
                href="/workspace/customer/bidding"
                className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700"
              >
                목록으로
              </Link>

              <button
                type="button"
                onClick={() =>
                  void refresh()
                }
                className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-bold text-white"
              >
                다시 불러오기
              </button>
            </div>
          </section>
        </div>
      </WorkspaceLayout>
    );
  }

  const {
    rfq,
    quotes,
  } = comparison;

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
        <div className="mx-auto w-full max-w-[1760px] px-5 py-5 lg:px-7">
          {/* =================================================
           * Header
           * =============================================== */}

          <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                <Link
                  href="/workspace/customer/bidding"
                  className="transition hover:text-blue-700"
                >
                  입찰관리
                </Link>

                <span>/</span>

                <span>
                  RFQ 상세
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-black tracking-tight text-slate-950">
                  {rfq.project_name}
                </h1>

                <span className="rounded-md bg-slate-950 px-2.5 py-1 text-xs font-bold text-white">
                  {getShortCode(
                    rfq.id,
                  )}
                </span>
              </div>

              <p className="mt-2 text-sm text-slate-600">
                참여업체의 견적금액,
                납기 및 BOM 품목별
                단가를 비교합니다.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/workspace/customer/bidding"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-xs font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <ArrowLeft size={14} />
                입찰목록
              </Link>

              <button
                type="button"
                onClick={() =>
                  void refresh()
                }
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-xs font-black text-white shadow-sm transition hover:bg-blue-700"
              >
                <RefreshCw size={14} />
                새로고침
              </button>
            </div>
          </header>

          {/* =================================================
           * RFQ Summary
           * =============================================== */}

          <section className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              label="참여 업체"
              value={`${comparison.participant_count}개사`}
              description={`유효 견적 ${comparison.submitted_quote_count}건`}
              icon={Users}
              tone="blue"
            />

            <SummaryCard
              label="최저 견적"
              value={formatCurrency(
                comparison.lowest_total_amount,
              )}
              description="제출 견적 기준"
              icon={ArrowDownToLine}
              tone="emerald"
            />

            <SummaryCard
              label="평균 견적"
              value={formatCurrency(
                comparison.average_total_amount,
              )}
              description="참여업체 평균"
              icon={BarChart3}
              tone="violet"
            />

            <SummaryCard
              label="최고 견적"
              value={formatCurrency(
                comparison.highest_total_amount,
              )}
              description="제출 견적 기준"
              icon={ArrowUpFromLine}
              tone="orange"
            />
          </section>

          {/* =================================================
           * RFQ Information
           * =============================================== */}

          <section className="mt-4 rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-base font-extrabold text-slate-950">
                RFQ 기본정보
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
              <div className="grid grid-rows-2 border-b border-slate-100 md:border-r xl:border-b-0">
                <InfoItem
                  label="Customer"
                  value={
                    comparison.customer_company_name
                  }
                />

                <InfoItem
                  label="RFQ 상태"
                  value={
                    rfq.status
                  }
                />
              </div>

              <div className="grid grid-rows-2 border-b border-slate-100 xl:border-b-0 xl:border-r">
                <InfoItem
                  label="입찰 마감"
                  value={formatDateTime(
                    rfq.bid_deadline,
                  )}
                />

                <InfoItem
                  label="선정 업체"
                  value={
                    comparison.selected_partner_company_name ??
                    "-"
                  }
                />
              </div>

              <div className="grid grid-rows-2 border-b border-slate-100 md:border-r xl:border-b-0">
                <InfoItem
                  label="희망 납기"
                  value={formatDate(
                    rfq.due_date,
                  )}
                />

                <InfoItem
                  label="Project 생성"
                  value={
                    rfq.project_id
                      ? "생성 완료"
                      : "미생성"
                  }
                />
              </div>

              <div className="grid grid-rows-2">
                <InfoItem
                  label="최소 Partner Tier"
                  value={
                    rfq.minimum_partner_tier ??
                    "-"
                  }
                />

                <InfoItem
                  label="등록일"
                  value={formatDateTime(
                    rfq.created_at,
                  )}
                />
              </div>
            </div>

            {rfq.description ||
            rfq.memo ? (
              <div className="grid border-t border-slate-100 md:grid-cols-2">
                <TextInfo
                  label="요청사항"
                  value={
                    rfq.description
                  }
                />

                <TextInfo
                  label="Customer 메모"
                  value={
                    rfq.memo
                  }
                />
              </div>
            ) : null}
          </section>

          {/* =================================================
           * Tabs
           * =============================================== */}

          <section className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex border-b border-slate-200 px-5">
              <TabButton
                active={
                  activeTab ===
                  "vendor"
                }
                onClick={() =>
                  setActiveTab(
                    "vendor",
                  )
                }
              >
                업체별 견적 비교
              </TabButton>

              <TabButton
                active={
                  activeTab ===
                  "item"
                }
                onClick={() =>
                  setActiveTab(
                    "item",
                  )
                }
              >
                품목별 단가 비교
              </TabButton>
            </div>

            {activeTab ===
            "vendor" ? (
              <VendorComparison
                quotes={
                  sortedQuotes
                }
                lowestAmount={
                  comparison.lowest_total_amount
                }
                selectedQuoteId={
                  selectedQuoteId
                }
                onSelect={(quoteId) =>
                  setSelectedQuoteId(
                    (current) =>
                      current === quoteId
                        ? null
                        : quoteId,
                  )
                }
                selectedPartnerCompanyId={
                  rfq.selected_partner_company_id
                }
                projectId={
                  rfq.project_id
                }
                selecting={
                  selecting
                }
                creating={
                  creating
                }
                selectionError={
                  selectionError
                }
                onSelectPartner={(quote) =>
                  void handleSelectPartner(
                    quote,
                  )
                }
                onCreateProject={() =>
                  void handleCreateMissingProject()
                }
              />
            ) : (
              <ItemComparison
                items={
                  comparison.comparison_items
                }
                quotes={
                  quotes
                }
              />
            )}
          </section>

        </div>
      </div>
    </WorkspaceLayout>
  );
}

/* =========================================================
 * Summary Card
 * ======================================================= */

function SummaryCard({
  label,
  value,
  description,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  description: string;
  icon: React.ElementType;
  tone: "blue" | "emerald" | "violet" | "orange";
}) {
  const toneClassMap = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    violet: "bg-violet-50 text-violet-600",
    orange: "bg-orange-50 text-orange-600",
  };

  return (
    <article className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${toneClassMap[tone]}`}
        >
          <Icon size={18} />
        </div>

        <div className="min-w-0">
          <p className="text-xs font-black text-slate-600">
            {label}
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

/* =========================================================
 * RFQ Info
 * ======================================================= */

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-h-[72px] min-w-0 flex-col justify-center px-5 py-3">
      <p className="text-xs font-bold text-slate-500">
        {label}
      </p>

      <p className="mt-1.5 break-words text-sm font-black leading-5 text-slate-900">
        {value || "-"}
      </p>
    </div>
  );
}

function TextInfo({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div className="px-5 py-4">
      <p className="text-xs font-bold text-slate-400">
        {label}
      </p>

      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
        {value || "-"}
      </p>
    </div>
  );
}

/* =========================================================
 * Tabs
 * ======================================================= */

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "mr-7 border-b-2 px-1 py-3.5 text-sm font-black transition",
        active
          ? "border-blue-600 text-blue-700"
          : "border-transparent text-slate-500 hover:text-slate-800",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

/* =========================================================
 * 업체별 견적 비교
 * ======================================================= */

function VendorComparison({
  quotes,
  lowestAmount,
  selectedQuoteId,
  onSelect,
  selectedPartnerCompanyId,
  projectId,
  selecting,
  creating,
  selectionError,
  onSelectPartner,
  onCreateProject,
}: {
  quotes: CustomerPartnerQuote[];
  lowestAmount: number | null;
  selectedQuoteId: string | null;
  onSelect: (
    quoteId: string,
  ) => void;
  selectedPartnerCompanyId:
    | string
    | null;
  projectId: string | null;
  selecting: boolean;
  creating: boolean;
  selectionError: string | null;
  onSelectPartner: (
    quote: CustomerPartnerQuote,
  ) => void;
  onCreateProject: () => void;
}) {
  if (
    quotes.length === 0
  ) {
    return (
      <EmptyState text="제출된 Partner 견적이 없습니다." />
    );
  }

  return (
    <div className="overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <table className="w-full min-w-[1120px] border-collapse">
        <thead>
          <tr className="border-b border-slate-200 bg-[#f7f9fc]">
            <TableHeader align="center">
              선택
            </TableHeader>

            <TableHeader>
              Partner
            </TableHeader>

            <TableHeader align="right">
              총 견적금액
            </TableHeader>

            <TableHeader align="center">
              최저가 대비
            </TableHeader>

            <TableHeader align="center">
              품목 수
            </TableHeader>

            <TableHeader align="center">
              평균 Lead Time
            </TableHeader>

            <TableHeader align="center">
              최대 Lead Time
            </TableHeader>

            <TableHeader>
              제안 납기
            </TableHeader>

            <TableHeader>
              제출일
            </TableHeader>

            <TableHeader align="center">
              상태
            </TableHeader>
          </tr>
        </thead>

        <tbody>
          {quotes.map(
            (quote) => {
              const status =
                getQuoteStatusInfo(
                  quote.status,
                );

              const differenceRate =
                getPriceDifferenceRate(
                  quote.total_amount,
                  lowestAmount,
                );

              const isLowest =
                lowestAmount !==
                  null &&
                quote.total_amount ===
                  lowestAmount;

              const expanded =
                selectedQuoteId ===
                quote.id;

              return (
                <React.Fragment
                  key={quote.id}
                >
                  <tr
                    onClick={() =>
                      onSelect(
                        quote.id,
                      )
                    }
                    className={[
                      "cursor-pointer border-b border-slate-100 transition",
                      expanded
                        ? "bg-blue-50/60"
                        : "hover:bg-slate-50",
                    ].join(
                      " ",
                    )}
                  >
                    <TableCell align="center">
                      <span
                        className={[
                          "inline-flex h-4 w-4 rounded-full border-4",
                          expanded
                            ? "border-blue-600 bg-white"
                            : "border-slate-300 bg-white",
                        ].join(
                          " ",
                        )}
                      />
                    </TableCell>

                    <TableCell>
                      <div>
                        <p className="text-sm font-black text-slate-900">
                          {
                            quote.partner_company_name
                          }
                        </p>

                        {isLowest ? (
                          <span className="mt-1 inline-flex rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-black text-emerald-700">
                            최저 견적
                          </span>
                        ) : null}
                      </div>
                    </TableCell>

                    <TableCell align="right">
                      <span className="font-black text-slate-950">
                        {formatCurrency(
                          quote.total_amount,
                        )}
                      </span>
                    </TableCell>

                    <TableCell align="center">
                      {isLowest ? (
                        <span className="font-bold text-emerald-600">
                          기준
                        </span>
                      ) : differenceRate !==
                        null ? (
                        <span className="font-bold text-orange-600">
                          +
                          {differenceRate.toFixed(
                            1,
                          )}
                          %
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>

                    <TableCell align="center">
                      {
                        quote.item_count
                      }
                    </TableCell>

                    <TableCell align="center">
                      {quote.average_lead_time_days !==
                      null
                        ? `${quote.average_lead_time_days}일`
                        : "-"}
                    </TableCell>

                    <TableCell align="center">
                      {quote.max_lead_time_days !==
                      null
                        ? `${quote.max_lead_time_days}일`
                        : "-"}
                    </TableCell>

                    <TableCell>
                      {formatDate(
                        quote.proposed_due_date,
                      )}
                    </TableCell>

                    <TableCell>
                      {formatDateTime(
                        quote.submitted_at,
                      )}
                    </TableCell>

                    <TableCell align="center">
                      <div className="flex items-center justify-center gap-2">
                        <span
                          className={`inline-flex rounded-md px-2.5 py-1 text-xs font-black ${status.className}`}
                        >
                          {
                            status.label
                          }
                        </span>

                        {expanded ? (
                          <ChevronUp
                            size={14}
                            className="text-blue-600"
                          />
                        ) : (
                          <ChevronDown
                            size={14}
                            className="text-slate-400"
                          />
                        )}
                      </div>
                    </TableCell>
                  </tr>

                  {expanded ? (
                    <tr>
                      <td
                        colSpan={10}
                        className="border-b border-slate-200 bg-slate-50/60 p-0"
                      >
                        <div className="grid gap-3 p-3 xl:grid-cols-[minmax(0,1fr)_280px]">
                          <SelectedQuoteDetail
                            quote={
                              quote
                            }
                          />

                          <SelectionPanel
                            quote={
                              quote
                            }
                            selectedPartnerCompanyId={
                              selectedPartnerCompanyId
                            }
                            projectId={
                              projectId
                            }
                            selecting={
                              selecting
                            }
                            creating={
                              creating
                            }
                            selectionError={
                              selectionError
                            }
                            onSelectPartner={() =>
                              onSelectPartner(
                                quote,
                              )
                            }
                            onCreateProject={
                              onCreateProject
                            }
                          />
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </React.Fragment>
              );
            },
          )}
        </tbody>
      </table>
    </div>
  );
}

/* =========================================================
 * 품목별 단가 비교
 * ======================================================= */

function ItemComparison({
  items,
  quotes,
}: {
  items: CustomerQuoteComparisonItem[];
  quotes: CustomerPartnerQuote[];
}) {
  if (items.length === 0) {
    return (
      <EmptyState text="비교 가능한 품목 데이터가 없습니다." />
    );
  }

  const partnerNameMap =
    new Map(
      quotes.map((quote) => [
        quote.partner_company_id,
        quote.partner_company_name,
      ]),
    );

  return (
    <div className="overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <table className="w-full min-w-[1320px] border-collapse">
        <thead>
          <tr className="border-b border-slate-200 bg-[#f7f9fc]">
            <TableHeader>
              품번
            </TableHeader>

            <TableHeader>
              품명
            </TableHeader>

            <TableHeader>
              도면번호
            </TableHeader>

            <TableHeader align="center">
              Rev
            </TableHeader>

            <TableHeader>
              재질
            </TableHeader>

            <TableHeader align="center">
              수량
            </TableHeader>

            <TableHeader align="right">
              최저 단가
            </TableHeader>

            <TableHeader>
              최저 업체
            </TableHeader>

            <TableHeader align="right">
              최고 단가
            </TableHeader>

            <TableHeader>
              최고 업체
            </TableHeader>

            <TableHeader align="right">
              가격차
            </TableHeader>
          </tr>
        </thead>

        <tbody>
          {items.map((item) => {
            const prices =
              item.vendors
                .map((vendor) => ({
                  partner_company_id:
                    vendor.partner_company_id,
                  partner_company_name:
                    vendor.partner_company_name,
                  unit_price:
                    vendor.unit_price,
                }))
                .sort(
                  (first, second) =>
                    first.unit_price -
                    second.unit_price,
                );

            const lowest =
              prices[0] ?? null;

            const highest =
              prices.at(-1) ?? null;

            const lowestPartnerName =
              lowest?.partner_company_name ??
              (lowest
                ? partnerNameMap.get(
                    lowest.partner_company_id,
                  ) ?? "-"
                : "-");

            const highestPartnerName =
              highest?.partner_company_name ??
              (highest
                ? partnerNameMap.get(
                    highest.partner_company_id,
                  ) ?? "-"
                : "-");

            const priceDifference =
              lowest && highest
                ? Math.max(
                    0,
                    highest.unit_price -
                      lowest.unit_price,
                  )
                : 0;

            return (
              <tr
                key={item.bom_item_id}
                className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50"
              >
                <TableCell>
                  <span className="font-black text-slate-950">
                    {
                      item.part_number ??
                      "-"
                    }
                  </span>
                </TableCell>

                <TableCell>
                  <span className="font-black text-slate-900">
                    {
                      item.part_name ??
                      "-"
                    }
                  </span>
                </TableCell>

                <TableCell>
                  {
                    item.drawing_no ??
                    "-"
                  }
                </TableCell>

                <TableCell align="center">
                  {
                    item.revision ??
                    "-"
                  }
                </TableCell>

                <TableCell>
                  {
                    item.material ??
                    "-"
                  }
                </TableCell>

                <TableCell align="center">
                  {
                    item.quantity
                  }
                </TableCell>

                <TableCell align="right">
                  <span className="font-black text-emerald-700">
                    {lowest
                      ? formatCurrency(
                          lowest.unit_price,
                        )
                      : "-"}
                  </span>
                </TableCell>

                <TableCell>
                  <span className="font-black text-slate-900">
                    {
                      lowestPartnerName
                    }
                  </span>

                  {lowest ? (
                    <span className="ml-2 inline-flex rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700">
                      최저
                    </span>
                  ) : null}
                </TableCell>

                <TableCell align="right">
                  <span className="font-black text-slate-950">
                    {highest
                      ? formatCurrency(
                          highest.unit_price,
                        )
                      : "-"}
                  </span>
                </TableCell>

                <TableCell>
                  <span className="font-bold text-slate-700">
                    {
                      highestPartnerName
                    }
                  </span>
                </TableCell>

                <TableCell align="right">
                  <div className="font-black text-slate-950">
                    {lowest && highest
                      ? formatCurrency(
                          priceDifference,
                        )
                      : "-"}
                  </div>

                  {lowest &&
                  highest &&
                  highest.unit_price >
                    0 &&
                  priceDifference >
                    0 ? (
                    <div className="mt-1 text-[10px] font-black text-orange-600">
                      {Math.round(
                        (priceDifference /
                          highest.unit_price) *
                          100,
                      )}
                      % 차이
                    </div>
                  ) : null}
                </TableCell>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* =========================================================
 * 선택 업체 상세
 * ======================================================= */

function SelectedQuoteDetail({
  quote,
}: {
  quote: CustomerPartnerQuote;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="flex flex-col gap-2 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold text-slate-500">
            선택 견적
          </p>

          <h2 className="mt-1 text-base font-black text-slate-950">
            {
              quote.partner_company_name
            }
          </h2>
        </div>

        <div className="text-right"><p className="text-lg font-black text-slate-950">
          {formatCurrency(
            quote.total_amount,
          )}
        </p>
        <p className="mt-1 text-[10px] font-bold text-slate-400">
          총 견적금액
        </p></div>
      </div>

      <div className="grid grid-cols-2 gap-3 border-b border-slate-100 px-4 py-3 lg:grid-cols-4">
        <InfoItem
          label="품목 수"
          value={`${quote.item_count}개`}
        />

        <InfoItem
          label="평균 Lead Time"
          value={
            quote.average_lead_time_days !==
            null
              ? `${quote.average_lead_time_days}일`
              : "-"
          }
        />

        <InfoItem
          label="최대 Lead Time"
          value={
            quote.max_lead_time_days !==
            null
              ? `${quote.max_lead_time_days}일`
              : "-"
          }
        />

        <InfoItem
          label="제안 납기"
          value={formatDate(
            quote.proposed_due_date,
          )}
        />
      </div>

      <div className="px-4 py-3">
        <p className="text-xs font-bold text-slate-500">
          Partner 견적 메모
        </p>

        <p className="mt-1.5 whitespace-pre-wrap text-xs leading-5 text-slate-700">
          {quote.memo ||
            "등록된 견적 메모가 없습니다."}
        </p>
      </div>
    </section>
  );
}

/* =========================================================
 * 업체 선정 패널
 * ======================================================= */

function SelectionPanel({
  quote,
  selectedPartnerCompanyId,
  projectId,
  selecting,
  creating,
  selectionError,
  onSelectPartner,
  onCreateProject,
}: {
  quote: CustomerPartnerQuote;
  selectedPartnerCompanyId:
    | string
    | null;
  projectId: string | null;
  selecting: boolean;
  creating: boolean;
  selectionError: string | null;
  onSelectPartner: () => void;
  onCreateProject: () => void;
}) {
  const isSelected =
    selectedPartnerCompanyId ===
    quote.partner_company_id;

  const selectionCompleted =
    selectedPartnerCompanyId !==
    null;

  const canSelect =
    !selectionCompleted &&
    (
      quote.status ===
        "submitted" ||
      quote.status ===
        "waiting"
    );

  return (
    <aside className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs font-bold text-slate-500">
        업체 선정
      </p>

      <h2 className="mt-1 text-base font-black text-slate-950">
        {
          quote.partner_company_name
        }
      </h2>

      <div className="mt-3 rounded-lg bg-slate-50 p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500">
            총 견적금액
          </span>

          <span className="text-sm font-black text-slate-950">
            {formatCurrency(
              quote.total_amount,
            )}
          </span>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500">
            현재 상태
          </span>

          <span className="text-xs font-bold text-slate-800">
            {
              getQuoteStatusInfo(
                quote.status,
              ).label
            }
          </span>
        </div>
      </div>

      {selectionError ? (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
          <p className="text-xs font-bold leading-5 text-red-700">
            {selectionError}
          </p>
        </div>
      ) : null}

      {isSelected ? (
        <>
          <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5">
            <p className="text-sm font-extrabold text-emerald-700">
              선정 완료 업체입니다.
            </p>

            <p className="mt-1 text-xs text-emerald-700">
              {projectId
                ? "Project 생성까지 완료되었습니다."
                : "Project는 아직 생성되지 않았습니다."}
            </p>
          </div>

          {!projectId ? (
            <button
              type="button"
              onClick={
                onCreateProject
              }
              disabled={creating}
              className="mt-3 flex h-11 w-full items-center justify-center rounded-lg bg-blue-600 text-sm font-extrabold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {creating
                ? "Project 생성 중..."
                : "Project 생성"}
            </button>
          ) : null}
        </>
      ) : selectionCompleted ? (
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-sm font-bold text-slate-600">
            다른 Partner가 이미
            선정되었습니다.
          </p>
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={
              onSelectPartner
            }
            disabled={
              !canSelect ||
              selecting
            }
            className={[
              "mt-4 flex h-11 w-full items-center justify-center rounded-lg text-sm font-extrabold transition",
              canSelect &&
              !selecting
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "cursor-not-allowed bg-slate-200 text-slate-400",
            ].join(
              " ",
            )}
          >
            {selecting
              ? "선정 처리 중..."
              : "이 업체 선정"}
          </button>

          <button
            type="button"
            disabled
            className="mt-2 flex h-10 w-full cursor-not-allowed items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-400"
          >
            견적 거절
          </button>

          <p className="mt-3 text-xs leading-5 text-slate-500">
            업체 선정 시 해당 견적은
            awarded, 동일 RFQ의 다른
            견적은 rejected로
            처리됩니다.
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-400">
            개별 견적 거절은 별도
            Workflow 확정 후
            연결합니다.
          </p>
        </>
      )}
    </aside>
  );
}

/* =========================================================
 * Table
 * ======================================================= */

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
      className={`whitespace-nowrap px-4 py-3 text-xs font-black text-slate-600 ${alignClass}`}
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
      className={`whitespace-nowrap px-4 py-3.5 text-sm font-semibold text-slate-700 ${alignClass}`}
    >
      {children}
    </td>
  );
}

/* =========================================================
 * Empty
 * ======================================================= */

function EmptyState({
  text,
}: {
  text: string;
}) {
  return (
    <div className="flex min-h-[280px] items-center justify-center px-6 py-12">
      <div className="text-center">
        <p className="text-sm font-bold text-slate-700">
          {text}
        </p>
      </div>
    </div>
  );
}