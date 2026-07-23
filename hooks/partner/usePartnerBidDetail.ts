"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  getPartnerBiddingDetail,
  getPartnerQuote,
  PartnerBiddingDetail,
  PartnerQuote,
  SavePartnerQuoteItemInput,
  savePartnerQuoteItem,
  savePartnerQuoteMemo,
  submitPartnerQuote,
} from "@/services/partner/biddingService";

type UsePartnerBidDetailResult = {
  biddingDetail: PartnerBiddingDetail | null;
  quote: PartnerQuote | null;

  loading: boolean;
  quoteLoading: boolean;
  quoteSaving: boolean;
  quoteSubmitting: boolean;

  error: string | null;
  quoteError: string | null;

  refresh: () => Promise<void>;
  refreshQuote: () => Promise<void>;
  refreshAll: () => Promise<void>;

  saveItem: (
    item: SavePartnerQuoteItemInput,
  ) => Promise<PartnerQuote>;

  saveMemo: (
    memo: string | null,
  ) => Promise<PartnerQuote>;

  submitQuote: () => Promise<PartnerQuote>;

  clearError: () => void;
  clearQuoteError: () => void;
};

function getErrorMessage(
  error: unknown,
  fallbackMessage: string,
): string {
  if (error instanceof Error) {
    return error.message;
  }

  return fallbackMessage;
}

export function usePartnerBidDetail(
  biddingRequestId: string,
): UsePartnerBidDetailResult {
  const [biddingDetail, setBiddingDetail] =
    useState<PartnerBiddingDetail | null>(
      null,
    );

  const [quote, setQuote] =
    useState<PartnerQuote | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [quoteLoading, setQuoteLoading] =
    useState(true);

  const [quoteSaving, setQuoteSaving] =
    useState(false);

  const [
    quoteSubmitting,
    setQuoteSubmitting,
  ] = useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [quoteError, setQuoteError] =
    useState<string | null>(null);

  const normalizedBiddingRequestId =
    biddingRequestId.trim();

  const loadBiddingDetail =
    useCallback(async () => {
      if (!normalizedBiddingRequestId) {
        setBiddingDetail(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const result =
          await getPartnerBiddingDetail(
            normalizedBiddingRequestId,
          );

        setBiddingDetail(result);
      } catch (loadError) {
        console.error(loadError);

        setBiddingDetail(null);

        setError(
          getErrorMessage(
            loadError,
            "입찰정보를 불러오지 못했습니다.",
          ),
        );
      } finally {
        setLoading(false);
      }
    }, [normalizedBiddingRequestId]);

  const loadQuote =
    useCallback(async () => {
      if (!normalizedBiddingRequestId) {
        setQuote(null);
        setQuoteLoading(false);
        return;
      }

      try {
        setQuoteLoading(true);
        setQuoteError(null);

        const result =
          await getPartnerQuote(
            normalizedBiddingRequestId,
          );

        setQuote(result);
      } catch (loadError) {
        console.error(loadError);

        setQuote(null);

        setQuoteError(
          getErrorMessage(
            loadError,
            "견적정보를 불러오지 못했습니다.",
          ),
        );
      } finally {
        setQuoteLoading(false);
      }
    }, [normalizedBiddingRequestId]);

  const refreshAll =
    useCallback(async () => {
      await Promise.all([
        loadBiddingDetail(),
        loadQuote(),
      ]);
    }, [
      loadBiddingDetail,
      loadQuote,
    ]);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  const saveItem =
    useCallback(
      async (
        item: SavePartnerQuoteItemInput,
      ): Promise<PartnerQuote> => {
        if (!normalizedBiddingRequestId) {
          throw new Error(
            "입찰요청 ID를 확인할 수 없습니다.",
          );
        }

        try {
          setQuoteSaving(true);
          setQuoteError(null);

          const savedQuote =
            await savePartnerQuoteItem(
              normalizedBiddingRequestId,
              item,
            );

          setQuote(savedQuote);

          return savedQuote;
        } catch (saveError) {
          console.error(saveError);

          const message =
            getErrorMessage(
              saveError,
              "품목 견적을 저장하지 못했습니다.",
            );

          setQuoteError(message);

          throw new Error(message);
        } finally {
          setQuoteSaving(false);
        }
      },
      [normalizedBiddingRequestId],
    );

  const saveMemo =
    useCallback(
      async (
        memo: string | null,
      ): Promise<PartnerQuote> => {
        if (!normalizedBiddingRequestId) {
          throw new Error(
            "입찰요청 ID를 확인할 수 없습니다.",
          );
        }

        try {
          setQuoteSaving(true);
          setQuoteError(null);

          const savedQuote =
            await savePartnerQuoteMemo(
              normalizedBiddingRequestId,
              memo,
            );

          setQuote(savedQuote);

          return savedQuote;
        } catch (saveError) {
          console.error(saveError);

          const message =
            getErrorMessage(
              saveError,
              "견적 메모를 저장하지 못했습니다.",
            );

          setQuoteError(message);

          throw new Error(message);
        } finally {
          setQuoteSaving(false);
        }
      },
      [normalizedBiddingRequestId],
    );

  const submitQuote =
    useCallback(async (): Promise<PartnerQuote> => {
      if (!normalizedBiddingRequestId) {
        throw new Error(
          "입찰요청 ID를 확인할 수 없습니다.",
        );
      }

      try {
        setQuoteSubmitting(true);
        setQuoteError(null);

        const submittedQuote =
          await submitPartnerQuote(
            normalizedBiddingRequestId,
          );

        setQuote(submittedQuote);

        return submittedQuote;
      } catch (submitError) {
        console.error(submitError);

        const message =
          getErrorMessage(
            submitError,
            "견적서를 제출하지 못했습니다.",
          );

        setQuoteError(message);

        throw new Error(message);
      } finally {
        setQuoteSubmitting(false);
      }
    }, [normalizedBiddingRequestId]);

  const clearError =
    useCallback(() => {
      setError(null);
    }, []);

  const clearQuoteError =
    useCallback(() => {
      setQuoteError(null);
    }, []);

  return {
    biddingDetail,
    quote,

    loading,
    quoteLoading,
    quoteSaving,
    quoteSubmitting,

    error,
    quoteError,

    refresh: loadBiddingDetail,
    refreshQuote: loadQuote,
    refreshAll,

    saveItem,
    saveMemo,
    submitQuote,

    clearError,
    clearQuoteError,
  };
}