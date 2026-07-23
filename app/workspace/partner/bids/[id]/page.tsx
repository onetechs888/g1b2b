"use client";

import Link from "next/link";
import {
  useParams,
  useRouter,
} from "next/navigation";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import BidHeader from "@/components/partner/bids/BidHeader";
import BomQuoteTable from "@/components/partner/bids/BomQuoteTable";
import QuoteSidePanel from "@/components/partner/bids/QuoteSidePanel";
import QuoteSubmitBar from "@/components/partner/bids/QuoteSubmitBar";
import RFQSummaryCards from "@/components/partner/bids/RFQSummaryCards";
import WorkspaceLayout from "@/components/workspace/WorkspaceLayout";

import { usePartnerBidDetail } from "@/hooks/partner/usePartnerBidDetail";

import type { PartnerQuoteItem } from "@/services/partner/biddingService";

type QuoteView = {
  status?: string | null;
  memo?: string | null;
  items?: PartnerQuoteItem[];
  quoteItems?: PartnerQuoteItem[];
};

function formatDate(
  value: string | null,
): string {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
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

function getStartOfDay(
  value: Date,
): Date {
  return new Date(
    value.getFullYear(),
    value.getMonth(),
    value.getDate(),
  );
}

function getDeadlineInformation(
  value: string | null,
) {
  if (!value) {
    return {
      label: "마감일 미정",
      dDay: "-",
      isClosed: false,
      isUrgent: false,
    };
  }

  const deadline = new Date(value);

  if (
    Number.isNaN(
      deadline.getTime(),
    )
  ) {
    return {
      label: "마감일 미정",
      dDay: "-",
      isClosed: false,
      isUrgent: false,
    };
  }

  const today = getStartOfDay(
    new Date(),
  );

  const target =
    getStartOfDay(deadline);

  const difference = Math.ceil(
    (target.getTime() -
      today.getTime()) /
      (1000 * 60 * 60 * 24),
  );

  if (difference < 0) {
    return {
      label: "입찰 마감",
      dDay: "마감",
      isClosed: true,
      isUrgent: false,
    };
  }

  if (difference === 0) {
    return {
      label: "오늘 마감",
      dDay: "D-Day",
      isClosed: false,
      isUrgent: true,
    };
  }

  return {
    label:
      difference <= 7
        ? "마감 임박"
        : "입찰 진행중",
    dDay: `D-${difference}`,
    isClosed: false,
    isUrgent:
      difference <= 7,
  };
}

function getStatusLabel(
  status: string,
): string {
  switch (status) {
    case "open":
      return "입찰 진행중";

    case "draft":
      return "임시저장";

    case "closed":
      return "입찰 마감";

    case "awarded":
      return "파트너 선정";

    case "cancelled":
      return "취소";

    default:
      return status;
  }
}

function getTierLabel(
  tier: string | null,
): string {
  if (!tier) {
    return "제한 없음";
  }

  const normalized =
    tier.trim().toUpperCase();

  if (
    normalized.startsWith("T") &&
    !normalized.includes("이상")
  ) {
    return `${normalized} 이상`;
  }

  return tier;
}

function calculateQuoteItemTotal(
  quoteItem: PartnerQuoteItem,
): number {
  if (
    quoteItem.total_price !== null &&
    quoteItem.total_price !==
      undefined
  ) {
    return Number(
      quoteItem.total_price,
    );
  }

  if (
    quoteItem.unit_price === null ||
    quoteItem.unit_price ===
      undefined
  ) {
    return 0;
  }

  return (
    Number(quoteItem.unit_price) *
    Number(
      quoteItem.quoted_quantity ??
        0,
    )
  );
}

export default function PartnerBidDetailPage() {
  const params = useParams();
  const router = useRouter();

  const biddingRequestId =
    typeof params.id === "string"
      ? params.id
      : Array.isArray(params.id)
        ? params.id[0]
        : "";

  const {
    biddingDetail,
    quote,

    loading,
    quoteLoading,
    quoteSaving,
    quoteSubmitting,

    error,
    refresh,

    saveItem,
    saveMemo,
    submitQuote,
  } = usePartnerBidDetail(
    biddingRequestId,
  );

  const [
    selectedBomId,
    setSelectedBomId,
  ] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (
      !biddingDetail ||
      biddingDetail.bomItems.length === 0
    ) {
      setSelectedBomId(null);
      return;
    }

    const selectedItemExists =
      biddingDetail.bomItems.some(
        (item) =>
          item.id === selectedBomId,
      );

    if (!selectedItemExists) {
      setSelectedBomId(
        biddingDetail.bomItems[0].id,
      );
    }
  }, [
    biddingDetail,
    selectedBomId,
  ]);

  const selectedBom =
    useMemo(() => {
      if (!biddingDetail) {
        return null;
      }

      return (
        biddingDetail.bomItems.find(
          (item) =>
            item.id ===
            selectedBomId,
        ) ??
        biddingDetail.bomItems[0] ??
        null
      );
    }, [
      biddingDetail,
      selectedBomId,
    ]);

  const quoteView =
    quote as QuoteView | null;

  const quoteItems =
    useMemo(() => {
      return (
        quoteView?.items ??
        quoteView?.quoteItems ??
        []
      );
    }, [quoteView]);

  const quoteItemMap =
    useMemo(() => {
      return new Map(
        quoteItems.map(
          (quoteItem) => [
            quoteItem.bom_item_id,
            quoteItem,
          ],
        ),
      );
    }, [quoteItems]);

  const selectedQuoteItem =
    useMemo(() => {
      if (!selectedBom) {
        return null;
      }

      return (
        quoteItemMap.get(
          selectedBom.id,
        ) ?? null
      );
    }, [
      quoteItemMap,
      selectedBom,
    ]);

  const completedItems =
    useMemo(() => {
      if (!biddingDetail) {
        return 0;
      }

      return biddingDetail.bomItems.filter(
        (bomItem) => {
          const quoteItem =
            quoteItemMap.get(
              bomItem.id,
            );

          return (
            quoteItem?.unit_price !==
              null &&
            quoteItem?.unit_price !==
              undefined
          );
        },
      ).length;
    }, [
      biddingDetail,
      quoteItemMap,
    ]);

  const totalAmount =
    useMemo(() => {
      return quoteItems.reduce(
        (
          total,
          quoteItem,
        ) =>
          total +
          calculateQuoteItemTotal(
            quoteItem,
          ),
        0,
      );
    }, [quoteItems]);

  const quoteStatus =
    quoteView?.status ??
    "draft";

  const quoteLockedStatuses = [
    "submitted",
    "accepted",
    "selected",
    "awarded",
    "rejected",
    "cancelled",
  ];

  const isQuoteLocked =
    quoteLockedStatuses.includes(
      quoteStatus,
    );
    useEffect(() => {
  if (quoteStatus === "submitted") {
    router.replace(
      "/workspace/partner/bids",
    );
  }
}, [quoteStatus, router]);

  if (
    loading ||
    quoteLoading
  ) {
    return (
      <WorkspaceLayout role="partner">
        <div className="min-h-full bg-[#f7f9fc] p-6">
          <div className="mx-auto flex min-h-[560px] max-w-[1800px] items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="text-center">
              <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

              <p className="mt-4 text-sm font-semibold text-slate-600">
                입찰 및 견적정보를
                불러오는 중입니다.
              </p>
            </div>
          </div>
        </div>
      </WorkspaceLayout>
    );
  }

  if (
    error ||
    !biddingDetail
  ) {
    return (
      <WorkspaceLayout role="partner">
        <div className="min-h-full bg-[#f7f9fc] p-6">
          <div className="mx-auto max-w-[1800px] rounded-xl border border-red-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-xl font-black text-red-600">
              !
            </div>

            <h1 className="mt-4 text-lg font-extrabold text-slate-900">
              입찰정보를 불러오지
              못했습니다.
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              {error ??
                "조회할 수 있는 입찰요청이 없습니다."}
            </p>

            <div className="mt-6 flex justify-center gap-2">
              <Link
                href="/workspace/partner/bids"
                className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                입찰목록
              </Link>

              <button
                type="button"
                onClick={() => {
                  void refresh();
                }}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-bold text-white transition hover:bg-blue-700"
              >
                다시 불러오기
              </button>
            </div>
          </div>
        </div>
      </WorkspaceLayout>
    );
  }

  const {
    request,
    bomItems,
  } = biddingDetail;

  const deadline =
    getDeadlineInformation(
      request.bid_deadline,
    );

  const deadlineVariant:
    | "default"
    | "urgent"
    | "closed" =
    deadline.isClosed
      ? "closed"
      : deadline.isUrgent
        ? "urgent"
        : "default";

  const editingDisabled =
    deadline.isClosed ||
    isQuoteLocked;

  return (
    <WorkspaceLayout role="partner">
      <div className="min-h-full bg-[#f7f9fc] pb-24">
        <div className="mx-auto w-full max-w-[1800px] px-4 py-5 lg:px-6">
          <BidHeader
            biddingRequestId={
              request.id
            }
            projectName={
              request.project_name
            }
            statusLabel={getStatusLabel(
              request.status,
            )}
            deadlineLabel={
              deadline.dDay
            }
            deadlineVariant={
              deadlineVariant
            }
          />

          <RFQSummaryCards
            customerName={
              request.customer_company_name
            }
            minimumTier={getTierLabel(
              request.minimum_partner_tier,
            )}
            bidDeadline={formatDate(
              request.bid_deadline,
            )}
            bidDeadlineLabel={
              deadline.dDay
            }
            dueDate={formatDate(
              request.due_date,
            )}
            bomCount={
              bomItems.length
            }
            status={getStatusLabel(
              request.status,
            )}
          />

          {editingDisabled && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
              <p className="text-sm font-black text-amber-800">
                {deadline.isClosed
                  ? "입찰 마감으로 견적을 수정할 수 없습니다."
                  : "제출된 견적은 수정할 수 없습니다."}
              </p>

              <p className="mt-1 text-xs leading-5 text-amber-700">
                등록된 견적정보는
                조회만 가능합니다.
              </p>
            </div>
          )}

          <div className="grid items-start gap-4 2xl:grid-cols-[minmax(0,1fr)_430px]">
            <BomQuoteTable
              bomItems={bomItems}
              quoteItems={quoteItems}
              selectedBomId={
                selectedBom?.id ??
                null
              }
              disabled={
                editingDisabled
              }
              onSelectBom={
                setSelectedBomId
              }
            />

            <div className="2xl:sticky 2xl:top-4">
              <QuoteSidePanel
                selectedBom={
                  selectedBom
                }
                quoteItem={
                  selectedQuoteItem
                }
                requestMemo={
                  request.memo
                }
                quoteMemo={
                  quoteView?.memo ??
                  null
                }
                disabled={
                  editingDisabled
                }
                saving={
                  quoteSaving
                }
                onSaveItem={async (
                  item,
                ) => {
                  await saveItem(item);
                }}
                onSaveMemo={async (
                  memo,
                ) => {
                  await saveMemo(memo);
                }}
              />
            </div>
          </div>
        </div>

        <QuoteSubmitBar
          totalItems={
            bomItems.length
          }
          completedItems={
            completedItems
          }
          totalAmount={
            totalAmount
          }
          saving={
            quoteSaving
          }
          submitting={
            quoteSubmitting
          }
          disabled={
            editingDisabled
          }
          onSubmit={async () => {
  await submitQuote();

  router.replace(
    "/workspace/partner/bids",
  );
}}
        />
      </div>
    </WorkspaceLayout>
  );
}