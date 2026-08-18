"use client";

import {
  useCallback,
  useState,
} from "react";

import {
  createProjectFromBidding,
  selectBiddingPartner,
  type CreateProjectFromBiddingResult,
  type SelectBiddingPartnerResult,
} from "@/services/customer/quoteService";

export type SelectPartnerAndCreateProjectResult = {
  selection:
    SelectBiddingPartnerResult;

  project:
    CreateProjectFromBiddingResult;
};

export function useSelectBiddingPartner() {
  const [selecting, setSelecting] =
    useState(false);

  const [creating, setCreating] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const selectPartner = useCallback(
    async (
      biddingRequestId: string,
      quoteId: string,
    ): Promise<SelectPartnerAndCreateProjectResult | null> => {
      let selectionCompleted =
        false;

      try {
        setSelecting(true);
        setError(null);

        const selection =
          await selectBiddingPartner(
            biddingRequestId,
            quoteId,
          );

        selectionCompleted = true;

        const project =
          await createProjectFromBidding(
            biddingRequestId,
          );

        return {
          selection,
          project,
        };
      } catch (err) {
        console.error(
          selectionCompleted
            ? "Customer 업체 선정 후 Project 생성 실패:"
            : "Customer 업체 선정 실패:",
          err,
        );

        const message =
          err instanceof Error
            ? err.message
            : selectionCompleted
              ? "업체 선정은 완료되었지만 Project 생성에 실패했습니다."
              : "업체 선정에 실패했습니다.";

        setError(
          selectionCompleted
            ? `업체 선정은 완료되었지만 Project 생성에 실패했습니다: ${message}`
            : message,
        );

        return null;
      } finally {
        setSelecting(false);
      }
    },
    [],
  );

  const createProject = useCallback(
    async (
      biddingRequestId: string,
    ): Promise<CreateProjectFromBiddingResult | null> => {
      try {
        setCreating(true);
        setError(null);

        return await createProjectFromBidding(
          biddingRequestId,
        );
      } catch (err) {
        console.error(
          "Customer 누락 Project 생성 실패:",
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : "Project 생성에 실패했습니다.",
        );

        return null;
      } finally {
        setCreating(false);
      }
    },
    [],
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    selecting,
    creating,
    error,
    selectPartner,
    createProject,
    clearError,
  };
}