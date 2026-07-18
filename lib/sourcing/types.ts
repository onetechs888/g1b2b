export type SourcingRequestType =
  | "bidding"
  | "order";

export type SourcingFileExtension =
  | "pdf"
  | "dwg"
  | "dxf"
  | "step"
  | "stp"
  | "unknown";

export type SourcingFileStatus =
  | "ready"
  | "uploading"
  | "uploaded"
  | "failed";

export interface UploadedSourcingFile {
  id: string;

  file: File;

  fileName: string;

  fileSize: number;

  mimeType: string;

  extension: SourcingFileExtension;

  status: SourcingFileStatus;

  uploadedAt: Date;

  storageBucket?: string;

  storagePath?: string;

  errorMessage?: string;
}

export type UploadedPartFile =
  UploadedSourcingFile;

export type UploadedCommonFile =
  UploadedSourcingFile;

export interface SourcingBomItem {
  /**
   * 브라우저 내부에서 BOM 행을 구분하는 임시 ID입니다.
   * DB 저장 후 생성되는 UUID와는 별개입니다.
   */
  tempId: string;

  sourceSheetName: string;

  sourceRowNumber: number;

  partNo: string;

  partName: string;

  quantity: number;

  material: string;

  specification: string;

  unitPrice: number | null;

  memo: string;

  files: UploadedPartFile[];
}

export interface SourcingBasicForm {
  projectName: string;

  dueDate: string;

  description: string;

  memo: string;
}

export interface BiddingForm
  extends SourcingBasicForm {
  bidDeadline: string;

  minimumPartnerTier: string;
}

export interface OrderForm
  extends SourcingBasicForm {
  targetPrice: number | null;
}

export interface SourcingSummary {
  bomCount: number;

  partFileCount: number;

  commonFileCount: number;
}