"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  getPartnerQuoteList,
  type PartnerQuoteListItem,
} from "@/services/partner/biddingService";

type UsePartnerQuotesResult = {
  quotes: PartnerQuoteListItem[];
  isLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

function getErrorMessage(
  error: unknown,
): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "견적목록을 불러오지 못했습니다.";
}

export function usePartnerQuotes(): UsePartnerQuotesResult {
  const [quotes, setQuotes] =
    useState<PartnerQuoteListItem[]>(
      [],
    );

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const loadQuotes =
    useCallback(async () => {
      try {
        setIsLoading(true);
        setError(null);

        const result =
          await getPartnerQuoteList();

        setQuotes(result);
      } catch (loadError) {
        console.error(
          "파트너 견적목록 조회 실패:",
          loadError,
        );

        setQuotes([]);

        setError(
          getErrorMessage(
            loadError,
          ),
        );
      } finally {
        setIsLoading(false);
      }
    }, []);

  useEffect(() => {
    void loadQuotes();
  }, [loadQuotes]);

  return {
    quotes,
    isLoading,
    error,
    reload: loadQuotes,
  };
}