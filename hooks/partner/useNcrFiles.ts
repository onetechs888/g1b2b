"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getNcrFiles,
  uploadNcrFile,
  type NcrAttachmentFile,
  type NcrFileType,
} from "@/services/partner/ncrFileService";

export function useNcrFiles(
  projectId: string | null | undefined,
  ncrReportId: string | null | undefined,
) {
  const [files, setFiles] = useState<NcrAttachmentFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingType, setUploadingType] = useState<NcrFileType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!ncrReportId) {
      setFiles([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setFiles(await getNcrFiles(ncrReportId));
    } catch (err) {
      console.error("NCR 첨부자료 조회 실패:", err);
      setFiles([]);
      setError(err instanceof Error ? err.message : "NCR 첨부자료를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [ncrReportId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const uploadFile = useCallback(
    async (fileType: NcrFileType, file: File) => {
      if (!projectId || !ncrReportId) {
        setError("Project 또는 NCR 정보를 확인할 수 없습니다.");
        return null;
      }

      try {
        setUploadingType(fileType);
        setError(null);
        const uploaded = await uploadNcrFile({
          projectId,
          ncrReportId,
          fileType,
          file,
        });
        await refresh();
        return uploaded;
      } catch (err) {
        console.error("NCR 첨부자료 업로드 실패:", err);
        setError(err instanceof Error ? err.message : "NCR 첨부자료 업로드에 실패했습니다.");
        return null;
      } finally {
        setUploadingType(null);
      }
    },
    [ncrReportId, projectId, refresh],
  );

  const byType = useMemo(
    () => ({
      ncr_report: files.find((file) => file.file_type === "ncr_report") ?? null,
      root_cause_report:
        files.find((file) => file.file_type === "root_cause_report") ?? null,
      corrective_action_report:
        files.find((file) => file.file_type === "corrective_action_report") ?? null,
    }),
    [files],
  );

  return { files, byType, loading, uploadingType, error, refresh, uploadFile };
}