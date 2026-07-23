"use client";

import type { PartnerBiddingBomItem } from "@/services/partner/biddingService";

type DrawingPreviewProps = {
  item: PartnerBiddingBomItem;
};

function getDrawingCode(
  item: PartnerBiddingBomItem,
): string {
  return (
    item.drawing_no ||
    item.part_number ||
    "-"
  );
}

export default function DrawingPreview({
  item,
}: DrawingPreviewProps) {
  const drawingCode =
    getDrawingCode(item);

  return (
    <section className="p-4">
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <header className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-500">
              품목 도면
            </p>

            <h3 className="mt-1 truncate text-sm font-black text-slate-950">
              {item.part_name}
            </h3>

            <p className="mt-1 truncate text-xs font-bold text-blue-700">
              {drawingCode}
            </p>
          </div>

          <span className="inline-flex w-fit shrink-0 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
            미리보기
          </span>
        </header>

        <div className="flex min-h-[390px] items-center justify-center bg-slate-50 p-6">
          <div className="w-full max-w-[360px] text-center">
            <div className="relative mx-auto flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-white">
              <div className="absolute left-4 top-4 h-8 w-8 border-l-2 border-t-2 border-slate-300" />

              <div className="absolute right-4 top-4 h-8 w-8 border-r-2 border-t-2 border-slate-300" />

              <div className="absolute bottom-4 left-4 h-8 w-8 border-b-2 border-l-2 border-slate-300" />

              <div className="absolute bottom-4 right-4 h-8 w-8 border-b-2 border-r-2 border-slate-300" />

              <div>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-sm font-black text-slate-500">
                  DWG
                </div>

                <p className="mt-4 text-sm font-black text-slate-800">
                  연결된 도면 미리보기가 없습니다.
                </p>

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  품목 문서 연동이 완료되면
                  PDF 도면이 이 영역에 표시됩니다.
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-left">
              <InformationBox
                label="도면번호"
                value={drawingCode}
              />

              <InformationBox
                label="품목번호"
                value={
                  item.part_number ||
                  "-"
                }
              />
            </div>
          </div>
        </div>

        <footer className="border-t border-slate-200 bg-white px-4 py-3">
          <p className="text-xs leading-5 text-slate-500">
            고객이 배포한 PDF, DWG, STEP
            파일은 문서 연동 후 다운로드할 수
            있습니다.
          </p>
        </footer>
      </div>
    </section>
  );
}

type InformationBoxProps = {
  label: string;
  value: string;
};

function InformationBox({
  label,
  value,
}: InformationBoxProps) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-3">
      <p className="text-[11px] font-bold text-slate-500">
        {label}
      </p>

      <p className="mt-1 truncate text-xs font-black text-slate-800">
        {value}
      </p>
    </div>
  );
}