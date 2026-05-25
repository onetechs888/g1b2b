"use client";

import Link from "next/link";
import { useState } from "react";

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

export default function HomePage() {
  const [loginType, setLoginType] = useState<"customer" | "partner">(
    "customer"
  );

  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="min-h-screen bg-[#071120] text-white">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[55%_45%]">
        {/* LEFT */}
        <section className="relative hidden overflow-hidden px-16 py-12 lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_62%_18%,rgba(20,91,255,0.32),transparent_34%),linear-gradient(135deg,rgba(7,17,32,0.98),rgba(7,17,32,0.76))]" />

          <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:48px_48px]" />

          <div className="absolute inset-x-0 bottom-0 h-[46%] bg-gradient-to-t from-[#020711] via-[#071120]/80 to-transparent" />

          <div className="relative z-10">
            <div className="mb-20 flex items-center gap-5">
              <div className="text-5xl font-black tracking-tight">
                G<span className="text-[#145BFF]">1</span>
              </div>

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
            <InfoBlock
              icon={<ShieldCheck />}
              title="Secure Access"
              desc="안전한 접근 관리"
            />

            <InfoBlock
              icon={<Network />}
              title="Manufacturing Network"
              desc="신뢰할 수 있는 네트워크"
            />

            <InfoBlock
              icon={<Database />}
              title="Data Protection"
              desc="데이터 보호"
            />

            <InfoBlock
              icon={<BarChart3 />}
              title="Operational Excellence"
              desc="운영 효율성 향상"
            />
          </div>

          <div className="relative z-10 text-xs text-white/55">
            © 2026 G1. All rights reserved.
          </div>
        </section>

        {/* RIGHT */}
        <section className="flex min-h-screen items-center justify-center bg-[#06101f] px-5 py-10">
          <div className="w-full max-w-[540px] rounded-2xl border border-slate-200 bg-white px-10 py-10 text-slate-900 shadow-xl">
            {/* LOGIN TAB */}
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

            {/* FORM */}
            <form className="space-y-7">
              {/* ID */}
              <div>
                <label className="mb-3 block text-sm font-bold">
                  아이디
                </label>

                <div className="flex h-[58px] items-center rounded-lg border border-slate-300 px-4 focus-within:border-[#145BFF]">
                  <User className="mr-4 h-5 w-5 text-slate-500" />

                  <input
                    type="text"
                    placeholder="아이디를 입력하세요"
                    className="h-full w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* PASSWORD */}
              <div>
                <label className="mb-3 block text-sm font-bold">
                  비밀번호
                </label>

                <div className="flex h-[58px] items-center rounded-lg border border-slate-300 px-4 focus-within:border-[#145BFF]">
                  <Lock className="mr-4 h-5 w-5 text-slate-500" />

                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="비밀번호를 입력하세요"
                    className="h-full w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="text-slate-500"
                  >
                    {showPassword ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                </div>
              </div>

              {/* OPTIONS */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-slate-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300"
                  />
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

              {/* LOGIN BUTTON */}
              <button
                type="submit"
                className="h-[52px] w-full rounded-lg bg-[#145BFF] text-base font-bold text-white transition hover:bg-[#0647C8]"
              >
                로그인
              </button>

              {/* DIVIDER */}
              <div className="flex items-center gap-5 text-xs text-slate-400">
                <div className="h-px flex-1 bg-slate-200" />
                또는
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              {/* SIGNUP BUTTON */}
              <Link
                href="/signup"
                className="flex h-[52px] w-full items-center justify-center rounded-lg border border-[#145BFF] text-base font-bold text-[#0647C8] transition hover:bg-blue-50"
              >
                회원가입
              </Link>
            </form>

            {/* SECURITY */}
            <div className="mt-8 flex items-center gap-5 rounded-xl bg-slate-50 px-5 py-5">
              <ShieldCheck className="h-10 w-10 text-[#145BFF]" />

              <div className="h-12 w-px bg-[#145BFF]/30" />

              <div>
                <p className="mb-1 text-sm font-bold">
                  Enterprise Security
                </p>

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

      <p className="mb-1 text-xs font-bold text-white">
        {title}
      </p>

      <p className="text-xs leading-5 text-white/65">
        {desc}
      </p>
    </div>
  );
}