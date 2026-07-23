"use client";

import { useEffect, useState } from "react";

import DrawingPreview from "@/components/partner/bids/DrawingPreview";
import ItemInformation from "@/components/partner/bids/ItemInformation";
import QuoteItemEditor from "@/components/partner/bids/QuoteItemEditor";
import QuoteMemoCard from "@/components/partner/bids/QuoteMemoCard";

import type {
  PartnerBiddingBomItem,
  PartnerQuoteItem,
  SavePartnerQuoteItemInput,
} from "@/services/partner/biddingService";

type SideTab =
  | "quote"
  | "drawing"
  | "item"
  | "files";

type QuoteSidePanelProps = {
  selectedBom: PartnerBiddingBomItem | null;
  quoteItem: PartnerQuoteItem | null;

  requestMemo: string | null;
  quoteMemo: string | null;

  disabled?: boolean;
  saving?: boolean;

  onSaveItem: (
    item: SavePartnerQuoteItemInput,
  ) => Promise<void>;

  onSaveMemo: (
    memo: string | null,
  ) => Promise<void>;
};

function getItemDisplayCode(
  item: PartnerBiddingBomItem,
): string {
  return (
    item.drawing_no ||
    item.part_number ||
    "-"
  );
}

export default function QuoteSidePanel({
  selectedBom,
  quoteItem,
  requestMemo,
  quoteMemo,
  disabled = false,
  saving = false,
  onSaveItem,
  onSaveMemo,
}: QuoteSidePanelProps) {
  const [activeTab, setActiveTab] =
    useState<SideTab>("quote");

  useEffect(() => {
    setActiveTab("quote");
  }, [selectedBom?.id]);

  if (!selectedBom) {
    return (
      <aside className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex min-h-[720px] items-center justify-center p-8 text-center">
          <div>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-lg font-black text-slate-500">
              BOM
            </div>

            <p className="mt-4 text-sm font-black text-slate-800">
              선택된 품목이 없습니다.
            </p>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              왼쪽 BOM 견적서에서 견적을
              작성할 품목을 선택해 주세요.
            </p>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="border-b border-slate-200 px-4 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-500">
              선택 품목
            </p>

            <h2 className="mt-1 truncate text-base font-black text-slate-950">
              {selectedBom.part_name}
            </h2>

            <p className="mt-1 text-sm font-bold text-blue-700">
              {getItemDisplayCode(
                selectedBom,
              )}
            </p>
          </div>

          <QuoteStatusBadge
            completed={
              quoteItem?.unit_price !== null &&
              quoteItem?.unit_price !==
                undefined
            }
            disabled={disabled}
          />
        </div>
      </header>

      <nav className="flex overflow-x-auto border-b border-slate-200 px-2">
        <SideTabButton
          active={activeTab === "quote"}
          onClick={() => {
            setActiveTab("quote");
          }}
        >
          견적 입력
        </SideTabButton>

        <SideTabButton
          active={activeTab === "drawing"}
          onClick={() => {
            setActiveTab("drawing");
          }}
        >
          도면
        </SideTabButton>

        <SideTabButton
          active={activeTab === "item"}
          onClick={() => {
            setActiveTab("item");
          }}
        >
          품목 정보
        </SideTabButton>

        <SideTabButton
          active={activeTab === "files"}
          onClick={() => {
            setActiveTab("files");
          }}
        >
          첨부파일
        </SideTabButton>
      </nav>

      {activeTab === "quote" && (
        <QuoteItemEditor
          bomItem={selectedBom}
          quoteItem={quoteItem}
          disabled={disabled}
          saving={saving}
          onSave={onSaveItem}
        />
      )}

      {activeTab === "drawing" && (
        <DrawingPreview
          item={selectedBom}
        />
      )}

      {activeTab === "item" && (
        <ItemInformation
          item={selectedBom}
        />
      )}

      {activeTab === "files" && (
        <EmptyFilesContent />
      )}

      <section className="border-t border-slate-200 p-4">
        <h3 className="text-sm font-black text-slate-950">
          고객 요청사항
        </h3>

        <div className="mt-3 min-h-[84px] rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
            {requestMemo ||
              "등록된 고객 요청사항이 없습니다."}
          </p>
        </div>
      </section>

      <div className="border-t border-slate-200">
        <QuoteMemoCard
          memo={quoteMemo}
          disabled={disabled}
          saving={saving}
          onSave={onSaveMemo}
        />
      </div>
    </aside>
  );
}

type SideTabButtonProps = {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
};

function SideTabButton({
  children,
  active,
  onClick,
}: SideTabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative h-11 min-w-[88px] flex-1 whitespace-nowrap px-2 text-xs font-bold transition ${
        active
          ? "text-blue-700"
          : "text-slate-600 hover:text-slate-900"
      }`}
    >
      {children}

      {active && (
        <span className="absolute inset-x-2 bottom-0 h-0.5 bg-blue-600" />
      )}
    </button>
  );
}

type QuoteStatusBadgeProps = {
  completed: boolean;
  disabled: boolean;
};

function QuoteStatusBadge({
  completed,
  disabled,
}: QuoteStatusBadgeProps) {
  if (disabled) {
    return (
      <span className="inline-flex shrink-0 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
        수정 불가
      </span>
    );
  }

  if (completed) {
    return (
      <span className="inline-flex shrink-0 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
        저장완료
      </span>
    );
  }

  return (
    <span className="inline-flex shrink-0 rounded-md bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700">
      견적 미입력
    </span>
  );
}

function EmptyFilesContent() {
  return (
    <div className="flex min-h-[360px] items-center justify-center p-8 text-center">
      <div>
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-base font-black text-slate-500">
          -
        </div>

        <p className="mt-4 text-sm font-bold text-slate-700">
          연결된 파일이 없습니다.
        </p>

        <p className="mt-2 text-xs leading-5 text-slate-500">
          파일 연동 후 품목별 PDF,
          DWG, STEP 파일이 이 영역에
          표시됩니다.
        </p>
      </div>
    </div>
  );
}