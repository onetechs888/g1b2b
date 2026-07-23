"use client";

import { useMemo, useState } from "react";

import BomQuoteRow from "@/components/partner/bids/BomQuoteRow";
import type {
  PartnerBiddingBomItem,
  PartnerQuoteItem,
} from "@/services/partner/biddingService";

type BomQuoteTableProps = {
  bomItems: PartnerBiddingBomItem[];
  quoteItems: PartnerQuoteItem[];
  selectedBomId: string | null;
  disabled?: boolean;
  onSelectBom: (bomItemId: string) => void;
};

function formatNumber(value: number): string {
  return new Intl.NumberFormat("ko-KR").format(
    value,
  );
}

export default function BomQuoteTable({
  bomItems,
  quoteItems,
  selectedBomId,
  disabled = false,
  onSelectBom,
}: BomQuoteTableProps) {
  const [
    incompleteOnly,
    setIncompleteOnly,
  ] = useState(false);

  const quoteItemMap = useMemo(() => {
    return new Map(
      quoteItems.map((quoteItem) => [
        quoteItem.bom_item_id,
        quoteItem,
      ]),
    );
  }, [quoteItems]);

  const completedCount = useMemo(() => {
    return bomItems.filter((bomItem) => {
      const quoteItem = quoteItemMap.get(
        bomItem.id,
      );

      return (
        quoteItem?.unit_price !== null &&
        quoteItem?.unit_price !== undefined
      );
    }).length;
  }, [bomItems, quoteItemMap]);

  const incompleteCount =
    bomItems.length - completedCount;

  const totalQuoteAmount = useMemo(() => {
    return bomItems.reduce(
      (sum, bomItem) => {
        const quoteItem = quoteItemMap.get(
          bomItem.id,
        );

        if (!quoteItem) {
          return sum;
        }

        if (
          quoteItem.total_price !== null &&
          quoteItem.total_price !== undefined
        ) {
          return (
            sum +
            Number(quoteItem.total_price)
          );
        }

        if (
          quoteItem.unit_price === null ||
          quoteItem.unit_price === undefined
        ) {
          return sum;
        }

        const quotedQuantity =
          Number(
            quoteItem.quoted_quantity,
          ) || bomItem.quantity;

        return (
          sum +
          Number(quoteItem.unit_price) *
            quotedQuantity
        );
      },
      0,
    );
  }, [bomItems, quoteItemMap]);

  const visibleBomItems = useMemo(() => {
    if (!incompleteOnly) {
      return bomItems;
    }

    return bomItems.filter((bomItem) => {
      const quoteItem = quoteItemMap.get(
        bomItem.id,
      );

      return (
        quoteItem?.unit_price === null ||
        quoteItem?.unit_price === undefined
      );
    });
  }, [
    bomItems,
    incompleteOnly,
    quoteItemMap,
  ]);

  const completionRate =
    bomItems.length > 0
      ? Math.round(
          (completedCount /
            bomItems.length) *
            100,
        )
      : 0;

  return (
    <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-base font-black text-slate-950">
                BOM 견적서
              </h2>

              <span className="text-sm font-semibold text-slate-500">
                총{" "}
                {formatNumber(
                  bomItems.length,
                )}
                개 품목
              </span>
            </div>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              품목을 선택하면 우측
              패널에서 단가, 납기 및
              견적 메모를 입력할 수
              있습니다.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge
              label="입력완료"
              value={completedCount}
              variant="complete"
            />

            <StatusBadge
              label="미입력"
              value={incompleteCount}
              variant={
                incompleteCount > 0
                  ? "incomplete"
                  : "default"
              }
            />

            <label className="ml-1 flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50">
              <input
                type="checkbox"
                checked={incompleteOnly}
                onChange={(event) => {
                  setIncompleteOnly(
                    event.target.checked,
                  );
                }}
                className="h-4 w-4 rounded border-slate-300 text-blue-600"
              />

              미입력 품목만 보기
            </label>
          </div>
        </div>

        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between text-xs font-bold">
            <span className="text-slate-500">
              견적 입력 진행률
            </span>

            <span
              className={
                completionRate === 100
                  ? "text-emerald-700"
                  : "text-blue-700"
              }
            >
              {completionRate}%
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full transition-all ${
                completionRate === 100
                  ? "bg-emerald-500"
                  : "bg-blue-600"
              }`}
              style={{
                width: `${completionRate}%`,
              }}
            />
          </div>
        </div>
      </div>

      {visibleBomItems.length === 0 ? (
        <div className="flex min-h-[420px] items-center justify-center p-8 text-center">
          <div>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-lg font-black text-emerald-700">
              ✓
            </div>

            <p className="mt-4 text-sm font-black text-slate-800">
              미입력 품목이 없습니다.
            </p>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              모든 BOM 품목에 견적
              단가가 입력되었습니다.
            </p>

            <button
              type="button"
              onClick={() => {
                setIncompleteOnly(false);
              }}
              className="mt-4 inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
            >
              전체 품목 보기
            </button>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <TableHeader align="center">
                  No.
                </TableHeader>

                <TableHeader>
                  품목
                </TableHeader>

                <TableHeader>
                  도면번호
                </TableHeader>

                <TableHeader align="center">
                  요청수량
                </TableHeader>

                <TableHeader align="right">
                  견적단가
                </TableHeader>

                <TableHeader align="right">
                  공급가액
                </TableHeader>

                <TableHeader align="center">
                  제안납기
                </TableHeader>

                <TableHeader align="center">
                  저장상태
                </TableHeader>
              </tr>
            </thead>

            <tbody>
              {visibleBomItems.map(
                (bomItem) => {
                  const originalIndex =
                    bomItems.findIndex(
                      (item) =>
                        item.id ===
                        bomItem.id,
                    );

                  return (
                    <BomQuoteRow
                      key={bomItem.id}
                      index={
                        originalIndex + 1
                      }
                      bomItem={bomItem}
                      quoteItem={
                        quoteItemMap.get(
                          bomItem.id,
                        ) ?? null
                      }
                      selected={
                        selectedBomId ===
                        bomItem.id
                      }
                      disabled={disabled}
                      onSelect={() => {
                        onSelectBom(
                          bomItem.id,
                        );
                      }}
                    />
                  );
                },
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-slate-500">
          <span>
            표시 품목{" "}
            <strong className="text-slate-800">
              {formatNumber(
                visibleBomItems.length,
              )}
              개
            </strong>
          </span>

          <span>
            입력완료{" "}
            <strong className="text-emerald-700">
              {formatNumber(
                completedCount,
              )}
              개
            </strong>
          </span>

          <span>
            미입력{" "}
            <strong
              className={
                incompleteCount > 0
                  ? "text-red-600"
                  : "text-slate-800"
              }
            >
              {formatNumber(
                incompleteCount,
              )}
              개
            </strong>
          </span>
        </div>

        <div className="text-right">
          <p className="text-xs font-semibold text-slate-500">
            현재 총 견적금액
          </p>

          <p className="mt-1 text-lg font-black text-slate-950">
            ₩
            {formatNumber(
              totalQuoteAmount,
            )}
          </p>
        </div>
      </div>
    </section>
  );
}

type StatusBadgeProps = {
  label: string;
  value: number;
  variant:
    | "complete"
    | "incomplete"
    | "default";
};

function StatusBadge({
  label,
  value,
  variant,
}: StatusBadgeProps) {
  const className =
    variant === "complete"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : variant === "incomplete"
        ? "border-red-200 bg-red-50 text-red-700"
        : "border-slate-200 bg-slate-50 text-slate-600";

  return (
    <div
      className={`inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-bold ${className}`}
    >
      <span>{label}</span>

      <strong>{value}</strong>
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
      className={`whitespace-nowrap px-3 py-3 text-xs font-black text-slate-600 ${alignClass}`}
    >
      {children}
    </th>
  );
}