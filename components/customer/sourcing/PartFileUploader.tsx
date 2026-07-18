"use client";

import {
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";

import {
  formatFileSize,
  getExtension,
  validateFile,
} from "@/lib/sourcing/fileValidation";

import type {
  UploadedPartFile,
} from "@/lib/sourcing/types";

type PartFileUploaderProps = {
  files: UploadedPartFile[];
  onChange: (
    files: UploadedPartFile[],
  ) => void;
  disabled?: boolean;
};

const createFileId = (
  file: File,
): string => {
  return [
    file.name,
    file.size,
    file.lastModified,
    crypto.randomUUID(),
  ].join("-");
};

const createFileIdentity = (
  file: File,
): string => {
  return [
    file.name.toLowerCase(),
    file.size,
    file.lastModified,
  ].join("-");
};

const getFileTypeLabel = (
  fileName: string,
): string => {
  const extension =
    getExtension(fileName);

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

export default function PartFileUploader({
  files,
  onChange,
  disabled = false,
}: PartFileUploaderProps) {
  const inputRef =
    useRef<HTMLInputElement | null>(
      null,
    );

  const [isDragging, setIsDragging] =
    useState(false);

  const addFiles = (
    selectedFiles: File[],
  ) => {
    if (disabled) {
      return;
    }

    const existingIdentities =
      new Set(
        files.map((item) =>
          createFileIdentity(
            item.file,
          ),
        ),
      );

    const validFiles: UploadedPartFile[] =
      [];

    const rejectedMessages: string[] =
      [];

    const duplicatedFiles: string[] =
      [];

    for (const file of selectedFiles) {
      const validationMessage =
        validateFile(file);

      if (validationMessage) {
        rejectedMessages.push(
          `${file.name}: ${validationMessage}`,
        );

        continue;
      }

      const identity =
        createFileIdentity(file);

      if (
        existingIdentities.has(identity)
      ) {
        duplicatedFiles.push(
          file.name,
        );

        continue;
      }

      existingIdentities.add(identity);

      validFiles.push({
  id: createFileId(file),

  file,

  fileName: file.name,

  fileSize: file.size,

  mimeType:
    file.type ||
    "application/octet-stream",

  extension:
    getExtension(file.name),

  status: "ready",

  uploadedAt: new Date(),
});
    }

    if (
      rejectedMessages.length > 0 ||
      duplicatedFiles.length > 0
    ) {
      const messages: string[] = [];

      if (
        rejectedMessages.length > 0
      ) {
        messages.push(
          "추가하지 못한 파일",
          ...rejectedMessages,
        );
      }

      if (
        duplicatedFiles.length > 0
      ) {
        if (messages.length > 0) {
          messages.push("");
        }

        messages.push(
          "이미 등록된 파일",
          ...duplicatedFiles,
        );
      }

      alert(messages.join("\n"));
    }

    if (validFiles.length === 0) {
      return;
    }

    onChange([
      ...files,
      ...validFiles,
    ]);
  };

  const handleFileSelect = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const selectedFiles =
      Array.from(
        event.target.files ?? [],
      );

    addFiles(selectedFiles);

    event.target.value = "";
  };

  const handleDrop = (
    event: DragEvent<HTMLDivElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    setIsDragging(false);

    if (disabled) {
      return;
    }

    const droppedFiles =
      Array.from(
        event.dataTransfer.files,
      );

    addFiles(droppedFiles);
  };

  const handleDragEnter = (
    event: DragEvent<HTMLDivElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragOver = (
    event: DragEvent<HTMLDivElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    if (!disabled) {
      event.dataTransfer.dropEffect =
        "copy";
    }
  };

  const handleDragLeave = (
    event: DragEvent<HTMLDivElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const currentTarget =
      event.currentTarget;

    const relatedTarget =
      event.relatedTarget;

    if (
      relatedTarget instanceof Node &&
      currentTarget.contains(
        relatedTarget,
      )
    ) {
      return;
    }

    setIsDragging(false);
  };

  const handleRemoveFile = (
    fileId: string,
  ) => {
    if (disabled) {
      return;
    }

    onChange(
      files.filter(
        (file) =>
          file.id !== fileId,
      ),
    );
  };

  const openFileDialog = () => {
    if (disabled) {
      return;
    }

    inputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <div
        onDragEnter={
          handleDragEnter
        }
        onDragOver={
          handleDragOver
        }
        onDragLeave={
          handleDragLeave
        }
        onDrop={handleDrop}
        className={[
          "rounded-md border p-3 transition",
          disabled
            ? "cursor-not-allowed border-slate-200 bg-slate-100 opacity-70"
            : "cursor-pointer",
          !disabled && isDragging
            ? "border-slate-900 bg-slate-100"
            : "",
          !disabled && !isDragging
            ? "border-dashed border-slate-300 bg-slate-50 hover:border-slate-500"
            : "",
        ].join(" ")}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.dwg,.dxf,.step,.stp"
          onChange={
            handleFileSelect
          }
          disabled={disabled}
          className="hidden"
        />

        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-slate-700">
              Part 도면 및 기술파일
            </p>

            <p className="mt-1 text-[11px] text-slate-500">
              PDF, DWG, DXF, STEP,
              STP · 파일당 최대 100MB
            </p>
          </div>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              openFileDialog();
            }}
            disabled={disabled}
            className="h-8 shrink-0 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            파일 추가
          </button>
        </div>

        {isDragging && (
          <div className="mt-3 rounded-md border border-slate-900 bg-white px-3 py-3 text-center">
            <p className="text-xs font-semibold text-slate-900">
              여기에 파일을 놓아주세요.
            </p>
          </div>
        )}
      </div>

      {files.length > 0 && (
        <div className="space-y-1.5">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-3 py-2"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className="inline-flex h-6 min-w-11 shrink-0 items-center justify-center rounded bg-slate-900 px-1.5 text-[10px] font-bold text-white">
                  {getFileTypeLabel(
                    file.fileName,
                  )}
                </span>

                <div className="min-w-0">
                  <p
                    title={file.fileName}
                    className="truncate text-xs font-medium text-slate-800"
                  >
                    {file.fileName}
                  </p>

                  <p className="mt-0.5 text-[10px] text-slate-500">
                    {formatFileSize(
                      file.fileSize,
                    )}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <span className="text-[10px] font-semibold text-emerald-700">
                  준비완료
                </span>

                <button
                  type="button"
                  onClick={() =>
                    handleRemoveFile(
                      file.id,
                    )
                  }
                  disabled={disabled}
                  aria-label={`${file.fileName} 삭제`}
                  className="inline-flex h-6 w-6 items-center justify-center rounded border border-slate-200 text-sm text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}