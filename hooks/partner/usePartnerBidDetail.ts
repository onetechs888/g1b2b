"use client";

import { useCallback, useEffect, useState } from "react";

import {
  getPartnerBiddingDetail,
  PartnerBiddingDetail,
} from "@/services/partner/biddingService";

type UsePartnerBidDetailResult = {
  biddingDetail: PartnerBiddingDetail | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export function usePartnerBidDetail(
  biddingRequestId: string,
): UsePartnerBidDetailResult {
  const [biddingDetail, setBiddingDetail] =
    useState<PartnerBiddingDetail | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const load = useCallback(async () => {
    if (!biddingRequestId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result =
        await getPartnerBiddingDetail(
          biddingRequestId,
        );

      setBiddingDetail(result);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "입찰정보를 불러오지 못했습니다.",
      );
    } finally {
      setLoading(false);
    }
  }, [biddingRequestId]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    biddingDetail,
    loading,
    error,
    refresh: load,
  };
}