"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  ChevronDown,
  Eye,
  EyeOff,
  Factory,
  Lock,
  ShieldCheck,
  Database,
  BarChart3,
} from "lucide-react";

type SignupType = "customer" | "partner";

const steps = ["가입 유형 선택", "기본 정보 입력", "상세 정보 입력", "가입 신청 완료"];

export default function SignupPage() {
  const [step, setStep] = useState(1);
  const [signupType, setSignupType] = useState<SignupType>("customer");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [formData, setFormData] = useState({
    companyName: "",
    businessNumber: "",
    name: "",
    email: "",
    phone: "",
    password: "",
    passwordConfirm: "",
    region: "",
    industry: "",

    mainOrderItems: "",
    manufacturingFields: "",
    expectedMonthlyOrder: "",
    interestedServices: [] as string[],

    processes: "",
    equipment: "",
    materials: "",
    availableRegions: "",
    qualityCertifications: [] as string[],
    companyIntro: "",
    mainProducts: "",
  });

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleArrayField = (
    field: "interestedServices" | "qualityCertifications",
    value: string
  ) => {
    setFormData((prev) => {
      const current = prev[field];
      return {
        ...prev,
        [field]: current.includes(value)
          ? current.filter((item) => item !== value)
          : [...current, value],
      };
    });
  };

  const goNext = () => setStep((prev) => Math.min(prev + 1, 4));
  const goPrev = () => setStep((prev) => Math.max(prev - 1, 1));


const handleSignupSubmit = async () => {
  try {
    console.log("SUPABASE URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log("SUPABASE KEY 있음:", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    setErrorMessage("");

    if (!formData.email || !formData.password) {
      setErrorMessage("이메일과 비밀번호를 입력해주세요.");
      return;
    }

    if (formData.password !== formData.passwordConfirm) {
      setErrorMessage("비밀번호가 일치하지 않습니다.");
      return;
    }

    setIsSubmitting(true);

    console.log("회원가입 시작:", formData);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          role: signupType,
          company_name: formData.companyName,
          name: formData.name,
        },
      },
    });

    if (authError) throw authError;

    const userId = authData.user?.id;

    if (!userId) {
      throw new Error("auth user id가 생성되지 않았습니다.");
    }

console.log("Auth 생성 완료:", userId);

const { data: companyData, error: companyError } =
  await supabase
    .from("companies")
.insert({
  company_name: formData.companyName,
  business_number: formData.businessNumber,
  industry: formData.industry,
  company_type: signupType,
})
    .select("id")
    .single();

if (companyError) {
  console.error("companies insert 실패:", companyError);
  throw companyError;
}

console.log("companies 생성 완료:", companyData);

setStep(4);
  } catch (error: unknown) {
    console.error("회원가입 실패 전체:", error);

    if (typeof error === "object" && error !== null) {
      console.error("회원가입 실패 상세:", JSON.stringify(error, null, 2));
      setErrorMessage(JSON.stringify(error, null, 2));
    } else {
      setErrorMessage(String(error));
    }
  } finally {
    setIsSubmitting(false);
  }
};
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[45%_55%]">
        <section className="relative hidden overflow-hidden bg-[#071120] px-14 py-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_56%_30%,rgba(20,91,255,0.25),transparent_35%),linear-gradient(135deg,rgba(7,17,32,0.98),rgba(7,17,32,0.78))]" />
          <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:48px_48px]" />
          <div className="absolute inset-x-0 bottom-0 h-[48%] bg-gradient-to-t from-[#020711] via-[#071120]/75 to-transparent" />

          <div className="relative z-10">
            <div className="mb-20 flex items-center gap-4">
              <div className="text-5xl font-black tracking-tight">
                G<span className="text-[#145BFF]">1</span>
              </div>
              <div className="text-xs font-bold uppercase tracking-[0.16em]">
                Manufacturing
                <br />
                Operations Platform
              </div>
            </div>

            <h1 className="mb-7 text-[42px] font-extrabold leading-[1.35] tracking-[-0.04em]">
              제조 운영 네트워크에
              <br />
              기업을 등록하세요
            </h1>

            <p className="max-w-[520px] text-[15px] leading-8 text-white/82">
              <span className="font-bold text-[#3F8CFF]">고객사와 파트너사</span>를
              구분하여 제조 프로젝트, 생산, 품질, 출하 흐름을 하나의 시스템에서
              운영합니다.
            </p>
          </div>

          <div className="relative z-10 grid grid-cols-4 gap-3 rounded-2xl border border-white/10 bg-black/10 px-5 py-6 backdrop-blur-sm">
            <HeroMini icon={<ShieldCheck />} text="신뢰할 수 있는 제조 네트워크" />
            <HeroMini icon={<Database />} text="안전한 데이터 보호" />
            <HeroMini icon={<BarChart3 />} text="효율적인 운영 관리" />
            <HeroMini icon={<Lock />} text="기업 보안 체계 적용" />
          </div>
        </section>

        <section className="flex min-h-screen bg-slate-50">
          <aside className="hidden w-[190px] border-r border-slate-200 bg-white px-8 py-10 lg:block">
            <Link href="/" className="mb-8 block text-4xl font-black tracking-tight">
              G<span className="text-[#145BFF]">1</span>
            </Link>
            <p className="mb-12 text-sm font-bold">회원가입</p>

            <div className="space-y-6">
              {steps.map((label, index) => {
                const number = index + 1;
                const active = step === number;
                const done = step > number;

                return (
                  <div key={label} className="flex items-center gap-3">
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                        active
                          ? "bg-[#145BFF] text-white"
                          : done
                            ? "bg-blue-50 text-[#145BFF]"
                            : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      {done ? <Check size={13} /> : number}
                    </div>
                    <span
                      className={`text-xs font-semibold ${
                        active ? "text-[#145BFF]" : "text-slate-500"
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </aside>

          <div className="flex flex-1 items-center justify-center px-5 py-10">
            <div className="w-full max-w-[760px] rounded-2xl border border-slate-200 bg-white px-10 py-9 shadow-sm">
              {step === 1 && (
                <>
                  <StepHeader step="STEP 1" title="가입 유형을 선택해주세요." />

                  <div className="mt-8 grid gap-5 md:grid-cols-2">
                    <TypeCard
                      active={signupType === "customer"}
                      icon={<Building2 />}
                      title="고객사 가입"
                      desc="제조 프로젝트 등록, 발주 요청, 생산 진행률, 품질 및 출하 상태를 확인하는 기업 계정입니다."
                      items={["프로젝트 / 발주 등록", "BOM 진행 확인", "QC 상태 확인", "출하 상태 확인"]}
                      onClick={() => setSignupType("customer")}
                    />

                    <TypeCard
                      active={signupType === "partner"}
                      icon={<Factory />}
                      title="파트너사 가입"
                      desc="생산 실행, 견적 대응, 공정 업데이트, 검사 요청 및 출하 대응을 수행하는 제조 파트너 계정입니다."
                      items={["견적 / 발주 대응", "생산 진행 업데이트", "QC 요청", "출하 요청"]}
                      onClick={() => setSignupType("partner")}
                    />
                  </div>

                  <NoticeBox text="가입 유형에 따라 입력 정보가 다르게 구성됩니다. 정확한 유형 선택이 원활한 서비스 이용에 도움이 됩니다." />
                  <BottomButtons onlyNext onNext={goNext} />
                </>
              )}

              {step === 2 && (
                <>
                  <StepHeader step="STEP 2" title="기본 회사 정보를 입력해주세요." />

                  <div className="mt-7 grid gap-5 md:grid-cols-2">
                    <Input label="회사명" value={formData.companyName} onChange={(v) => updateField("companyName", v)} />
                    <Input label="사업자등록번호" value={formData.businessNumber} onChange={(v) => updateField("businessNumber", v)} />
                    <Input label="담당자명" value={formData.name} onChange={(v) => updateField("name", v)} />
                    <Input label="이메일" value={formData.email} onChange={(v) => updateField("email", v)} />
                    <Input label="연락처" value={formData.phone} onChange={(v) => updateField("phone", v)} />
                    <Input label="지역" value={formData.region} onChange={(v) => updateField("region", v)} />
<PasswordInput
  label="비밀번호"
  value={formData.password}
  onChange={(v: string) => updateField("password", v)}
  show={showPassword}
  onToggle={() => setShowPassword((p) => !p)}
/>

<PasswordInput
  label="비밀번호 확인"
  value={formData.passwordConfirm}
  onChange={(v: string) => updateField("passwordConfirm", v)} show={showPasswordConfirm} onToggle={() => setShowPasswordConfirm((p) => !p)} />
                    <Input label="업종" value={formData.industry} onChange={(v) => updateField("industry", v)} />
                  </div>

                  <BottomButtons onPrev={goPrev} onNext={goNext} />
                </>
              )}

              {step === 3 && (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <StepHeader
                      step="STEP 3"
                      title={
                        signupType === "customer"
                          ? "고객사 정보를 입력해주세요."
                          : "파트너사 정보를 입력해주세요."
                      }
                    />
                    <span className="rounded-md border border-[#145BFF] px-3 py-2 text-xs font-bold text-[#145BFF]">
                      {signupType === "customer" ? "고객사 가입" : "파트너사 가입"}
                    </span>
                  </div>

                  {signupType === "customer" ? (
                    <CustomerFields
                      formData={formData}
                      updateField={updateField}
                      toggleArrayField={toggleArrayField}
                    />
                  ) : (
                    <PartnerFields
                      formData={formData}
                      updateField={updateField}
                      toggleArrayField={toggleArrayField}
                    />
                  )}

                  {errorMessage && (
                    <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                      {errorMessage}
                    </div>
                  )}

                  <BottomButtons
                    onPrev={goPrev}
                    onNext={handleSignupSubmit}
                    nextText={isSubmitting ? "저장 중..." : "가입 신청"}
                    disabled={isSubmitting}
                  />
                </>
              )}

              {step === 4 && (
                <>
                  <StepHeader step="STEP 4" title="회원가입 신청이 완료되었습니다." />

                  <div className="flex min-h-[430px] flex-col items-center justify-center text-center">
                    <div className="mb-7 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100">
                      <Check className="h-12 w-12 text-emerald-600" />
                    </div>

                    <h2 className="mb-5 text-2xl font-extrabold">
                      회원가입 신청이 접수되었습니다.
                    </h2>

                    <p className="mb-9 text-sm leading-7 text-slate-600">
                      G1 운영팀 검토 후 계정 사용이 승인됩니다.
                      <br />
                      승인 완료 시 등록하신 이메일로 안내드리겠습니다.
                    </p>

                    <Link
                      href="/"
                      className="flex h-[52px] w-full items-center justify-center rounded-lg bg-[#145BFF] text-sm font-bold text-white transition hover:bg-[#0647C8]"
                    >
                      로그인 화면으로 이동
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function StepHeader({ step, title }: { step: string; title: string }) {
  return (
    <div>
      <p className="mb-3 text-xs font-extrabold text-[#145BFF]">{step}</p>
      <h1 className="text-2xl font-extrabold tracking-[-0.03em] text-slate-950">{title}</h1>
    </div>
  );
}

function TypeCard({ active, icon, title, desc, items, onClick }: any) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border bg-white px-7 py-8 text-left transition ${
        active ? "border-[#145BFF] shadow-sm" : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
      }`}
    >
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-[#145BFF] [&_svg]:h-10 [&_svg]:w-10">
        {icon}
      </div>
      <h2 className={`mb-4 text-center text-xl font-extrabold ${active ? "text-[#145BFF]" : "text-slate-900"}`}>
        {title}
      </h2>
      <p className="mb-6 min-h-[72px] text-center text-sm leading-6 text-slate-600">{desc}</p>
      <div className="mb-5 h-px bg-slate-200" />
      <p className="mb-3 text-sm font-bold text-slate-700">주요 기능</p>
      <ul className="space-y-2">
        {items.map((item: string) => (
          <li key={item} className="flex items-center gap-2 text-sm text-slate-700">
            <Check size={15} className="text-[#145BFF]" />
            {item}
          </li>
        ))}
      </ul>
    </button>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold text-slate-700">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`${label} 입력`}
        className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#145BFF]"
      />
    </label>
  );
}

function PasswordInput({ label, value, onChange, show, onToggle }: any) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold text-slate-700">{label}</span>
      <div className="flex h-11 items-center rounded-lg border border-slate-300 px-3 transition focus-within:border-[#145BFF]">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`${label} 입력`}
          className="h-full w-full text-sm outline-none placeholder:text-slate-400"
        />
        <button type="button" onClick={onToggle} className="text-slate-400">
          {show ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
    </label>
  );
}

function CustomerFields({ formData, updateField, toggleArrayField }: any) {
  return (
    <div className="mt-7 space-y-5">
<Input label="주요 발주 품목" value={formData.mainOrderItems} onChange={(v: string) => updateField("mainOrderItems", v)} />
<Input label="제조 요청 분야" value={formData.manufacturingFields} onChange={(v: string) => updateField("manufacturingFields", v)} />
<Input label="예상 월 발주 규모" value={formData.expectedMonthlyOrder} onChange={(v: string) => updateField("expectedMonthlyOrder", v)} />
      <CheckGrid field="interestedServices" selected={formData.interestedServices} onToggle={toggleArrayField} items={["프로젝트 관리", "생산 진행 관리", "품질 관리", "출하 관리", "파트너 네트워크", "데이터 분석"]} />
    </div>
  );
}

function PartnerFields({ formData, updateField, toggleArrayField }: any) {
  return (
    <div className="mt-7 space-y-5">
<Input label="보유 공정" value={formData.processes} onChange={(v: string) => updateField("processes", v)} />
<Input label="보유 장비" value={formData.equipment} onChange={(v: string) => updateField("equipment", v)} />
<Input label="생산 가능 소재" value={formData.materials} onChange={(v: string) => updateField("materials", v)} />
<Input label="대응 가능 지역" value={formData.availableRegions} onChange={(v: string) => updateField("availableRegions", v)} />
<Input label="주요 생산 품목" value={formData.mainProducts} onChange={(v: string) => updateField("mainProducts", v)} />
      <label className="block">
        <span className="mb-2 block text-xs font-bold text-slate-700">회사 소개</span>
        <textarea
          value={formData.companyIntro}
          onChange={(e) => updateField("companyIntro", e.target.value)}
          placeholder="회사 소개 및 주요 제조 역량을 입력하세요"
          className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#145BFF]"
        />
      </label>
    </div>
  );
}

function CheckGrid({ field, selected, onToggle, items }: any) {
  return (
    <div>
      <p className="mb-3 text-xs font-bold text-slate-700">선택 항목</p>
      <div className="grid gap-3 md:grid-cols-3">
        {items.map((item: string) => (
          <label key={item} className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={selected.includes(item)}
              onChange={() => onToggle(field, item)}
              className="h-4 w-4 rounded border-slate-300"
            />
            {item}
          </label>
        ))}
      </div>
    </div>
  );
}

function NoticeBox({ text }: { text: string }) {
  return <div className="mt-8 rounded-xl bg-slate-50 px-5 py-5 text-sm leading-6 text-slate-600">{text}</div>;
}

function BottomButtons({ onlyNext, onPrev, onNext, nextText = "다음", disabled = false }: any) {
  return (
    <div className="mt-10 flex justify-between gap-4">
      {onlyNext ? (
        <div />
      ) : (
        <button type="button" onClick={onPrev} className="flex h-[52px] w-40 items-center justify-center gap-2 rounded-lg border border-slate-300 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
          <ArrowLeft size={16} />
          이전
        </button>
      )}

      <button type="button" onClick={onNext} disabled={disabled} className="flex h-[52px] w-40 items-center justify-center gap-2 rounded-lg bg-[#145BFF] text-sm font-bold text-white transition hover:bg-[#0647C8] disabled:cursor-not-allowed disabled:bg-slate-400">
        {nextText}
        {!disabled && <ArrowRight size={16} />}
      </button>
    </div>
  );
}

function HeroMini({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="border-r border-white/10 pr-3 last:border-r-0">
      <div className="mb-3 text-[#76A9FF] [&_svg]:h-8 [&_svg]:w-8">{icon}</div>
      <p className="text-xs font-semibold leading-5 text-white/90">{text}</p>
    </div>
  );
}