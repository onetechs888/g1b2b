"use client";

import { useState, type ChangeEvent } from "react";

import WorkspaceLayout from "@/components/workspace/WorkspaceLayout";
import {
  parseBomWorkbook,
  type ImportedBomItem,
} from "@/lib/bom/parseBomWorkbook";
import { supabase } from "@/lib/supabase";

type BiddingForm = {
  projectName: string;
  bidDeadline: string;
  dueDate: string;
  minimumPartnerTier: string;
  description: string;
  memo: string;
};

const initialForm: BiddingForm = {
  projectName: "",
  bidDeadline: "",
  dueDate: "",
  minimumPartnerTier: "",
  description: "",
  memo: "",
};

export default function CustomerBiddingRequestPage() {
  const [form, setForm] =
    useState<BiddingForm>(initialForm);

  const [isSaving, setIsSaving] =
    useState(false);

  const [bomItems, setBomItems] =
    useState<ImportedBomItem[]>([]);

  const [isReadingBom, setIsReadingBom] =
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

  /**
   * G1 공통 BOM Import Engine을 사용한
   * BOM 엑셀 업로드
   */
  const handleBomExcelUpload = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

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

      setBomItems(result.items);

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
        ].join("\n") + warningMessage,
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

      // 동일한 파일을 다시 선택해도
      // change 이벤트가 발생하도록 초기화
      event.target.value = "";
    }
  };

  /**
   * 입찰요청 임시저장
   *
   * 현재 단계에서는 bidding_requests만 저장하며,
   * BOM과 첨부파일 저장은 이후 최종 저장 구조에서 연결합니다.
   */
  const handleTemporarySave = async () => {
    if (!form.projectName.trim()) {
      alert("프로젝트명을 입력해 주세요.");
      return;
    }

    try {
      setIsSaving(true);

      // 1. 현재 로그인 사용자 확인
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!user) {
        throw new Error(
          "로그인 사용자 정보를 확인할 수 없습니다.",
        );
      }

      // 2. public.users에서 사용자 소속 회사와 권한 확인
      const {
        data: userProfile,
        error: profileError,
      } = await supabase
        .from("users")
        .select(
          "id, company_id, role, status",
        )
        .eq("id", user.id)
        .single();

      if (profileError) {
        throw profileError;
      }

      if (!userProfile) {
        throw new Error(
          "사용자 프로필을 확인할 수 없습니다.",
        );
      }

      if (!userProfile.company_id) {
        throw new Error(
          "사용자의 소속 회사 정보를 확인할 수 없습니다.",
        );
      }

      if (userProfile.role !== "customer") {
        throw new Error(
          "고객 계정만 입찰요청을 생성할 수 있습니다.",
        );
      }

      if (
        userProfile.status !== "active" &&
        userProfile.status !== "approved"
      ) {
        throw new Error(
          "활성화된 고객 계정이 아닙니다.",
        );
      }

      // 3. bidding_requests 임시저장
      const {
        data: savedBidding,
        error: insertError,
      } = await supabase
        .from("bidding_requests")
        .insert({
          customer_company_id:
            userProfile.company_id,
          selected_partner_company_id:
            null,
          project_id: null,
          project_name:
            form.projectName.trim(),
          status: "draft",
          bid_deadline:
            form.bidDeadline
              ? new Date(
                  form.bidDeadline,
                ).toISOString()
              : null,
          due_date:
            form.dueDate || null,
          minimum_partner_tier:
            form.minimumPartnerTier ||
            null,
          description:
            form.description.trim() ||
            null,
          memo:
            form.memo.trim() || null,
          created_by: user.id,
        })
        .select(
          "id, project_name, status",
        )
        .single();

      if (insertError) {
        throw insertError;
      }

      console.log(
        "입찰 임시저장 완료:",
        savedBidding,
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

  return (
    <WorkspaceLayout role="customer">
      <div className="space-y-6">
        {/* 페이지 헤더 */}
        <header>
          <p className="text-sm font-medium text-slate-500">
            입찰관리 &gt; 입찰요청
          </p>

          <h1 className="mt-2 text-2xl font-bold text-slate-950">
            입찰요청
          </h1>

          <p className="mt-1 text-sm text-slate-600">
            경쟁입찰을 위한 프로젝트 기본정보와
            요청사항을 등록합니다.
          </p>
        </header>

        {/* 입찰 기본정보 */}
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-base font-semibold text-slate-950">
              입찰 기본정보
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              파트너가 입찰 내용을 검토할 수 있도록
              기본정보를 입력해 주세요.
            </p>
          </div>

          <div className="grid gap-5 p-6 md:grid-cols-2">
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-slate-700">
                프로젝트명
                <span className="ml-1 text-red-600">
                  *
                </span>
              </span>

              <input
                type="text"
                value={form.projectName}
                onChange={(event) =>
                  updateField(
                    "projectName",
                    event.target.value,
                  )
                }
                placeholder="예: SPATTER 설비 제작"
                className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm text-slate-950 outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">
                입찰 마감일
              </span>

              <input
                type="datetime-local"
                value={form.bidDeadline}
                onChange={(event) =>
                  updateField(
                    "bidDeadline",
                    event.target.value,
                  )
                }
                className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm text-slate-950 outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">
                납기일
              </span>

              <input
                type="date"
                value={form.dueDate}
                onChange={(event) =>
                  updateField(
                    "dueDate",
                    event.target.value,
                  )
                }
                className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm text-slate-950 outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">
                최소 파트너 티어
              </span>

              <select
                value={
                  form.minimumPartnerTier
                }
                onChange={(event) =>
                  updateField(
                    "minimumPartnerTier",
                    event.target.value,
                  )
                }
                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              >
                <option value="">
                  제한 없음
                </option>

                <option value="tier_1">
                  Tier 1
                </option>

                <option value="tier_2">
                  Tier 2
                </option>

                <option value="tier_3">
                  Tier 3
                </option>
              </select>
            </label>

            <div className="hidden md:block" />

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-slate-700">
                프로젝트 설명
              </span>

              <textarea
                rows={5}
                value={form.description}
                onChange={(event) =>
                  updateField(
                    "description",
                    event.target.value,
                  )
                }
                placeholder="가공 조건, 품질 요구사항, 납품 조건 등 파트너에게 공개할 내용을 입력해 주세요."
                className="w-full resize-none rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-slate-700">
                내부 메모
              </span>

              <textarea
                rows={3}
                value={form.memo}
                onChange={(event) =>
                  updateField(
                    "memo",
                    event.target.value,
                  )
                }
                placeholder="고객사 내부에서만 확인할 메모를 입력해 주세요."
                className="w-full resize-none rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              />

              <p className="text-xs text-slate-500">
                내부 메모는 입찰 참여 파트너에게
                공개되지 않습니다.
              </p>
            </label>
          </div>
        </section>

        {/* 입찰 BOM */}
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-4">
            <div>
              <h2 className="text-base font-semibold text-slate-950">
                입찰 BOM
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                BOM 엑셀을 업로드하면 시트와 헤더를
                자동으로 분석하여 품목을 생성합니다.
              </p>
            </div>

            <label
              className={[
                "inline-flex h-10 items-center rounded-md px-4 text-sm font-semibold text-white transition",
                isReadingBom
                  ? "cursor-not-allowed bg-slate-400"
                  : "cursor-pointer bg-slate-900 hover:bg-slate-800",
              ].join(" ")}
            >
              {isReadingBom
                ? "BOM 분석 중..."
                : "BOM Excel 업로드"}

              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={
                  handleBomExcelUpload
                }
                disabled={isReadingBom}
                className="hidden"
              />
            </label>
          </div>

          {bomItems.length === 0 ? (
            <div className="p-6">
              <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
                <p className="text-sm font-medium text-slate-700">
                  등록된 BOM 품목이 없습니다.
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  품번, 품명, 수량이 포함된 엑셀
                  파일을 업로드해 주세요.
                </p>

                <p className="mt-3 text-xs text-slate-400">
                  지원 형식: XLSX, XLS
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1180px] border-collapse text-left">
                <thead className="bg-slate-50">
                  <tr className="border-b border-slate-200">
                    <th className="w-16 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      No.
                    </th>

                    <th className="w-24 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Excel 행
                    </th>

                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      품번
                    </th>

                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      품명
                    </th>

                    <th className="w-24 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      수량
                    </th>

                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      재질
                    </th>

                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      규격
                    </th>

                    <th className="w-44 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      파트 파일
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {bomItems.map(
                    (item, index) => (
                      <tr
                        key={item.tempId}
                        className="border-b border-slate-100 last:border-b-0"
                      >
                        <td className="px-4 py-3 text-sm text-slate-500">
                          {index + 1}
                        </td>

                        <td className="px-4 py-3 text-sm text-slate-500">
                          {item.sourceRowNumber}
                        </td>

                        <td className="px-4 py-3 text-sm font-medium text-slate-900">
                          {item.partNo || "-"}
                        </td>

                        <td className="px-4 py-3 text-sm text-slate-800">
                          {item.partName || "-"}
                        </td>

                        <td className="px-4 py-3 text-sm text-slate-800">
                          {item.quantity}
                        </td>

                        <td className="px-4 py-3 text-sm text-slate-800">
                          {item.material || "-"}
                        </td>

                        <td className="px-4 py-3 text-sm text-slate-800">
                          {item.specification ||
                            "-"}
                        </td>

                        <td className="px-4 py-3">
                          <button
                            type="button"
                            disabled
                            className="h-8 cursor-not-allowed rounded-md border border-slate-200 bg-slate-100 px-3 text-xs font-medium text-slate-400"
                          >
                            파일 업로드
                          </button>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>

              <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3">
                <p className="text-sm text-slate-600">
                  총{" "}
                  <span className="font-semibold text-slate-950">
                    {bomItems.length}
                  </span>
                  개 품목
                </p>

                <p className="text-xs text-slate-500">
                  파트 파일 업로드는 다음 단계에서
                  연결합니다.
                </p>
              </div>
            </div>
          )}
        </section>

        {/* 공통 첨부파일 */}
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-base font-semibold text-slate-950">
              공통 첨부파일
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              특정 BOM 품목이 아닌 프로젝트 전체에
              적용되는 도면과 기술자료를 등록합니다.
            </p>
          </div>

          <div className="p-6">
            <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
              <p className="text-sm font-medium text-slate-700">
                PDF, DWG, STEP 파일 업로드
              </p>

              <p className="mt-1 text-sm text-slate-500">
                파일 저장소 구조 확인 후 공통 첨부파일
                업로드 기능을 연결합니다.
              </p>
            </div>
          </div>
        </section>

        {/* 하단 버튼 */}
        <footer className="flex items-center justify-end gap-3 pb-4">
          <button
            type="button"
            className="h-10 rounded-md border border-slate-300 bg-white px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            취소
          </button>

          <button
            type="button"
            onClick={handleTemporarySave}
            disabled={isSaving}
            className="h-10 rounded-md border border-slate-900 bg-white px-5 text-sm font-medium text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving
              ? "저장 중..."
              : "임시저장"}
          </button>

          <button
            type="button"
            disabled
            className="h-10 cursor-not-allowed rounded-md bg-slate-300 px-5 text-sm font-semibold text-white"
          >
            RFQ 요청
          </button>
        </footer>
      </div>
    </WorkspaceLayout>
  );
}