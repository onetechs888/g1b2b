"use client";

import { useRef } from "react";

import UploadedFileList from "./UploadedFileList";

import type {
  UploadedCommonFile,
} from "@/lib/sourcing/types";

type CommonFileUploaderProps = {
  files: UploadedCommonFile[];
  disabled?: boolean;

  onUpload: (
    files: FileList,
  ) => void;

  onRemove: (
    fileId: string,
  ) => void;
};

export default function CommonFileUploader({
  files,
  disabled = false,
  onUpload,
  onRemove,
}: CommonFileUploaderProps) {
  const inputRef =
    useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (!event.target.files) return;

    onUpload(event.target.files);

    event.target.value = "";
  };

  return (
    <section className="space-y-5 rounded-lg border border-slate-200 bg-white p-6">

      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          공통 첨부파일
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          프로젝트 전체에서 사용하는
          PDF / DWG / STEP 파일을 등록합니다.
        </p>
      </div>

      <div
        className="flex min-h-[170px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 transition hover:border-blue-400 hover:bg-blue-50"
        onClick={handleClick}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="mb-4 h-12 w-12 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 16V4m0 0l-4 4m4-4l4 4M4 20h16"
          />
        </svg>

        <p className="text-base font-semibold text-slate-700">
          파일을 선택하거나
          클릭하여 업로드
        </p>

        <p className="mt-2 text-sm text-slate-500">
          PDF / DWG / STEP(STP)
        </p>

        <p className="mt-1 text-xs text-slate-400">
          여러 파일을 동시에 선택할 수 있습니다.
        </p>
      </div>

      <input
        ref={inputRef}
        hidden
        multiple
        type="file"
        disabled={disabled}
        accept=".pdf,.dwg,.step,.stp"
        onChange={handleChange}
      />

      <UploadedFileList
        files={files}
        disabled={disabled}
        onRemove={onRemove}
      />
    </section>
  );
}