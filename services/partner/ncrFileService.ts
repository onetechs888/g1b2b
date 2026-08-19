import { supabase } from "@/lib/supabase";

export const NCR_FILE_BUCKET = "quality-files";
export const NCR_FILE_RELATED_TYPE = "ncr_report";
export const NCR_FILE_MAX_SIZE = 50 * 1024 * 1024;

export type NcrFileType =
  | "ncr_report"
  | "root_cause_report"
  | "corrective_action_report";

export type NcrAttachmentFile = {
  id: string;
  related_type: string;
  related_id: string;
  file_type: NcrFileType;
  file_name: string | null;
  file_url: string;
  uploaded_by: string | null;
  created_at: string | null;
};

type UploadNcrFileParams = {
  projectId: string;
  ncrReportId: string;
  fileType: NcrFileType;
  file: File;
};

function sanitizeFileName(fileName: string) {
  return (
    fileName
      .normalize("NFKC")
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "") || "file.pdf"
  );
}

function validatePdf(file: File) {
  const extension = file.name.toLowerCase().split(".").at(-1) ?? "";

  if (file.size <= 0) throw new Error("빈 파일은 업로드할 수 없습니다.");
  if (file.size > NCR_FILE_MAX_SIZE) {
    throw new Error("파일 크기는 50MB를 초과할 수 없습니다.");
  }
  if (extension !== "pdf" || (file.type && file.type !== "application/pdf")) {
    throw new Error("NCR 첨부자료는 PDF 파일만 업로드할 수 있습니다.");
  }
}

async function getCurrentUserId() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;
  if (!user) throw new Error("로그인이 필요합니다.");
  return user.id;
}

export async function getNcrFiles(ncrReportId: string) {
  if (!ncrReportId) return [];

  const { data, error } = await supabase
    .from("files")
    .select(
      "id, related_type, related_id, file_type, file_name, file_url, uploaded_by, created_at",
    )
    .eq("related_type", NCR_FILE_RELATED_TYPE)
    .eq("related_id", ncrReportId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as NcrAttachmentFile[];
}

export async function uploadNcrFile({
  projectId,
  ncrReportId,
  fileType,
  file,
}: UploadNcrFileParams) {
  if (!projectId) throw new Error("Project ID가 필요합니다.");
  if (!ncrReportId) throw new Error("NCR ID가 필요합니다.");

  validatePdf(file);
  const userId = await getCurrentUserId();
  const storagePath = `ncr/${projectId}/${ncrReportId}/${fileType}/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;

  const { error: uploadError } = await supabase.storage
    .from(NCR_FILE_BUCKET)
    .upload(storagePath, file, {
      cacheControl: "3600",
      contentType: file.type || "application/pdf",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Storage 업로드 실패: ${uploadError.message}`);
  }

  const { data: insertedFile, error: insertError } = await supabase
    .from("files")
    .insert({
      related_type: NCR_FILE_RELATED_TYPE,
      related_id: ncrReportId,
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
    await supabase.storage.from(NCR_FILE_BUCKET).remove([storagePath]);
    throw new Error(
      `파일정보 저장 실패: ${insertError?.message ?? "파일 정보를 저장하지 못했습니다."}`,
    );
  }

  const uploadedFile = insertedFile as NcrAttachmentFile;
  const { data: oldFiles, error: oldFilesError } = await supabase
    .from("files")
    .select("id, file_url")
    .eq("related_type", NCR_FILE_RELATED_TYPE)
    .eq("related_id", ncrReportId)
    .eq("file_type", fileType)
    .neq("id", uploadedFile.id);

  if (oldFilesError) throw oldFilesError;

  for (const oldFile of oldFiles ?? []) {
    const { error: removeError } = await supabase.storage
      .from(NCR_FILE_BUCKET)
      .remove([oldFile.file_url]);

    if (!removeError) {
      await supabase.from("files").delete().eq("id", oldFile.id);
    }
  }

  return uploadedFile;
}