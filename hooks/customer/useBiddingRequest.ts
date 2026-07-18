"use client";

import {
  useState,
  type ChangeEvent,
} from "react";

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
  saveBiddingRequestDraft,
  submitBiddingRequest,
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

const createTemporaryFileId = () => {
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

export function useBiddingRequest() {
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
    isReadingBom,
    setIsReadingBom,
  ] = useState(false);

  const [isSaving, setIsSaving] =
    useState(false);

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

        console.log(
          "G1 BOM Import Result:",
          result,
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
          ].join("\n") +
            warningMessage,
        );
      } catch (error) {
        console.error(
          "BOM 엑셀 읽기 실패:",
          error,
        );

        const message =
          error instanceof Error
            ? error.message
            : "BOM 엑셀을 읽는 중 오류가 발생했습니다.";

        alert(message);
      } finally {
        setIsReadingBom(false);
        event.target.value = "";
      }
    };

  const handlePartFilesChange = (
    tempId: string,
    files: UploadedPartFile[],
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

            return {
              ...item,
              files,
            };
          },
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
        (file) => {
          const extension =
            getFileExtension(
              file.name,
            );

          return (
            !allowedCommonFileExtensions.includes(
              extension,
            )
          );
        },
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

    const newFiles: UploadedCommonFile[] =
      selectedFileArray.map(
        (file) => ({
          id: createTemporaryFileId(),
          file,
          fileName: file.name,
          fileSize: file.size,
          mimeType:
            file.type ||
            "application/octet-stream",
          extension:
            getFileExtension(
              file.name,
            ),
          status: "ready",
          uploadedAt: new Date(),
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
        "BOM 엑셀을 업로드해 주세요.",
      );

      return false;
    }

    return true;
  };

  const handleTemporarySave =
    async () => {
      if (!validateDraft()) {
        return;
      }

      try {
        setIsSaving(true);

        const savedBidding =
          await saveBiddingRequestDraft(
            form,
          );

        console.log(
          "입찰 임시저장 완료:",
          savedBidding,
        );

        console.log(
          "현재 BOM 품목:",
          bomItems,
        );

        console.log(
          "현재 공통 첨부파일:",
          commonFiles,
        );

        alert(
          "입찰요청이 임시저장되었습니다.",
        );
      } catch (error) {
        console.error(
          "입찰 임시저장 실패:",
          error,
        );

        const message =
          error instanceof Error
            ? error.message
            : "입찰요청 저장 중 오류가 발생했습니다.";

        alert(message);
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

        const savedBidding =
          await submitBiddingRequest({
            form,
            bomItems,
          });

        console.log(
          "RFQ 요청 완료:",
          savedBidding,
        );

        console.log(
          "제출 BOM 품목:",
          bomItems,
        );

        console.log(
          "제출 공통 첨부파일:",
          commonFiles,
        );

        alert(
          "RFQ 요청이 정상적으로 등록되었습니다.\n\n파트너가 이제 입찰할 수 있습니다.",
        );

        setForm(initialForm);
        setBomItems([]);
        setCommonFiles([]);
      } catch (error) {
        console.error(
          "RFQ 요청 실패:",
          error,
        );

        const message =
          error instanceof Error
            ? error.message
            : "RFQ 요청 중 오류가 발생했습니다.";

        alert(message);
      } finally {
        setIsSaving(false);
      }
    };

  return {
    form,
    bomItems,
    commonFiles,

    isReadingBom,
    isSaving,

    updateField,

    handleBomExcelUpload,
    handlePartFilesChange,

    handleCommonFileUpload,
    handleCommonFileRemove,

    handleCancel,
    handleTemporarySave,
    handleSubmit,
  };
}