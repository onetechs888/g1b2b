"use client";

import { useCallback, useEffect, useState } from "react";

import {
  getOpenBiddingRequests,
  type PartnerOpenBiddingRequest,
} from "../../services/partner/biddingService";

export function usePartnerBids() {
  const [bids, setBids] = useState<
    PartnerOpenBiddingRequest[]
  >([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const loadBids = useCallback(
    async () => {
      try {
        setIsLoading(true);
        setError(null);

        const result =
          await getOpenBiddingRequests();

        setBids(result);
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : "입찰목록을 불러오지 못했습니다.",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    loadBids();
  }, [loadBids]);

  return {
    bids,
    isLoading,
    error,
    reload: loadBids,
  };
}