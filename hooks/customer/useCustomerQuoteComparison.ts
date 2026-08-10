"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  getCustomerQuoteComparison,
  type CustomerQuoteComparison,
} from "@/services/customer/quoteService";

export function useCustomerQuoteComparison(
  biddingRequestId: string,
) {
  const [
    comparison,
    setComparison,
  ] =
    useState<CustomerQuoteComparison | null>(
      null,
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const loadComparison =
    useCallback(async () => {
      if (!biddingRequestId) {
        setComparison(null);
        setLoading(false);
        setError(
          "RFQ ID가 필요합니다.",
        );
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const result =
          await getCustomerQuoteComparison(
            biddingRequestId,
          );

        setComparison(result);
      } catch (err) {
        console.error(
          "Customer RFQ 견적비교 조회 실패:",
          err,
        );

        setComparison(null);

        setError(
          err instanceof Error
            ? err.message
            : "RFQ 견적정보를 불러오지 못했습니다.",
        );
      } finally {
        setLoading(false);
      }
    }, [biddingRequestId]);

  useEffect(() => {
    void loadComparison();
  }, [loadComparison]);

  return {
    comparison,

    loading,

    error,

    refresh: loadComparison,
  };
}