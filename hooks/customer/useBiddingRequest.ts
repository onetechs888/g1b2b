"use client";

import {
  useCallback,
  useEffect,
  useState,
  type ChangeEvent,
} from "react";
import {
  useSearchParams,
} from "next/navigation";

import {
  parseBomWorkbook,
} from "@/lib/bom/parseBomWorkbook";

import {
  mapImportedBomItemsToSourcingBomItems,
} from "@/lib/sourcing/bomAdapter";

import type {
  BiddingForm,
  SourcingFileExtension,
  SourcingBomItem,
  UploadedCommonFile,
  UploadedPartFile,
} from "@/lib/sourcing/types";

import {
  getBiddingRequestForEdit,
  saveBiddingRequestDraft,
  submitBiddingRequest,
  submitExistingBiddingRequest,
  updateBiddingRequest,
  type EditableBiddingRequestStatus,
} from "@/services/customer/biddingRequestService";

const initialForm: BiddingForm = {
  projectName: "",
  bidDeadline: "",
  dueDate: "",
  minimumPartnerTier: "",
  description: "",
  memo: "",
};

const allowedCommonFileExtensions: SourcingFileExtension[] = [
  "pdf",
  "dwg",
  "step",
  "stp",
];

const editableBomFields = [
  "partNo",
  "partName",
  "quantity",
  "material",
  "specification",
  "memo",
] as const;

type EditableBomField =
  (typeof editableBomFields)[number];

const getFileExtension = (
  fileName: string,
): SourcingFileExtension => {
  const extension =
    fileName
      .split(".")
      .pop()
      ?.trim()
      .toLowerCase() ?? "";

  if (
    extension === "pdf" ||
    extension === "dwg" ||
    extension === "dxf" ||
    extension === "step" ||
    extension === "stp"
  ) {
    return extension;
  }

  return "unknown";
};

const createTemporaryId = () => {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return [
    Date.now(),
    Math.random()
      .toString(36)
      .slice(2),
  ].join("-");
};

const createTemporaryFileId =
  createTemporaryId;

export function useBiddingRequest() {
  const searchParams =
    useSearchParams();

  const queryRequestId =
    searchParams.get("id");

  const [form, setForm] =
    useState<BiddingForm>(
      initialForm,
    );

  const [bomItems, setBomItems] =
    useState<SourcingBomItem[]>(
      [],
    );

  const [
    commonFiles,
    setCommonFiles,
  ] = useState<
    UploadedCommonFile[]
  >([]);

  const [
    editingRequestId,
    setEditingRequestId,
  ] = useState<string | null>(
    queryRequestId,
  );

  const [
    requestStatus,
    setRequestStatus,
  ] =
    useState<EditableBiddingRequestStatus | null>(
      null,
    );

  const [
    isLoadingRequest,
    setIsLoadingRequest,
  ] = useState(
    Boolean(queryRequestId),
  );

  const [
    isReadingBom,
    setIsReadingBom,
  ] = useState(false);

  const [isSaving, setIsSaving] =
    useState(false);

  const isEditMode =
    Boolean(editingRequestId);

  const loadEditingRequest =
    useCallback(async (
      biddingRequestId: string,
    ) => {
      try {
        setIsLoadingRequest(true);

        const result =
          await getBiddingRequestForEdit(
            biddingRequestId,
          );

        setEditingRequestId(
          result.id,
        );

        setRequestStatus(
          result.status,
        );

        setForm(
          result.form,
        );

        setBomItems(
          result.bomItems,
        );

        /**
         * 기존 Part/Common 파일 복원 기능은
         * 현재 Service 연결 범위에 포함되어 있지 않으므로
         * 기존 업로드 상태를 임의로 생성하지 않습니다.
         */
        setCommonFiles([]);
      } catch (error) {
        console.error(
          "입찰요청 수정 데이터 조회 실패:",
          error,
        );

        const message =
          error instanceof Error
            ? error.message
            : "입찰요청 정보를 불러오지 못했습니다.";

        alert(message);
      } finally {
        setIsLoadingRequest(false);
      }
    }, []);

  useEffect(() => {
    if (!queryRequestId) {
      return;
    }

    void loadEditingRequest(
      queryRequestId,
    );
  }, [
    queryRequestId,
    loadEditingRequest,
  ]);

  const updateField = (
    field: keyof BiddingForm,
    value: string,
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleBomExcelUpload =
    async (
      event: ChangeEvent<HTMLInputElement>,
    ) => {
      const file =
        event.target.files?.[0];

      if (!file) {
        return;
      }

      try {
        setIsReadingBom(true);

        const arrayBuffer =
          await file.arrayBuffer();

        const result =
          await parseBomWorkbook(
            arrayBuffer,
          );

        const sourcingBomItems =
          mapImportedBomItemsToSourcingBomItems(
            result.items,
          );

        setBomItems(
          sourcingBomItems,
        );

        const warningMessage =
          result.warnings.length > 0
            ? [
                "",
                "",
                "확인사항:",
                ...result.warnings,
              ].join("\n")
            : "";

        alert(
          [
            `BOM ${result.items.length}개 품목을 불러왔습니다.`,
            `시트: ${result.sheetName}`,
            `헤더 행: ${result.headerRowNumber}`,
            "",
            "불러온 BOM은 제출 전 수정할 수 있습니다.",
          ].join("\n") +
            warningMessage,
        );
      } catch (error) {
        console.error(
          "BOM 엑셀 읽기 실패:",
          error,
        );

        alert(
          error instanceof Error
            ? error.message
            : "BOM 엑셀을 읽는 중 오류가 발생했습니다.",
        );
      } finally {
        setIsReadingBom(false);
        event.target.value = "";
      }
    };

  const handleBomItemChange = (
    tempId: string,
    field: EditableBomField,
    value: string | number,
  ) => {
    setBomItems(
      (previousItems) =>
        previousItems.map(
          (item) => {
            if (
              item.tempId !== tempId
            ) {
              return item;
            }

            if (
              field === "quantity"
            ) {
              const numericValue =
                typeof value === "number"
                  ? value
                  : Number(value);

              return {
                ...item,
                quantity:
                  Number.isFinite(
                    numericValue,
                  )
                    ? Math.max(
                        0,
                        numericValue,
                      )
                    : 0,
              };
            }

            return {
              ...item,
              [field]:
                String(value),
            };
          },
        ),
    );
  };

  const handleAddBomItem = () => {
    setBomItems(
      (previousItems) => {
        const manualItemCount =
          previousItems.filter(
            (item) =>
              item.sourceSheetName ===
              "MANUAL",
          ).length;

        const nextItem:
          SourcingBomItem = {
          tempId:
            createTemporaryId(),
          sourceSheetName:
            "MANUAL",
          sourceRowNumber:
            manualItemCount + 1,
          partNo: "",
          partName: "",
          quantity: 1,
          material: "",
          specification: "",
          unitPrice: null,
          memo: "",
          files: [],
        };

        return [
          ...previousItems,
          nextItem,
        ];
      },
    );
  };

  const handleRemoveBomItem = (
    tempId: string,
  ) => {
    setBomItems(
      (previousItems) =>
        previousItems.filter(
          (item) =>
            item.tempId !== tempId,
        ),
    );
  };

  const handlePartFilesChange = (
    tempId: string,
    files: UploadedPartFile[],
  ) => {
    setBomItems(
      (previousItems) =>
        previousItems.map(
          (item) =>
            item.tempId === tempId
              ? {
                  ...item,
                  files,
                }
              : item,
        ),
    );
  };

  const handleCommonFileUpload = (
    selectedFiles: FileList,
  ) => {
    const selectedFileArray =
      Array.from(selectedFiles);

    if (
      selectedFileArray.length === 0
    ) {
      return;
    }

    const invalidFiles =
      selectedFileArray.filter(
        (file) =>
          !allowedCommonFileExtensions.includes(
            getFileExtension(
              file.name,
            ),
          ),
      );

    if (
      invalidFiles.length > 0
    ) {
      alert(
        [
          "PDF, DWG, STEP, STP 파일만 업로드할 수 있습니다.",
          "",
          "업로드할 수 없는 파일:",
          ...invalidFiles.map(
            (file) =>
              `- ${file.name}`,
          ),
        ].join("\n"),
      );

      return;
    }

    const newFiles:
      UploadedCommonFile[] =
      selectedFileArray.map(
        (file) => ({
          id:
            createTemporaryFileId(),
          file,
          fileName:
            file.name,
          fileSize:
            file.size,
          mimeType:
            file.type ||
            "application/octet-stream",
          extension:
            getFileExtension(
              file.name,
            ),
          status:
            "ready",
          uploadedAt:
            new Date(),
        }),
      );

    setCommonFiles(
      (previousFiles) => [
        ...previousFiles,
        ...newFiles,
      ],
    );
  };

  const handleCommonFileRemove = (
    fileId: string,
  ) => {
    setCommonFiles(
      (previousFiles) =>
        previousFiles.filter(
          (file) =>
            file.id !== fileId,
        ),
    );
  };

  const handleCancel = () => {
    window.history.back();
  };

  const validateDraft = () => {
    if (
      !form.projectName.trim()
    ) {
      alert(
        "프로젝트명을 입력해 주세요.",
      );

      return false;
    }

    return true;
  };

  const validateBomItems = () => {
    const invalidItemIndex =
      bomItems.findIndex(
        (item) =>
          !item.partName.trim() ||
          !Number.isFinite(
            item.quantity,
          ) ||
          item.quantity <= 0,
      );

    if (
      invalidItemIndex >= 0
    ) {
      alert(
        [
          `BOM ${invalidItemIndex + 1}번 품목을 확인해 주세요.`,
          "",
          "품명은 필수이며 수량은 1 이상이어야 합니다.",
        ].join("\n"),
      );

      return false;
    }

    return true;
  };

  const validateSubmit = () => {
    if (
      !form.projectName.trim()
    ) {
      alert(
        "프로젝트명을 입력해 주세요.",
      );
      return false;
    }

    if (!form.bidDeadline) {
      alert(
        "입찰 마감일을 선택해 주세요.",
      );
      return false;
    }

    if (!form.dueDate) {
      alert(
        "희망 납기일을 선택해 주세요.",
      );
      return false;
    }

    if (
      bomItems.length === 0
    ) {
      alert(
        "BOM 엑셀을 업로드하거나 품목을 직접 추가해 주세요.",
      );
      return false;
    }

    return validateBomItems();
  };

  const handleTemporarySave =
    async () => {
      if (!validateDraft()) {
        return;
      }

      try {
        setIsSaving(true);

        if (editingRequestId) {
          const result =
            await updateBiddingRequest({
              biddingRequestId:
                editingRequestId,
              form,
              bomItems,
            });

          setRequestStatus(
            result.status,
          );

          alert(
            result.revision_required_quote_count >
              0
              ? `입찰요청이 수정되었습니다.\n\n기존 제출 견적 ${result.revision_required_quote_count}건은 진행보류 처리되었습니다.`
              : "입찰요청이 수정되었습니다.",
          );

          return;
        }

        const savedBidding =
          await saveBiddingRequestDraft(
            form,
            bomItems,
          );

        setEditingRequestId(
          savedBidding.id,
        );

        setRequestStatus(
          savedBidding.status,
        );

        alert(
          "입찰요청이 임시저장되었습니다.",
        );
      } catch (error) {
        console.error(
          "입찰 임시저장/수정 실패:",
          error,
        );

        alert(
          error instanceof Error
            ? error.message
            : "입찰요청 저장 중 오류가 발생했습니다.",
        );
      } finally {
        setIsSaving(false);
      }
    };

  const handleSubmit =
    async () => {
      if (!validateSubmit()) {
        return;
      }

      try {
        setIsSaving(true);

        if (
          editingRequestId &&
          requestStatus ===
            "draft"
        ) {
          const result =
            await submitExistingBiddingRequest({
              biddingRequestId:
                editingRequestId,
              form,
              bomItems,
            });

          setRequestStatus(
            result.status,
          );

          alert(
            "RFQ 요청이 정상적으로 등록되었습니다.\n\n파트너가 이제 입찰할 수 있습니다.",
          );

          return;
        }

        if (editingRequestId) {
          const result =
            await updateBiddingRequest({
              biddingRequestId:
                editingRequestId,
              form,
              bomItems,
            });

          setRequestStatus(
            result.status,
          );

          alert(
            result.revision_required_quote_count >
              0
              ? `RFQ가 수정되었습니다.\n\n기존 제출 견적 ${result.revision_required_quote_count}건은 진행보류 처리되었습니다.`
              : "RFQ가 수정되었습니다.",
          );

          return;
        }

        const savedBidding =
          await submitBiddingRequest({
            form,
            bomItems,
          });

        setEditingRequestId(
          savedBidding.id,
        );

        setRequestStatus(
          savedBidding.status,
        );

        alert(
          "RFQ 요청이 정상적으로 등록되었습니다.\n\n파트너가 이제 입찰할 수 있습니다.",
        );
      } catch (error) {
        console.error(
          "RFQ 요청/수정 실패:",
          error,
        );

        alert(
          error instanceof Error
            ? error.message
            : "RFQ 요청 중 오류가 발생했습니다.",
        );
      } finally {
        setIsSaving(false);
      }
    };

  return {
    form,
    bomItems,
    commonFiles,

    editingRequestId,
    requestStatus,
    isEditMode,
    isLoadingRequest,
    isReadingBom,
    isSaving,

    updateField,

    handleBomExcelUpload,
    handleBomItemChange,
    handleAddBomItem,
    handleRemoveBomItem,
    handlePartFilesChange,

    handleCommonFileUpload,
    handleCommonFileRemove,

    handleCancel,
    handleTemporarySave,
    handleSubmit,
  };
}