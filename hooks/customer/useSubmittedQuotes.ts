"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  getCustomerBiddingList,
  getSubmittedQuotes,
  type CustomerBiddingListItem,
  type CustomerQuoteListItem,
} from "@/services/customer/quoteService";

/**
 * Customer 입찰현황용 RFQ 목록 Hook
 *
 * 상태 기준:
 * - draft       → 임시저장
 * - waiting     → 입찰대기
 * - in_progress → 입찰중
 * - completed   → 선정완료
 *
 * 목록 기준은 bidding_requests 입니다.
 */
export function useCustomerBiddingList() {
  const [
    biddings,
    setBiddings,
  ] = useState<
    CustomerBiddingListItem[]
  >([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );

  const loadBiddings =
    useCallback(async () => {
      try {
        setLoading(true);
        setError(null);

        const result =
          await getCustomerBiddingList();

        setBiddings(result);
      } catch (err) {
        console.error(
          "Customer 입찰현황 조회 실패:",
          err,
        );

        setBiddings([]);

        setError(
          err instanceof Error
            ? err.message
            : "입찰현황을 불러오지 못했습니다.",
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    void loadBiddings();
  }, [loadBiddings]);

  return {
    biddings,
    loading,
    error,
    refresh:
      loadBiddings,
  };
}

/**
 * 기존 제출 견적 목록 Hook
 *
 * RFQ 상세 비교 / 기존 화면 호환을 위해 유지합니다.
 * 현재 단계에서는 삭제하거나 동작을 변경하지 않습니다.
 */
export function useSubmittedQuotes() {
  const [
    quotes,
    setQuotes,
  ] = useState<
    CustomerQuoteListItem[]
  >([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );

  const loadQuotes =
    useCallback(async () => {
      try {
        setLoading(true);
        setError(null);

        const result =
          await getSubmittedQuotes();

        setQuotes(result);
      } catch (err) {
        console.error(
          "Customer 제출 견적 목록 조회 실패:",
          err,
        );

        setQuotes([]);

        setError(
          err instanceof Error
            ? err.message
            : "견적목록을 불러오지 못했습니다.",
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    void loadQuotes();
  }, [loadQuotes]);

  return {
    quotes,
    loading,
    error,
    refresh:
      loadQuotes,
  };
}