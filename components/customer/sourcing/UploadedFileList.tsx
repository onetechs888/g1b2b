"use client";

import {
  formatFileSize,
} from "@/lib/sourcing/fileValidation";

import type {
  UploadedCommonFile,
} from "@/lib/sourcing/types";

type UploadedFileListProps = {
  files: UploadedCommonFile[];
  disabled?: boolean;

  onRemove: (
    fileId: string,
  ) => void;
};

const getFileTypeLabel = (
  extension: UploadedCommonFile["extension"],
): string => {
  switch (extension) {
    case "pdf":
      return "PDF";

    case "dwg":
      return "DWG";

    case "dxf":
      return "DXF";

    case "step":
      return "STEP";

    case "stp":
      return "STP";

    default:
      return "FILE";
  }
};

const getStatusLabel = (
  status: UploadedCommonFile["status"],
): string => {
  switch (status) {
    case "ready":
      return "업로드 준비";

    case "uploading":
      return "업로드 중";

    case "uploaded":
      return "저장 완료";

    case "failed":
      return "업로드 실패";

    default:
      return "-";
  }
};

const getStatusClassName = (
  status: UploadedCommonFile["status"],
): string => {
  switch (status) {
    case "ready":
      return "text-emerald-700";

    case "uploading":
      return "text-blue-700";

    case "uploaded":
      return "text-slate-700";

    case "failed":
      return "text-red-600";

    default:
      return "text-slate-500";
  }
};

const formatUploadedAt = (
  date: Date,
): string => {
  return new Intl.DateTimeFormat(
    "ko-KR",
    {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(date);
};

export default function UploadedFileList({
  files,
  disabled = false,
  onRemove,
}: UploadedFileListProps) {
  if (files.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
        <p className="text-sm font-medium text-slate-700">
          등록된 공통 첨부파일이 없습니다.
        </p>

        <p className="mt-1 text-xs text-slate-500">
          왼쪽 업로드 영역에서 파일을 추가해
          주세요.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left">
          <thead className="bg-slate-50">
            <tr className="border-b border-slate-200">
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                파일명
              </th>

              <th className="w-24 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                유형
              </th>

              <th className="w-28 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                크기
              </th>

              <th className="w-36 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                상태
              </th>

              <th className="w-44 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                등록일
              </th>

              <th className="w-20 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                관리
              </th>
            </tr>
          </thead>

          <tbody>
            {files.map((file) => (
              <tr
                key={file.id}
                className="border-b border-slate-100 last:border-b-0"
              >
                <td className="px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="inline-flex h-8 min-w-12 shrink-0 items-center justify-center rounded-md bg-slate-900 px-2 text-[10px] font-bold text-white">
                      {getFileTypeLabel(
                        file.extension,
                      )}
                    </span>

                    <div className="min-w-0">
                      <p
                        title={file.fileName}
                        className="truncate text-sm font-medium text-slate-900"
                      >
                        {file.fileName}
                      </p>

                      {file.errorMessage && (
                        <p className="mt-1 text-xs text-red-600">
                          {file.errorMessage}
                        </p>
                      )}
                    </div>
                  </div>
                </td>

                <td className="px-4 py-3 text-sm text-slate-700">
                  {getFileTypeLabel(
                    file.extension,
                  )}
                </td>

                <td className="px-4 py-3 text-sm text-slate-700">
                  {formatFileSize(
                    file.fileSize,
                  )}
                </td>

                <td className="px-4 py-3">
                  <span
                    className={[
                      "text-xs font-semibold",
                      getStatusClassName(
                        file.status,
                      ),
                    ].join(" ")}
                  >
                    {getStatusLabel(
                      file.status,
                    )}
                  </span>
                </td>

                <td className="px-4 py-3 text-sm text-slate-600">
                  {formatUploadedAt(
                    file.uploadedAt,
                  )}
                </td>

                <td className="px-4 py-3 text-center">
                  <button
                    type="button"
                    onClick={() =>
                      onRemove(
                        file.id,
                      )
                    }
                    disabled={disabled}
                    aria-label={`${file.fileName} 삭제`}
                    className="inline-flex h-8 items-center justify-center rounded-md border border-slate-200 px-3 text-xs font-medium text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-sm text-slate-600">
          등록 파일
          <span className="ml-1 font-semibold text-slate-950">
            {files.length}
          </span>
          개
        </p>

        <p className="text-xs text-slate-500">
          프로젝트 전체에 공통 적용됩니다.
        </p>
      </div>
    </div>
  );
}