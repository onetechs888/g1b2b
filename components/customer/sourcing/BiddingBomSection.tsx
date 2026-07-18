"use client";

import type {
  ChangeEvent,
} from "react";

import PartFileUploader from "@/components/customer/sourcing/PartFileUploader";

import type {
  SourcingBomItem,
  UploadedPartFile,
} from "@/lib/sourcing/types";

type BiddingBomSectionProps = {
  bomItems: SourcingBomItem[];

  isReadingBom: boolean;

  disabled?: boolean;

  onExcelUpload: (
    event: ChangeEvent<HTMLInputElement>,
  ) => void;

  onFilesChange: (
    tempId: string,
    files: UploadedPartFile[],
  ) => void;
};

export default function BiddingBomSection({
  bomItems,
  isReadingBom,
  disabled = false,
  onExcelUpload,
  onFilesChange,
}: BiddingBomSectionProps) {
  const totalPartFileCount =
    bomItems.reduce(
      (total, item) =>
        total + item.files.length,
      0,
    );

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-4">
        <div>
          <h2 className="text-base font-semibold text-slate-950">
            입찰 BOM
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            BOM Excel을 업로드하면 Smart BOM
            Engine이 시트와 헤더를 분석하여
            품목을 생성합니다.
          </p>
        </div>

        <label
          className={[
            "inline-flex h-10 shrink-0 items-center rounded-md px-4 text-sm font-semibold text-white transition",
            disabled || isReadingBom
              ? "cursor-not-allowed bg-slate-400"
              : "cursor-pointer bg-slate-900 hover:bg-slate-800",
          ].join(" ")}
        >
          {isReadingBom
            ? "BOM 분석 중..."
            : "BOM Excel 업로드"}

          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={onExcelUpload}
            disabled={
              disabled ||
              isReadingBom
            }
            className="hidden"
          />
        </label>
      </div>

      {bomItems.length === 0 ? (
        <div className="p-6">
          <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
            <p className="text-sm font-medium text-slate-700">
              등록된 BOM 품목이 없습니다.
            </p>

            <p className="mt-1 text-sm text-slate-500">
              품번, 품명, 수량이 포함된 Excel
              파일을 업로드해 주세요.
            </p>

            <p className="mt-3 text-xs text-slate-400">
              지원 형식: XLSX, XLS
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1540px] border-collapse text-left">
            <thead className="bg-slate-50">
              <tr className="border-b border-slate-200">
                <th className="w-16 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  No.
                </th>

                <th className="w-24 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Excel 행
                </th>

                <th className="min-w-48 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  품번
                </th>

                <th className="min-w-44 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  품명
                </th>

                <th className="w-24 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  수량
                </th>

                <th className="min-w-32 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  재질
                </th>

                <th className="min-w-36 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  규격
                </th>

                <th className="min-w-[440px] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Part 파일
                </th>
              </tr>
            </thead>

            <tbody>
              {bomItems.map(
                (item, index) => (
                  <tr
                    key={item.tempId}
                    className="border-b border-slate-100 align-top last:border-b-0"
                  >
                    <td className="px-4 py-4 text-sm text-slate-500">
                      {index + 1}
                    </td>

                    <td className="px-4 py-4 text-sm text-slate-500">
                      {
                        item.sourceRowNumber
                      }
                    </td>

                    <td className="px-4 py-4 text-sm font-medium text-slate-900">
                      {item.partNo || "-"}
                    </td>

                    <td className="px-4 py-4 text-sm text-slate-800">
                      {item.partName || "-"}
                    </td>

                    <td className="px-4 py-4 text-sm text-slate-800">
                      {item.quantity}
                    </td>

                    <td className="px-4 py-4 text-sm text-slate-800">
                      {item.material || "-"}
                    </td>

                    <td className="px-4 py-4 text-sm text-slate-800">
                      {item.specification ||
                        "-"}
                    </td>

                    <td className="px-4 py-3">
                      <PartFileUploader
                        files={item.files}
                        disabled={disabled}
                        onChange={(files) =>
                          onFilesChange(
                            item.tempId,
                            files,
                          )
                        }
                      />
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>

          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3">
            <p className="text-sm text-slate-600">
              총{" "}
              <span className="font-semibold text-slate-950">
                {bomItems.length}
              </span>
              개 품목
            </p>

            <p className="text-sm text-slate-600">
              Part 첨부파일{" "}
              <span className="font-semibold text-slate-950">
                {totalPartFileCount}
              </span>
              개
            </p>
          </div>
        </div>
      )}
    </section>
  );
}