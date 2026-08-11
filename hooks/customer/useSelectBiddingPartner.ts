"use client";

import {
  useCallback,
  useState,
} from "react";

import {
  selectBiddingPartner,
  type SelectBiddingPartnerResult,
} from "@/services/customer/quoteService";

export function useSelectBiddingPartner() {
  const [selecting, setSelecting] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const selectPartner = useCallback(
    async (
      biddingRequestId: string,
      quoteId: string,
    ): Promise<SelectBiddingPartnerResult | null> => {
      try {
        setSelecting(true);
        setError(null);

        const result =
          await selectBiddingPartner(
            biddingRequestId,
            quoteId,
          );

        return result;
      } catch (err) {
        console.error(
          "Customer 업체 선정 실패:",
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : "업체 선정에 실패했습니다.",
        );

        return null;
      } finally {
        setSelecting(false);
      }
    },
    [],
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    selecting,
    error,
    selectPartner,
    clearError,
  };
}