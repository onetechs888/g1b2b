"use client";

import BiddingBomSection from "@/components/customer/sourcing/BiddingBomSection";
import CommonFileUploader from "@/components/customer/sourcing/CommonFileUploader";
import RequestBasicForm from "@/components/customer/sourcing/RequestBasicForm";
import RequestFooterActions from "@/components/customer/sourcing/RequestFooterActions";
import RequestHeaderActions from "@/components/customer/sourcing/RequestHeaderActions";
import WorkspaceLayout from "@/components/workspace/WorkspaceLayout";

import {
  useBiddingRequest,
} from "@/hooks/customer/useBiddingRequest";

export default function CustomerBiddingRequestPage() {
  const {
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
  } = useBiddingRequest();

  const submitDisabled =
    isSaving ||
    !form.projectName.trim() ||
    !form.bidDeadline ||
    !form.dueDate ||
    bomItems.length === 0;

  return (
    <WorkspaceLayout role="customer">
      <div className="space-y-6">
        <RequestHeaderActions
          isSaving={isSaving}
          submitDisabled={
            submitDisabled
          }
          onCancel={handleCancel}
          onTemporarySave={
            handleTemporarySave
          }
          onSubmit={handleSubmit}
        />

        <RequestBasicForm
          form={form}
          disabled={isSaving}
          onChange={updateField}
        />

        <BiddingBomSection
          bomItems={bomItems}
          isReadingBom={
            isReadingBom
          }
          disabled={isSaving}
          onExcelUpload={
            handleBomExcelUpload
          }
          onFilesChange={
            handlePartFilesChange
          }
        />

        <CommonFileUploader
          files={commonFiles}
          disabled={isSaving}
          onUpload={
            handleCommonFileUpload
          }
          onRemove={
            handleCommonFileRemove
          }
        />

        <RequestFooterActions
          isSaving={isSaving}
          submitDisabled={
            submitDisabled
          }
          onCancel={handleCancel}
          onTemporarySave={
            handleTemporarySave
          }
          onSubmit={handleSubmit}
        />
      </div>
    </WorkspaceLayout>
  );
}