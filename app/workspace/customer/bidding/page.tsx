"use client";

import { useState } from "react";

// 실제 supabase 파일 경로에 맞게 이 한 줄만 조정해 주세요.
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

export default function CustomerBiddingPage() {
  const [form, setForm] = useState<BiddingForm>(initialForm);
  const [isSaving, setIsSaving] = useState(false);

  const updateField = (
    field: keyof BiddingForm,
    value: string,
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

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
        throw new Error("로그인 사용자 정보를 확인할 수 없습니다.");
      }

      // 2. public.users에서 회사 정보 확인
      const {
        data: userProfile,
        error: profileError,
      } = await supabase
        .from("users")
        .select("id, company_id, role, status")
        .eq("id", user.id)
        .single();

      if (profileError) {
        throw profileError;
      }

      if (!userProfile.company_id) {
        throw new Error("사용자의 소속 회사 정보를 확인할 수 없습니다.");
      }

      if (userProfile.role !== "customer") {
        throw new Error("고객 계정만 입찰요청을 생성할 수 있습니다.");
      }

      // 현재 users 테이블의 실제 활성 상태값에 맞춤
      if (
        userProfile.status !== "active" &&
        userProfile.status !== "approved"
      ) {
        throw new Error("활성화된 고객 계정이 아닙니다.");
      }

      // 3. bidding_requests에 임시저장
      const {
        data: savedBidding,
        error: insertError,
      } = await supabase
        .from("bidding_requests")
        .insert({
          customer_company_id: userProfile.company_id,
          selected_partner_company_id: null,
          project_id: null,

          project_name: form.projectName.trim(),
          status: "draft",

          bid_deadline: form.bidDeadline
            ? new Date(form.bidDeadline).toISOString()
            : null,

          due_date: form.dueDate || null,

          minimum_partner_tier:
            form.minimumPartnerTier || null,

          description: form.description.trim() || null,
          memo: form.memo.trim() || null,

          created_by: user.id,
        })
        .select("id, project_name, status")
        .single();

      if (insertError) {
        throw insertError;
      }

      console.log("입찰 임시저장 완료:", savedBidding);

      alert("입찰요청이 임시저장되었습니다.");
    } catch (error) {
      console.error("입찰 임시저장 실패:", error);

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
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header>
          <p className="text-sm font-medium text-slate-500">
            입찰관리 &gt; 입찰요청
          </p>

          <h1 className="mt-2 text-2xl font-bold text-slate-950">
            입찰요청
          </h1>

          <p className="mt-1 text-sm text-slate-600">
            경쟁입찰을 위한 프로젝트 기본정보를 등록합니다.
          </p>
        </header>

        <section className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-base font-semibold text-slate-950">
              입찰 기본정보
            </h2>
          </div>

          <div className="grid gap-5 p-6 md:grid-cols-2">
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-slate-700">
                프로젝트명
                <span className="ml-1 text-red-600">*</span>
              </span>

              <input
                type="text"
                value={form.projectName}
                onChange={(event) =>
                  updateField("projectName", event.target.value)
                }
                placeholder="프로젝트명을 입력해 주세요."
                className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-slate-900"
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
                  updateField("bidDeadline", event.target.value)
                }
                className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-slate-900"
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
                  updateField("dueDate", event.target.value)
                }
                className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-slate-900"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">
                최소 파트너 티어
              </span>

              <select
                value={form.minimumPartnerTier}
                onChange={(event) =>
                  updateField(
                    "minimumPartnerTier",
                    event.target.value,
                  )
                }
                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-900"
              >
                <option value="">제한 없음</option>
                <option value="tier_1">Tier 1</option>
                <option value="tier_2">Tier 2</option>
                <option value="tier_3">Tier 3</option>
              </select>
            </label>

            <div />

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-slate-700">
                프로젝트 설명
              </span>

              <textarea
                rows={5}
                value={form.description}
                onChange={(event) =>
                  updateField("description", event.target.value)
                }
                placeholder="가공 조건, 품질 요구사항, 납품 조건 등 파트너에게 공개할 내용을 입력해 주세요."
                className="w-full resize-none rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
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
                  updateField("memo", event.target.value)
                }
                placeholder="고객사 내부에서만 확인할 메모를 입력해 주세요."
                className="w-full resize-none rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
              />
            </label>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-base font-semibold text-slate-950">
              입찰 BOM
            </h2>
          </div>

          <div className="p-6">
            <div className="rounded-md border border-dashed border-slate-300 px-6 py-10 text-center">
              <p className="text-sm font-medium text-slate-700">
                BOM 등록 영역
              </p>

              <p className="mt-1 text-sm text-slate-500">
                기본정보 저장 검증 후 다음 단계에서 연결합니다.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-base font-semibold text-slate-950">
              첨부파일
            </h2>
          </div>

          <div className="p-6">
            <div className="rounded-md border border-dashed border-slate-300 px-6 py-10 text-center">
              <p className="text-sm font-medium text-slate-700">
                PDF, DWG, STEP 파일 업로드
              </p>

              <p className="mt-1 text-sm text-slate-500">
                파일 저장소 구조 확인 후 다음 단계에서 연결합니다.
              </p>
            </div>
          </div>
        </section>

        <footer className="flex justify-end gap-3 pb-6">
          <button
            type="button"
            className="h-10 rounded-md border border-slate-300 bg-white px-5 text-sm font-medium text-slate-700"
          >
            취소
          </button>

          <button
            type="button"
            onClick={handleTemporarySave}
            disabled={isSaving}
            className="h-10 rounded-md border border-slate-900 bg-white px-5 text-sm font-medium text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? "저장 중..." : "임시저장"}
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
    </div>
  );
}