import { supabase } from "@/lib/supabase";

export const QUALITY_FILE_BUCKET = "quality-files";
export const QUALITY_FILE_RELATED_TYPE = "qc_request";
export const QUALITY_FILE_MAX_SIZE = 50 * 1024 * 1024;

export type QualityFileType =
  | "inspection_report"
  | "measurement_data"
  | "image";

export type QualityEvidenceFile = {
  id: string;
  related_type: string;
  related_id: string;
  file_type: QualityFileType;
  file_name: string | null;
  file_url: string;
  uploaded_by: string | null;
  created_at: string | null;
};

type UploadQualityEvidenceParams = {
  projectId: string;
  qcRequestId: string;
  fileType: QualityFileType;
  file: File;
  replaceExisting?: boolean;
};

const ALLOWED_EXTENSIONS: Record<QualityFileType, string[]> = {
  inspection_report: ["pdf"],
  measurement_data: ["xls", "xlsx"],
  image: ["jpg", "jpeg", "png", "webp"],
};

const ALLOWED_MIME_TYPES: Record<QualityFileType, string[]> = {
  inspection_report: ["application/pdf"],
  measurement_data: [
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ],
  image: ["image/jpeg", "image/png", "image/webp"],
};

function getFileExtension(fileName: string) {
  const parts = fileName.toLowerCase().split(".");
  return parts.length > 1 ? parts.at(-1) ?? "" : "";
}

function sanitizeFileName(fileName: string) {
  const normalized = fileName.normalize("NFKC");
  const sanitized = normalized
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  return sanitized || "file";
}

function validateFile(file: File, fileType: QualityFileType) {
  if (file.size <= 0) {
    throw new Error("빈 파일은 업로드할 수 없습니다.");
  }

  if (file.size > QUALITY_FILE_MAX_SIZE) {
    throw new Error("파일 크기는 50MB를 초과할 수 없습니다.");
  }

  const extension = getFileExtension(file.name);
  const extensionAllowed = ALLOWED_EXTENSIONS[fileType].includes(extension);
  const mimeAllowed =
    !file.type || ALLOWED_MIME_TYPES[fileType].includes(file.type);

  if (!extensionAllowed || !mimeAllowed) {
    if (fileType === "inspection_report") {
      throw new Error("검사성적서는 PDF 파일만 업로드할 수 있습니다.");
    }

    if (fileType === "measurement_data") {
      throw new Error("측정데이터는 XLS 또는 XLSX 파일만 업로드할 수 있습니다.");
    }

    throw new Error("검사사진은 JPG, PNG 또는 WEBP 파일만 업로드할 수 있습니다.");
  }
}

async function getCurrentUserId() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!user) {
    throw new Error("로그인이 필요합니다.");
  }

  return user.id;
}

function createStoragePath({
  projectId,
  qcRequestId,
  fileType,
  fileName,
}: {
  projectId: string;
  qcRequestId: string;
  fileType: QualityFileType;
  fileName: string;
}) {
  const uniqueName = `${crypto.randomUUID()}-${sanitizeFileName(fileName)}`;

  return `qc/${projectId}/${qcRequestId}/${fileType}/${uniqueName}`;
}

export async function getQualityEvidenceFiles(
  qcRequestId: string,
): Promise<QualityEvidenceFile[]> {
  if (!qcRequestId) {
    return [];
  }

  const { data, error } = await supabase
    .from("files")
    .select(
      "id, related_type, related_id, file_type, file_name, file_url, uploaded_by, created_at",
    )
    .eq("related_type", QUALITY_FILE_RELATED_TYPE)
    .eq("related_id", qcRequestId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as QualityEvidenceFile[];
}

export async function uploadQualityEvidenceFile({
  projectId,
  qcRequestId,
  fileType,
  file,
  replaceExisting = false,
}: UploadQualityEvidenceParams): Promise<QualityEvidenceFile> {
  if (!projectId) {
    throw new Error("Project ID가 필요합니다.");
  }

  if (!qcRequestId) {
    throw new Error("검사요청 ID가 필요합니다.");
  }

  validateFile(file, fileType);

  const userId = await getCurrentUserId();
  const storagePath = createStoragePath({
    projectId,
    qcRequestId,
    fileType,
    fileName: file.name,
  });

  const { error: uploadError } = await supabase.storage
    .from(QUALITY_FILE_BUCKET)
    .upload(storagePath, file, {
      cacheControl: "3600",
      contentType: file.type || undefined,
      upsert: false,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data: insertedFile, error: insertError } = await supabase
    .from("files")
    .insert({
      related_type: QUALITY_FILE_RELATED_TYPE,
      related_id: qcRequestId,
      file_type: fileType,
      file_name: file.name,
      file_url: storagePath,
      uploaded_by: userId,
    })
    .select(
      "id, related_type, related_id, file_type, file_name, file_url, uploaded_by, created_at",
    )
    .single();

  if (insertError || !insertedFile) {
    await supabase.storage.from(QUALITY_FILE_BUCKET).remove([storagePath]);

    throw insertError ?? new Error("업로드 파일 정보를 저장하지 못했습니다.");
  }

  const uploadedFile = insertedFile as QualityEvidenceFile;

  if (replaceExisting) {
    const { data: oldFiles, error: oldFilesError } = await supabase
      .from("files")
      .select("id, file_url")
      .eq("related_type", QUALITY_FILE_RELATED_TYPE)
      .eq("related_id", qcRequestId)
      .eq("file_type", fileType)
      .neq("id", uploadedFile.id);

    if (oldFilesError) {
      throw oldFilesError;
    }

    for (const oldFile of oldFiles ?? []) {
      const { error: storageRemoveError } = await supabase.storage
        .from(QUALITY_FILE_BUCKET)
        .remove([oldFile.file_url]);

      if (storageRemoveError) {
        console.error("기존 품질파일 Storage 삭제 실패:", storageRemoveError);
        continue;
      }

      const { error: rowDeleteError } = await supabase
        .from("files")
        .delete()
        .eq("id", oldFile.id);

      if (rowDeleteError) {
        console.error("기존 품질파일 DB 삭제 실패:", rowDeleteError);
      }
    }
  }

  return uploadedFile;
}

export async function deleteQualityEvidenceFile(fileId: string) {
  if (!fileId) {
    throw new Error("삭제할 파일 ID가 필요합니다.");
  }

  const { data: targetFile, error: selectError } = await supabase
    .from("files")
    .select("id, file_url")
    .eq("id", fileId)
    .eq("related_type", QUALITY_FILE_RELATED_TYPE)
    .single();

  if (selectError) {
    throw selectError;
  }

  const { error: storageError } = await supabase.storage
    .from(QUALITY_FILE_BUCKET)
    .remove([targetFile.file_url]);

  if (storageError) {
    throw storageError;
  }

  const { error: deleteError } = await supabase
    .from("files")
    .delete()
    .eq("id", targetFile.id);

  if (deleteError) {
    throw deleteError;
  }
}

export async function createQualityEvidenceSignedUrl(
  storagePath: string,
  expiresInSeconds = 3600,
) {
  if (!storagePath) {
    throw new Error("파일 경로가 필요합니다.");
  }

  const { data, error } = await supabase.storage
    .from(QUALITY_FILE_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error) {
    throw error;
  }

  return data.signedUrl;
}