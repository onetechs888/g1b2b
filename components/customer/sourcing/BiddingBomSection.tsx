"use client";

import type {
  ChangeEvent,
} from "react";

import {
  FileSpreadsheet,
  Plus,
  Trash2,
} from "lucide-react";

import PartFileUploader from "@/components/customer/sourcing/PartFileUploader";

import type {
  SourcingBomItem,
  UploadedPartFile,
} from "@/lib/sourcing/types";

type EditableBomField =
  | "partNo"
  | "partName"
  | "quantity"
  | "material"
  | "memo";

type BiddingBomSectionProps = {
  bomItems: SourcingBomItem[];

  isReadingBom: boolean;

  disabled?: boolean;

  onExcelUpload: (
    event: ChangeEvent<HTMLInputElement>,
  ) => void;

  onItemChange: (
    tempId: string,
    field: EditableBomField,
    value: string | number,
  ) => void;

  onAddItem: () => void;

  onRemoveItem: (
    tempId: string,
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
  onItemChange,
  onAddItem,
  onRemoveItem,
  onFilesChange,
}: BiddingBomSectionProps) {
  const totalPartFileCount =
    bomItems.reduce(
      (total, item) =>
        total + item.files.length,
      0,
    );

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <FileSpreadsheet size={16} />
            </div>

            <div>
              <h2 className="text-base font-black text-slate-950">
                입찰 BOM
              </h2>

              <p className="mt-0.5 text-xs font-semibold text-slate-500">
                Excel 분석 후 생성된 BOM을 검토하고 필요한 항목을 수정할 수 있습니다.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onAddItem}
            disabled={disabled}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 text-xs font-black text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={14} />
            품목 추가
          </button>

          <label
            className={[
              "inline-flex h-9 shrink-0 items-center gap-2 rounded-lg px-3 text-xs font-black text-white transition",
              disabled || isReadingBom
                ? "cursor-not-allowed bg-slate-400"
                : "cursor-pointer bg-slate-900 hover:bg-slate-800",
            ].join(" ")}
          >
            <FileSpreadsheet size={14} />

            {isReadingBom
              ? "BOM 분석 중..."
              : bomItems.length > 0
                ? "BOM Excel 다시 업로드"
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
      </div>

      {bomItems.length === 0 ? (
        <div className="p-5">
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm">
              <FileSpreadsheet size={18} />
            </div>

            <p className="mt-4 text-sm font-black text-slate-700">
              등록된 BOM 품목이 없습니다.
            </p>

            <p className="mt-1 text-xs font-semibold text-slate-500">
              Excel을 업로드하거나 품목을 직접 추가해 주세요.
            </p>

            <p className="mt-3 text-[11px] font-semibold text-slate-400">
              지원 형식: XLSX, XLS
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <table className="w-full min-w-[1500px] border-collapse text-left">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200">
                  <TableHeader className="w-14">
                    No.
                  </TableHeader>

                  <TableHeader className="min-w-44">
                    품번
                  </TableHeader>

                  <TableHeader className="min-w-48">
                    품명
                  </TableHeader>

                  <TableHeader className="w-24">
                    수량
                  </TableHeader>

                  <TableHeader className="min-w-36">
                    재질
                  </TableHeader>

                  <TableHeader className="min-w-52">
                    비고
                  </TableHeader>

                  <TableHeader className="min-w-[360px]">
                    Part 파일
                  </TableHeader>

                  <TableHeader className="w-20 text-center">
                    삭제
                  </TableHeader>
                </tr>
              </thead>

              <tbody>
                {bomItems.map(
                  (item, index) => (
                    <tr
                      key={item.tempId}
                      className="border-b border-slate-100 align-top last:border-b-0 hover:bg-slate-50/60"
                    >
                      <td className="px-3 py-3 text-xs font-black text-slate-500">
                        {index + 1}
                      </td>

                      <td className="px-3 py-2.5">
                        <EditableTextInput
                          value={item.partNo}
                          disabled={disabled}
                          placeholder="품번"
                          onChange={(value) =>
                            onItemChange(
                              item.tempId,
                              "partNo",
                              value,
                            )
                          }
                        />
                      </td>

                      <td className="px-3 py-2.5">
                        <EditableTextInput
                          value={item.partName}
                          disabled={disabled}
                          placeholder="품명"
                          required
                          onChange={(value) =>
                            onItemChange(
                              item.tempId,
                              "partName",
                              value,
                            )
                          }
                        />
                      </td>

                      <td className="px-3 py-2.5">
                        <input
                          type="number"
                          min={1}
                          step={1}
                          value={item.quantity}
                          disabled={disabled}
                          onChange={(event) =>
                            onItemChange(
                              item.tempId,
                              "quantity",
                              event.target.value,
                            )
                          }
                          className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-400"
                        />
                      </td>

                      <td className="px-3 py-2.5">
                        <EditableTextInput
                          value={item.material}
                          disabled={disabled}
                          placeholder="재질"
                          onChange={(value) =>
                            onItemChange(
                              item.tempId,
                              "material",
                              value,
                            )
                          }
                        />
                      </td>

                      <td className="px-3 py-2.5">
                        <textarea
                          rows={2}
                          value={item.memo}
                          disabled={disabled}
                          onChange={(event) =>
                            onItemChange(
                              item.tempId,
                              "memo",
                              event.target.value,
                            )
                          }
                          placeholder="가공 조건, 주의사항 등"
                          className="min-h-[58px] w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold leading-5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-400"
                        />
                      </td>

                      <td className="px-3 py-2.5">
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

                      <td className="px-3 py-2.5 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            onRemoveItem(
                              item.tempId,
                            )
                          }
                          disabled={disabled}
                          title="품목 삭제"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-4">
              <p className="text-xs font-semibold text-slate-600">
                총{" "}
                <span className="font-black text-slate-950">
                  {bomItems.length}
                </span>
                개 품목
              </p>

              <p className="text-xs font-semibold text-slate-600">
                Part 첨부파일{" "}
                <span className="font-black text-slate-950">
                  {totalPartFileCount}
                </span>
                개
              </p>
            </div>

            <p className="text-[11px] font-semibold text-slate-400">
              Excel 분석 결과는 RFQ 제출 전까지 수정할 수 있습니다.
            </p>
          </div>
        </>
      )}
    </section>
  );
}

function EditableTextInput({
  value,
  disabled,
  placeholder,
  required = false,
  onChange,
}: {
  value: string;
  disabled: boolean;
  placeholder: string;
  required?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <input
      type="text"
      value={value}
      disabled={disabled}
      placeholder={placeholder}
      aria-required={required}
      onChange={(event) =>
        onChange(
          event.target.value,
        )
      }
      className={[
        "h-9 w-full rounded-lg border bg-white px-3 text-xs font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-400",
        required && !value.trim()
          ? "border-amber-300"
          : "border-slate-200",
      ].join(" ")}
    />
  );
}

function TableHeader({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`px-3 py-3 text-xs font-black text-slate-600 ${className}`}
    >
      {children}
    </th>
  );
}