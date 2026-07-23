"use client";

import { useEffect, useState } from "react";

type QuoteMemoCardProps = {
  memo: string | null;
  disabled?: boolean;
  saving?: boolean;
  onSave: (
    memo: string | null,
  ) => Promise<void>;
};

export default function QuoteMemoCard({
  memo,
  disabled = false,
  saving = false,
  onSave,
}: QuoteMemoCardProps) {
  const [draftMemo, setDraftMemo] =
    useState("");

  const [savedMemo, setSavedMemo] =
    useState("");

  useEffect(() => {
    const nextMemo = memo ?? "";

    setDraftMemo(nextMemo);
    setSavedMemo(nextMemo);
  }, [memo]);

  const normalizedDraft =
    draftMemo.trim();

  const hasChanges =
    normalizedDraft !==
    savedMemo.trim();

  async function handleSave() {
    if (
      disabled ||
      saving ||
      !hasChanges
    ) {
      return;
    }

    const nextMemo =
      normalizedDraft || null;

    await onSave(nextMemo);

    setSavedMemo(
      nextMemo ?? "",
    );
  }

  return (
    <section className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-slate-950">
            전체 견적 메모
          </h3>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            전체 견적에 공통으로 적용되는
            조건이나 전달사항을 작성해 주세요.
          </p>
        </div>

        <MemoStatusBadge
          disabled={disabled}
          saving={saving}
          hasChanges={hasChanges}
        />
      </div>

      <textarea
        rows={5}
        value={draftMemo}
        disabled={disabled || saving}
        onChange={(event) => {
          setDraftMemo(
            event.target.value,
          );
        }}
        placeholder="예: 견적 유효기간, 자재 수급 조건, 납기 협의사항 등을 입력하세요."
        className="mt-4 w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
      />

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500">
          {draftMemo.length.toLocaleString()}
          자
        </p>

        <button
          type="button"
          disabled={
            disabled ||
            saving ||
            !hasChanges
          }
          onClick={handleSave}
          className="inline-flex h-9 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 px-4 text-xs font-black text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
        >
          {saving
            ? "저장 중..."
            : hasChanges
              ? "메모 저장"
              : "저장 완료"}
        </button>
      </div>
    </section>
  );
}

type MemoStatusBadgeProps = {
  disabled: boolean;
  saving: boolean;
  hasChanges: boolean;
};

function MemoStatusBadge({
  disabled,
  saving,
  hasChanges,
}: MemoStatusBadgeProps) {
  if (disabled) {
    return (
      <span className="inline-flex shrink-0 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
        수정 불가
      </span>
    );
  }

  if (saving) {
    return (
      <span className="inline-flex shrink-0 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
        저장 중
      </span>
    );
  }

  if (hasChanges) {
    return (
      <span className="inline-flex shrink-0 rounded-md bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
        변경사항 있음
      </span>
    );
  }

  return (
    <span className="inline-flex shrink-0 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
      저장완료
    </span>
  );
}