"use client";

import { useEffect, useMemo, useState } from "react";

import type {
  PartnerBiddingBomItem,
  PartnerQuoteItem,
  SavePartnerQuoteItemInput,
} from "@/services/partner/biddingService";

type Props = {
  bomItem: PartnerBiddingBomItem;
  quoteItem: PartnerQuoteItem | null;

  disabled?: boolean;
  saving?: boolean;

  onSave: (
    item: SavePartnerQuoteItemInput,
  ) => Promise<void>;
};

function formatNumber(
  value: number,
): string {
  return new Intl.NumberFormat(
    "ko-KR",
  ).format(value);
}

function parseUnitPrice(
  value: string,
): number | null {
  if (value.trim() === "") {
    return null;
  }

  const parsedValue = Number(value);

  if (
    Number.isNaN(parsedValue) ||
    parsedValue < 0
  ) {
    return null;
  }

  return parsedValue;
}

export default function QuoteItemEditor({
  bomItem,
  quoteItem,
  disabled = false,
  saving = false,
  onSave,
}: Props) {
  const [
    unitPrice,
    setUnitPrice,
  ] = useState("");

  const [memo, setMemo] =
    useState("");

  useEffect(() => {
    setUnitPrice(
      quoteItem?.unit_price !==
        null &&
        quoteItem?.unit_price !==
          undefined
        ? String(
            Number(
              quoteItem.unit_price,
            ),
          )
        : "",
    );

    setMemo(
      quoteItem?.memo ?? "",
    );
  }, [
    bomItem.id,
    quoteItem,
  ]);

  const parsedUnitPrice =
    useMemo(() => {
      return parseUnitPrice(
        unitPrice,
      );
    }, [unitPrice]);

  const totalPrice =
    useMemo(() => {
      if (
        parsedUnitPrice === null
      ) {
        return 0;
      }

      return (
        parsedUnitPrice *
        Number(
          bomItem.quantity,
        )
      );
    }, [
      parsedUnitPrice,
      bomItem.quantity,
    ]);

  const canSave =
    !disabled &&
    !saving &&
    parsedUnitPrice !== null &&
    parsedUnitPrice > 0;

  async function handleSave() {
    if (!canSave) {
      return;
    }

    const input: SavePartnerQuoteItemInput =
      {
        bomItemId:
          bomItem.id,

        quotedQuantity:
          Number(
            bomItem.quantity,
          ),

        unit:
          bomItem.unit,

        unitPrice:
          parsedUnitPrice,

        leadTimeDays:
          null,

        proposedDueDate:
          null,

        memo:
          memo.trim() ||
          null,
      };

    await onSave(input);
  }

  return (
    <div className="space-y-5 p-4">
      <section className="overflow-hidden rounded-lg border border-slate-200">
        <div className="border-b border-slate-200 px-4 py-3">
          <h3 className="text-sm font-black text-slate-950">
            견적 입력
          </h3>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            품목별 단가와 특이사항을 입력해 주세요.
          </p>
        </div>

        <div className="space-y-4 p-4">
          <div>
            <label className="mb-2 block text-xs font-bold text-slate-500">
              요청수량
            </label>

            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-800">
              {formatNumber(
                Number(
                  bomItem.quantity,
                ),
              )}{" "}
              {bomItem.unit ?? ""}
            </div>
          </div>

          <div>
            <label
              htmlFor={`quote-unit-price-${bomItem.id}`}
              className="mb-2 block text-xs font-bold text-slate-500"
            >
              견적 단가
            </label>

            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm font-bold text-slate-500">
                ₩
              </span>

              <input
                id={`quote-unit-price-${bomItem.id}`}
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                disabled={
                  disabled ||
                  saving
                }
                value={unitPrice}
                onChange={(
                  event,
                ) => {
                  setUnitPrice(
                    event.target
                      .value,
                  );
                }}
                className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-8 pr-3 text-right text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                placeholder="0"
              />
            </div>

            {unitPrice !== "" &&
              parsedUnitPrice ===
                null && (
                <p className="mt-2 text-xs font-semibold text-red-600">
                  올바른 단가를 입력해 주세요.
                </p>
              )}
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold text-slate-500">
              공급가액
            </label>

            <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-3 text-right">
              <p className="text-xs font-bold text-blue-600">
                단가 × 요청수량
              </p>

              <p className="mt-1 text-lg font-black text-blue-700">
                ₩
                {formatNumber(
                  totalPrice,
                )}
              </p>
            </div>
          </div>

          <div>
            <label
              htmlFor={`quote-item-memo-${bomItem.id}`}
              className="mb-2 block text-xs font-bold text-slate-500"
            >
              품목 메모
            </label>

            <textarea
              id={`quote-item-memo-${bomItem.id}`}
              rows={5}
              disabled={
                disabled ||
                saving
              }
              value={memo}
              onChange={(
                event,
              ) => {
                setMemo(
                  event.target
                    .value,
                );
              }}
              className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
              placeholder="가공방법, 자재 조건, 특이사항 등을 입력하세요."
            />
          </div>
        </div>
      </section>

      <button
        type="button"
        disabled={!canSave}
        onClick={() => {
          void handleSave();
        }}
        className="flex h-11 w-full items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {saving
          ? "저장 중..."
          : disabled
            ? "수정 불가"
            : "품목 저장"}
      </button>

      {!disabled &&
        parsedUnitPrice ===
          null && (
          <p className="text-center text-xs font-semibold text-slate-500">
            견적 단가를 입력해야 저장할 수 있습니다.
          </p>
        )}
    </div>
  );
}