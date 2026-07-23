"use client";

type QuoteSubmitBarProps = {
  totalItems: number;
  completedItems: number;
  totalAmount: number;

  saving?: boolean;
  submitting?: boolean;
  disabled?: boolean;

  onSave?: () => void | Promise<void>;
  onSubmit: () => Promise<void>;
};

function formatNumber(value: number): string {
  return new Intl.NumberFormat(
    "ko-KR",
  ).format(value);
}

export default function QuoteSubmitBar({
  totalItems,
  completedItems,
  totalAmount,

  saving = false,
  submitting = false,
  disabled = false,

  onSave,
  onSubmit,
}: QuoteSubmitBarProps) {
  const completion =
    totalItems === 0
      ? 0
      : Math.round(
          (completedItems /
            totalItems) *
            100,
        );

  const canSubmit =
    completedItems === totalItems &&
    totalItems > 0 &&
    !disabled;

  const isProcessing =
    saving || submitting;

  const handleSave =
    async (): Promise<void> => {
      if (
        !onSave ||
        disabled ||
        isProcessing
      ) {
        return;
      }

      await onSave();
    };

  const handleSubmit =
    async (): Promise<void> => {
      if (
        !canSubmit ||
        isProcessing
      ) {
        return;
      }

      await onSubmit();
    };

  return (
    <div className="sticky bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-6">
          <div>
            <p className="text-xs font-semibold text-slate-500">
              입력 진행률
            </p>

            <div className="mt-1 flex items-center gap-2">
              <div className="h-2 w-40 overflow-hidden rounded-full bg-slate-200">
                <div
                  className={`h-full transition-all ${
                    completion === 100
                      ? "bg-emerald-500"
                      : "bg-blue-600"
                  }`}
                  style={{
                    width: `${completion}%`,
                  }}
                />
              </div>

              <span className="text-sm font-black">
                {completion}%
              </span>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500">
              작성 품목
            </p>

            <p className="mt-1 text-sm font-black">
              {completedItems} /{" "}
              {totalItems}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500">
              총 견적금액
            </p>

            <p className="mt-1 text-lg font-black text-blue-700">
              ₩
              {formatNumber(
                totalAmount,
              )}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          {onSave && (
            <button
              type="button"
              disabled={
                disabled ||
                isProcessing
              }
              onClick={() => {
                void handleSave();
              }}
              className="h-11 rounded-lg border border-slate-300 bg-white px-5 text-sm font-bold transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            >
              {saving
                ? "저장중..."
                : "임시저장"}
            </button>
          )}

          <button
            type="button"
            disabled={
              !canSubmit ||
              isProcessing
            }
            onClick={() => {
              void handleSubmit();
            }}
            className="h-11 rounded-lg bg-blue-600 px-7 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {submitting
              ? "제출중..."
              : "견적 제출"}
          </button>
        </div>
      </div>

      {!canSubmit &&
        !disabled && (
          <div className="border-t border-slate-100 bg-amber-50 px-6 py-2 text-xs font-semibold text-amber-700">
            모든 BOM 품목의
            견적을 입력해야 제출할 수
            있습니다.
          </div>
        )}

      {disabled && (
        <div className="border-t border-slate-100 bg-slate-50 px-6 py-2 text-xs font-semibold text-slate-600">
          제출되었거나 마감된
          견적서는 수정 및 재제출할 수
          없습니다.
        </div>
      )}
    </div>
  );
}