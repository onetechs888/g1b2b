"use client";

type RequestFooterActionsProps = {
  isSaving: boolean;
  isSubmitting?: boolean;
  submitDisabled?: boolean;

  onCancel: () => void;
  onTemporarySave: () => void;
  onSubmit: () => void;
};

export default function RequestFooterActions({
  isSaving,
  isSubmitting = false,
  submitDisabled = false,
  onCancel,
  onTemporarySave,
  onSubmit,
}: RequestFooterActionsProps) {
  const isBusy =
    isSaving || isSubmitting;

  return (
    <footer className="flex items-center justify-end gap-3 border-t border-slate-200 pt-6">
      <button
        type="button"
        onClick={onCancel}
        disabled={isBusy}
        className="h-10 min-w-24 rounded-md border border-slate-300 bg-white px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        취소
      </button>

      <button
        type="button"
        onClick={onTemporarySave}
        disabled={isBusy}
        className="h-10 min-w-28 rounded-md border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
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
        className="h-10 min-w-32 rounded-md bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {isSubmitting
          ? "요청 중..."
          : "RFQ 요청"}
      </button>
    </footer>
  );
}