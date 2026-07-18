import {
  SourcingFileExtension,
} from "./types";

export const MAX_FILE_SIZE =
  100 * 1024 * 1024;

export const ACCEPT_EXTENSIONS = [
  "pdf",
  "dwg",
  "dxf",
  "step",
  "stp",
];

export function getExtension(
  fileName: string,
): SourcingFileExtension {
  const ext =
    fileName
      .split(".")
      .pop()
      ?.toLowerCase() ?? "";

  switch (ext) {
    case "pdf":
      return "pdf";

    case "dwg":
      return "dwg";

    case "dxf":
      return "dxf";

    case "step":
      return "step";

    case "stp":
      return "stp";

    default:
      return "unknown";
  }
}

export function validateFile(
  file: File,
): string | null {
  const extension =
    getExtension(file.name);

  if (extension === "unknown") {
    return "지원하지 않는 파일 형식입니다.";
  }

  if (
    file.size > MAX_FILE_SIZE
  ) {
    return "100MB를 초과했습니다.";
  }

  return null;
}

export function formatFileSize(
  size: number,
): string {
  if (size < 1024)
    return `${size} B`;

  if (size < 1024 * 1024)
    return `${(
      size / 1024
    ).toFixed(1)} KB`;

  return `${(
    size /
    1024 /
    1024
  ).toFixed(1)} MB`;
}