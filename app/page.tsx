"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

import {
  BarChart3,
  ChevronRight,
  Database,
  Eye,
  EyeOff,
  Lock,
  Network,
  ShieldCheck,
  User,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function HomePage() {
  const router = useRouter();

  const [loginType, setLoginType] = useState<"customer" | "partner">(
    "customer"
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setErrorMessage("");

      if (!email || !password) {
        setErrorMessage("이메일과 비밀번호를 입력해주세요.");
        return;
      }

      setIsLoggingIn(true);

      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (authError) {
        throw authError;
      }

      const authUser = authData.user;

      if (!authUser) {
        throw new Error("로그인 사용자 정보를 찾을 수 없습니다.");
      }

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, role, status, company_id, name, email")
        .eq("id", authUser.id)
        .single();

      if (userError) {
        throw userError;
      }

      if (!userData) {
        setErrorMessage("G1 운영 사용자 정보가 없습니다.");
        await supabase.auth.signOut();
        return;
      }

      if (userData.status === "pending") {
        setErrorMessage("현재 승인 대기 상태입니다. G1 운영팀 승인 후 이용 가능합니다.");
        await supabase.auth.signOut();
        return;
      }

      if (userData.status === "rejected") {
        setErrorMessage("가입 신청이 반려되었습니다. G1 운영팀에 문의해주세요.");
        await supabase.auth.signOut();
        return;
      }

if (userData.status !== "active") {
        setErrorMessage("계정 상태를 확인할 수 없습니다. G1 운영팀에 문의해주세요.");
        await supabase.auth.signOut();
        return;
      }

      if (userData.role !== loginType) {
        setErrorMessage(
          loginType === "customer"
            ? "고객 계정이 아닙니다. 파트너 로그인을 선택해주세요."
            : "파트너 계정이 아닙니다. 고객 로그인을 선택해주세요."
        );

        await supabase.auth.signOut();
        return;
      }

      if (userData.role === "customer") {
        router.push("/workspace/customer");
        return;
      }

      if (userData.role === "partner") {
        router.push("/workspace/partner");
        return;
      }

      if (userData.role === "quality_manager") {
        router.push("/workspace/quality");
        return;
      }

      if (userData.role === "g1_admin") {
        router.push("/workspace");
        return;
      }

      setErrorMessage("지원하지 않는 사용자 권한입니다.");
      await supabase.auth.signOut();
    } catch (error: unknown) {
      console.error("로그인 실패:", error);

      if (typeof error === "object" && error !== null) {
        setErrorMessage(JSON.stringify(error, null, 2));
      } else {
        setErrorMessage(String(error));
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#071120] text-white">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[55%_45%]">
        <section className="relative hidden overflow-hidden px-16 py-12 lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_62%_18%,rgba(20,91,255,0.32),transparent_34%),linear-gradient(135deg,rgba(7,17,32,0.98),rgba(7,17,32,0.76))]" />
          <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:48px_48px]" />
          <div className="absolute inset-x-0 bottom-0 h-[46%] bg-gradient-to-t from-[#020711] via-[#071120]/80 to-transparent" />

          <div className="relative z-10">
            <div className="mb-20 flex items-center gap-5">
              <Link
                href="/"
                className="text-5xl font-black tracking-tight transition hover:opacity-80"
              >
                G<span className="text-[#145BFF]">1</span>
              </Link>

              <div className="h-10 w-px bg-white/25" />

              <div className="text-sm font-semibold tracking-[0.22em]">
                MANUFACTURING
                <br />
                OPERATIONS
              </div>
            </div>

            <div className="mb-8 h-1 w-14 bg-[#145BFF]" />

            <h1 className="mb-6 text-[46px] font-extrabold leading-[1.35] tracking-[-0.04em]">
              제조 프로젝트 운영을
              <br />
              하나의 시스템으로
            </h1>

            <p className="mb-8 text-xl font-semibold text-[#2580FF]">
              Manufacturing Connects Business
            </p>

            <p className="max-w-xl text-[15px] leading-7 text-white/80">
              G1은 제조 프로젝트의 시작부터 납품까지
              <br />
              모든 과정을 연결하는 Manufacturing Operations Platform 입니다.
            </p>
          </div>

          <div className="relative z-10 grid grid-cols-4 gap-4 border-t border-white/15 pt-8">
            <InfoBlock icon={<ShieldCheck />} title="Secure Access" desc="안전한 접근 관리" />
            <InfoBlock icon={<Network />} title="Manufacturing Network" desc="신뢰할 수 있는 네트워크" />
            <InfoBlock icon={<Database />} title="Data Protection" desc="데이터 보호" />
            <InfoBlock icon={<BarChart3 />} title="Operational Excellence" desc="운영 효율성 향상" />
          </div>

          <div className="relative z-10 text-xs text-white/55">
            © 2026 G1. All rights reserved.
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center bg-[#06101f] px-5 py-10">
          <div className="w-full max-w-[540px] rounded-2xl border border-slate-200 bg-white px-10 py-10 text-slate-900 shadow-xl">
            <div className="mb-9 grid grid-cols-2 border-b border-slate-200">
              <button
                type="button"
                onClick={() => setLoginType("customer")}
                className={`pb-5 text-lg font-bold transition ${
                  loginType === "customer"
                    ? "border-b-2 border-[#145BFF] text-[#0647C8]"
                    : "text-slate-500"
                }`}
              >
                고객 로그인
              </button>

              <button
                type="button"
                onClick={() => setLoginType("partner")}
                className={`pb-5 text-lg font-bold transition ${
                  loginType === "partner"
                    ? "border-b-2 border-[#145BFF] text-[#0647C8]"
                    : "text-slate-500"
                }`}
              >
                파트너 로그인
              </button>
            </div>

            <form className="space-y-7" onSubmit={handleLogin}>
              <div>
                <label className="mb-3 block text-sm font-bold">이메일</label>

                <div className="flex h-[58px] items-center rounded-lg border border-slate-300 px-4 focus-within:border-[#145BFF]">
                  <User className="mr-4 h-5 w-5 text-slate-500" />

                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="이메일을 입력하세요"
                    className="h-full w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="mb-3 block text-sm font-bold">비밀번호</label>

                <div className="flex h-[58px] items-center rounded-lg border border-slate-300 px-4 focus-within:border-[#145BFF]">
                  <Lock className="mr-4 h-5 w-5 text-slate-500" />

                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="비밀번호를 입력하세요"
                    className="h-full w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="text-slate-500"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-slate-700">
                  <input type="checkbox" className="h-4 w-4 rounded border-slate-300" />
                  아이디 저장
                </label>

                <button
                  type="button"
                  className="flex items-center gap-1 font-semibold text-[#0647C8]"
                >
                  비밀번호 찾기
                  <ChevronRight size={16} />
                </button>
              </div>

              {errorMessage && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-6 text-red-600">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoggingIn}
                className="h-[52px] w-full rounded-lg bg-[#145BFF] text-base font-bold text-white transition hover:bg-[#0647C8] disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isLoggingIn ? "로그인 확인 중..." : "로그인"}
              </button>

              <div className="flex items-center gap-5 text-xs text-slate-400">
                <div className="h-px flex-1 bg-slate-200" />
                또는
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <Link
                href="/signup"
                className="flex h-[52px] w-full items-center justify-center rounded-lg border border-[#145BFF] text-base font-bold text-[#0647C8] transition hover:bg-blue-50"
              >
                회원가입
              </Link>
            </form>

            <div className="mt-8 flex items-center gap-5 rounded-xl bg-slate-50 px-5 py-5">
              <ShieldCheck className="h-10 w-10 text-[#145BFF]" />
              <div className="h-12 w-px bg-[#145BFF]/30" />

              <div>
                <p className="mb-1 text-sm font-bold">Enterprise Security</p>
                <p className="text-sm leading-6 text-slate-600">
                  G1은 안전한 제조 공급망 연결을 위해
                  <br />
                  최고 수준의 보안 환경을 제공합니다.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function InfoBlock({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="border-r border-white/15 pr-4 last:border-r-0">
      <div className="mb-3 text-[#4F94FF] [&_svg]:h-8 [&_svg]:w-8">
        {icon}
      </div>

      <p className="mb-1 text-xs font-bold text-white">{title}</p>
      <p className="text-xs leading-5 text-white/65">{desc}</p>
    </div>
  );
}