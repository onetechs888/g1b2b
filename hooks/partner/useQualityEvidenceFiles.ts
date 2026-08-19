"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  createQualityEvidenceSignedUrl,
  deleteQualityEvidenceFile,
  getQualityEvidenceFiles,
  uploadQualityEvidenceFile,
  type QualityEvidenceFile,
  type QualityFileType,
} from "@/services/partner/qualityFileService";

export function useQualityEvidenceFiles(
  projectId: string | null | undefined,
  qcRequestId: string | null | undefined,
) {
  const [files, setFiles] = useState<QualityEvidenceFile[]>([]);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [uploadingType, setUploadingType] =
    useState<QualityFileType | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!qcRequestId) {
      setFiles([]);
      setPreviewUrls({});
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const nextFiles = await getQualityEvidenceFiles(qcRequestId);
      setFiles(nextFiles);

      const imageFiles = nextFiles.filter((file) => file.file_type === "image");
      const signedEntries = await Promise.all(
        imageFiles.map(async (file) => {
          try {
            const signedUrl = await createQualityEvidenceSignedUrl(file.file_url);
            return [file.id, signedUrl] as const;
          } catch (previewError) {
            console.error("검사사진 미리보기 생성 실패:", previewError);
            return null;
          }
        }),
      );

      setPreviewUrls(
        Object.fromEntries(
          signedEntries.filter(
            (entry): entry is readonly [string, string] => entry !== null,
          ),
        ),
      );
    } catch (err) {
      console.error("검사 증빙자료 조회 실패:", err);
      setFiles([]);
      setPreviewUrls({});
      setError(
        err instanceof Error
          ? err.message
          : "검사 증빙자료를 불러오지 못했습니다.",
      );
    } finally {
      setLoading(false);
    }
  }, [qcRequestId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const uploadFile = useCallback(
    async (fileType: QualityFileType, file: File) => {
      if (!projectId || !qcRequestId) {
        setError("Project 또는 검사요청 정보를 확인할 수 없습니다.");
        return null;
      }

      try {
        setUploadingType(fileType);
        setError(null);

        const uploadedFile = await uploadQualityEvidenceFile({
          projectId,
          qcRequestId,
          fileType,
          file,
          replaceExisting: fileType !== "image",
        });

        await refresh();
        return uploadedFile;
      } catch (err) {
        console.error("검사 증빙자료 업로드 실패:", err);
        setError(
          err instanceof Error
            ? err.message
            : "검사 증빙자료 업로드에 실패했습니다.",
        );
        return null;
      } finally {
        setUploadingType(null);
      }
    },
    [projectId, qcRequestId, refresh],
  );

  const removeFile = useCallback(
    async (fileId: string) => {
      try {
        setDeletingId(fileId);
        setError(null);
        await deleteQualityEvidenceFile(fileId);
        await refresh();
        return true;
      } catch (err) {
        console.error("검사 증빙자료 삭제 실패:", err);
        setError(
          err instanceof Error
            ? err.message
            : "검사 증빙자료 삭제에 실패했습니다.",
        );
        return false;
      } finally {
        setDeletingId(null);
      }
    },
    [refresh],
  );

  const inspectionReport = useMemo(
    () => files.find((file) => file.file_type === "inspection_report") ?? null,
    [files],
  );

  const measurementData = useMemo(
    () => files.find((file) => file.file_type === "measurement_data") ?? null,
    [files],
  );

  const images = useMemo(
    () => files.filter((file) => file.file_type === "image"),
    [files],
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    files,
    inspectionReport,
    measurementData,
    images,
    previewUrls,
    loading,
    uploadingType,
    deletingId,
    error,
    refresh,
    uploadFile,
    removeFile,
    clearError,
  };
}