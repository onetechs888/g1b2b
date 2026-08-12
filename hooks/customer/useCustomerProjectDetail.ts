"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  getCustomerProjectDetail,
  type CustomerProjectDetail,
} from "@/services/customer/projectService";

export function useCustomerProjectDetail(
  projectId: string,
) {
  const [detail, setDetail] =
    useState<CustomerProjectDetail | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const loadDetail = useCallback(async () => {
    if (!projectId) {
      setDetail(null);
      setError("Project ID가 필요합니다.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result =
        await getCustomerProjectDetail(projectId);

      setDetail(result);
    } catch (err) {
      console.error(
        "Customer 프로젝트 상세 조회 실패:",
        err,
      );

      setDetail(null);

      setError(
        err instanceof Error
          ? err.message
          : "프로젝트 상세정보를 불러오지 못했습니다.",
      );
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  return {
    detail,
    loading,
    error,
    refresh: loadDetail,
  };
}