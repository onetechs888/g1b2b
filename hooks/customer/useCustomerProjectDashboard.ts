"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  getCustomerProjectDashboard,
  type CustomerProjectDashboard,
} from "@/services/customer/projectService";

export function useCustomerProjectDashboard() {
  const [
    dashboard,
    setDashboard,
  ] =
    useState<CustomerProjectDashboard | null>(
      null,
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );

  const loadDashboard =
    useCallback(async () => {
      try {
        setLoading(true);
        setError(null);

        const result =
          await getCustomerProjectDashboard();

        setDashboard(result);
      } catch (err) {
        console.error(
          "Customer 프로젝트 Dashboard 조회 실패:",
          err,
        );

        setDashboard(null);

        setError(
          err instanceof Error
            ? err.message
            : "프로젝트 현황을 불러오지 못했습니다.",
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  return {
    dashboard,
    loading,
    error,
    refresh: loadDashboard,
  };
}