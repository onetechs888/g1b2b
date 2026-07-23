"use client";

import type {
  PartnerBiddingBomItem,
  PartnerQuoteItem,
} from "@/services/partner/biddingService";

type Props = {
  index: number;
  bomItem: PartnerBiddingBomItem;
  quoteItem: PartnerQuoteItem | null;

  selected: boolean;
  disabled?: boolean;

  onSelect: () => void;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("ko-KR").format(
    value,
  );
}

function formatCurrency(
  value: number | null,
) {
  if (value === null) {
    return "-";
  }

  return `₩${formatNumber(value)}`;
}

function calculateTotal(
  bomItem: PartnerBiddingBomItem,
  quoteItem: PartnerQuoteItem | null,
) {
  if (!quoteItem) {
    return null;
  }

  if (
    quoteItem.total_price !== null &&
    quoteItem.total_price !== undefined
  ) {
    return Number(
      quoteItem.total_price,
    );
  }

  if (
    quoteItem.unit_price === null ||
    quoteItem.unit_price === undefined
  ) {
    return null;
  }

  return (
    Number(quoteItem.unit_price) *
    bomItem.quantity
  );
}

export default function BomQuoteRow({
  index,
  bomItem,
  quoteItem,
  selected,
  disabled = false,
  onSelect,
}: Props) {
  const totalPrice =
    calculateTotal(
      bomItem,
      quoteItem,
    );

  const isCompleted =
    quoteItem?.unit_price !== null &&
    quoteItem?.unit_price !== undefined;

  return (
    <tr
      onClick={() => {
        if (!disabled) {
          onSelect();
        }
      }}
      className={`cursor-pointer border-b border-slate-100 transition last:border-b-0 ${
        selected
          ? "bg-blue-50"
          : "hover:bg-slate-50"
      }`}
    >
      <td className="px-3 py-3 text-center text-sm">
        <div className="flex items-center justify-center gap-2">
          {selected && (
            <span className="h-5 w-0.5 rounded-full bg-blue-600" />
          )}

          {index}
        </div>
      </td>

      <td className="px-3 py-3">
        <div>
          <p
            className={`font-bold ${
              selected
                ? "text-blue-700"
                : "text-slate-900"
            }`}
          >
            {bomItem.part_name}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {bomItem.part_number ??
              "-"}
          </p>
        </div>
      </td>

      <td className="px-3 py-3">
        <span className="font-semibold text-blue-700">
          {bomItem.drawing_no ??
            "-"}
        </span>
      </td>

      <td className="px-3 py-3 text-center">
        <span className="font-bold">
          {formatNumber(
            bomItem.quantity,
          )}{" "}
          {bomItem.unit ?? ""}
        </span>
      </td>

      <td className="px-3 py-3 text-right">
        {quoteItem?.unit_price !=
        null ? (
          <span className="font-bold text-slate-900">
            {formatCurrency(
              Number(
                quoteItem.unit_price,
              ),
            )}
          </span>
        ) : (
          <span className="text-slate-400">
            미입력
          </span>
        )}
      </td>

      <td className="px-3 py-3 text-right">
        {totalPrice != null ? (
          <span className="font-black text-blue-700">
            {formatCurrency(
              totalPrice,
            )}
          </span>
        ) : (
          <span className="text-slate-400">
            -
          </span>
        )}
      </td>

      <td className="px-3 py-3 text-center">
        {quoteItem?.lead_time_days ? (
          <span className="font-semibold">
            {quoteItem.lead_time_days}
            일
          </span>
        ) : (
          <span className="text-slate-400">
            -
          </span>
        )}
      </td>

      <td className="px-3 py-3 text-center">
        {isCompleted ? (
          <span className="inline-flex rounded-md bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">
            저장완료
          </span>
        ) : (
          <span className="inline-flex rounded-md bg-red-50 px-2 py-1 text-xs font-bold text-red-700">
            미입력
          </span>
        )}
      </td>
    </tr>
  );
}