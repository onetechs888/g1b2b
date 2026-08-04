"use client";

import { useCallback, useEffect, useState } from "react";

import {
  getSubmittedQuotes,
  type CustomerQuoteListItem,
} from "@/services/customer/quoteService";

export function useSubmittedQuotes() {
  const [quotes, setQuotes] = useState<CustomerQuoteListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadQuotes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result =
        await getSubmittedQuotes();

      setQuotes(result);
    } catch (err) {
      console.error(err);

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
    loadQuotes();
  }, [loadQuotes]);

  return {
    quotes,

    loading,

    error,

    refresh: loadQuotes,
  };
}