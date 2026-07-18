"use client";

type RequestHeaderActionsProps = {
  isSaving: boolean;
  isSubmitting?: boolean;
  submitDisabled?: boolean;

  onCancel: () => void;
  onTemporarySave: () => void;
  onSubmit: () => void;
};

export default function RequestHeaderActions({
  isSaving,
  isSubmitting = false,
  submitDisabled = false,
  onCancel,
  onTemporarySave,
  onSubmit,
}: RequestHeaderActionsProps) {
  const isBusy =
    isSaving || isSubmitting;

  return (
    <header className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-500">
          <span>입찰관리</span>
          <span className="text-slate-300">
            &gt;
          </span>
          <span className="text-slate-700">
            입찰 요청
          </span>
        </div>

        <h1 className="mt-3 text-[28px] font-bold leading-tight tracking-[-0.03em] text-slate-950">
          입찰 요청 (RFQ 등록)
        </h1>

        <p className="mt-2 max-w-2xl text-[13px] leading-5 text-slate-600">
          경쟁입찰에 필요한 정보를 입력하고
          요청할 파트너사를 선정하여 RFQ를
          발송합니다.
        </p>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2.5 lg:pt-10">
        <button
          type="button"
          onClick={onCancel}
          disabled={isBusy}
          className="inline-flex h-11 min-w-[92px] items-center justify-center rounded-md border border-slate-300 bg-white px-5 text-[13px] font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          취소
        </button>

        <button
          type="button"
          onClick={onTemporarySave}
          disabled={isBusy}
          className="inline-flex h-11 min-w-[112px] items-center justify-center rounded-md border border-slate-300 bg-white px-5 text-[13px] font-semibold text-slate-800 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving
            ? "저장 중..."
            : "임시저장"}
        </button>

        <button
          type="button"
          onClick={onSubmit}
          disabled={
            isBusy ||
            submitDisabled
          }
          className="inline-flex h-11 min-w-[136px] items-center justify-center rounded-md bg-blue-600 px-6 text-[13px] font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isSubmitting
            ? "요청 중..."
            : "RFQ 요청"}
        </button>
      </div>
    </header>
  );
}