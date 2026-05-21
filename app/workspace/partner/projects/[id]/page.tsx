"use client";

import Link from "next/link";
import { useState } from "react";

type Props = {
  params: {
    id: string;
  };
};

export default function PartnerProjectDetailPage({
  params,
}: Props) {
  const [items, setItems] = useState([
    {
      no: 1,
      name: "Chamber Body",
      drawing: "CH-01",
      qty: 2,
      unit: "EA",
      process: "가공중",
      progress: 60,
      status: "작업중",
    },
    {
      no: 2,
      name: "Cover Plate",
      drawing: "CH-02",
      qty: 2,
      unit: "EA",
      process: "가공중",
      progress: 40,
      status: "작업중",
    },
    {
      no: 3,
      name: "Side Plate",
      drawing: "CH-03",
      qty: 2,
      unit: "EA",
      process: "후공정",
      progress: 70,
      status: "작업중",
    },
    {
      no: 4,
      name: "Base Plate",
      drawing: "CH-04",
      qty: 1,
      unit: "EA",
      process: "검사중",
      progress: 90,
      status: "검사중",
    },
    {
      no: 5,
      name: "Bracket",
      drawing: "CH-05",
      qty: 4,
      unit: "EA",
      process: "가공중",
      progress: 30,
      status: "작업중",
    },
    {
      no: 6,
      name: "Bolt",
      drawing: "CH-06",
      qty: 20,
      unit: "EA",
      process: "완료",
      progress: 100,
      status: "완료",
    },
  ]);

  const processOptions = [
    "대기",
    "가공중",
    "후공정",
    "검사중",
    "출하 준비",
    "완료",
  ];

  const handleProcessChange = (
    index: number,
    value: string
  ) => {
    const updated = [...items];
    updated[index].process = value;
    setItems(updated);
  };

  return (
    <main className="min-h-screen bg-[#f6f6f4] text-black">
      <div className="grid min-h-screen lg:grid-cols-[230px_1fr]">
        <aside className="hidden lg:flex flex-col justify-between border-r border-gray-200 bg-white px-5 py-8">
          <div>
            <div className="mb-12">
              <h1 className="text-4xl font-extrabold tracking-tight">
                G1B2B
              </h1>

              <p className="mt-2 text-sm text-gray-500">
                Partner Workspace
              </p>
            </div>

            <nav className="space-y-2">
              {[
                ["업무관리", "/workspace"],
                ["파트너 업무관리", "/workspace/partner"],
                ["품질관리", "/workspace/quality"],
                ["설정", "/workspace/settings"],
              ].map(([label, href]) => (
                <Link
                  key={label}
                  href={href}
                  className={`flex items-center rounded-2xl px-4 py-3 text-sm font-bold transition ${
                    label === "파트너 업무관리"
                      ? "bg-black text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-sm font-bold text-white">
                M
              </div>

              <div>
                <p className="text-sm font-bold">
                  Partner PM Center
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  (주)미래정밀
                </p>
              </div>
            </div>

            <button className="mt-5 w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-bold hover:border-black">
              로그아웃
            </button>
          </div>
        </aside>

        <section className="px-9 py-7">
          <div className="mb-5 text-xs text-gray-500">
            파트너 업무관리 〉 프로젝트 상세 〉 생산 관리
          </div>

          <header className="mb-6 flex items-start justify-between gap-5">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <h2 className="text-3xl font-extrabold">
                  Chamber 부품 제작 외 15종
                </h2>

                <span className="rounded-full border border-gray-300 px-3 py-1 text-xs font-bold">
                  가공중
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-5 text-xs text-gray-500">
                <span>발주처 미래정밀(주)</span>
                <span>프로젝트 번호 PO-2026-0001</span>
                <span>납기일 2026-06-20</span>
                <span>품목 수 16종</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-xs font-bold hover:border-black">
                목록으로
              </button>

              <button className="rounded-xl bg-black px-4 py-2.5 text-xs font-bold text-white hover:opacity-90">
                검사 요청
              </button>

              <button className="rounded-xl bg-black px-4 py-2.5 text-xs font-bold text-white hover:opacity-90">
                납품 확인 요청
              </button>
            </div>
          </header>

          <section className="mb-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="grid grid-cols-5 divide-x divide-gray-200">
              <div className="px-4">
                <p className="mb-3 text-xs font-bold">
                  전체 진행률
                </p>

                <div className="flex items-center gap-3">
                  <span className="text-4xl font-extrabold">
                    42%
                  </span>

                  <div className="h-2 w-40 rounded-full bg-gray-200">
                    <div
                      className="h-2 rounded-full bg-black"
                      style={{ width: "42%" }}
                    />
                  </div>
                </div>

                <p className="mt-3 text-[11px] text-gray-400">
                  기준일 2026-06-04
                </p>
              </div>

              <div className="px-6">
                <p className="mb-3 text-xs font-bold">
                  현재 공정
                </p>

                <button className="flex items-center gap-2 text-3xl font-extrabold">
                  가공중
                  <span className="text-base">⌄</span>
                </button>
              </div>

              <div className="px-6">
                <p className="mb-3 text-xs font-bold">
                  검사 상태
                </p>

                <h3 className="text-3xl font-extrabold">
                  검사 예정
                </h3>
              </div>

              <div className="px-6">
                <p className="mb-3 text-xs font-bold">
                  납품 상태
                </p>

                <h3 className="text-3xl font-extrabold">
                  확인 대기
                </h3>
              </div>

              <div className="px-6">
                <p className="mb-3 text-xs font-bold">
                  납기까지
                </p>

                <h3 className="text-4xl font-extrabold">
                  16일
                </h3>

                <p className="mt-3 text-[11px] text-gray-400">
                  납기일 2026-06-20
                </p>
              </div>
            </div>
          </section>

          <section className="mb-4 flex gap-2 border-b border-gray-200">
            {[
              "생산 관리",
              "공정 관리",
              "검사 관리",
              "출하 관리",
              "이력 관리",
              "문서 관리",
            ].map((tab, index) => (
              <button
                key={tab}
                className={`border-b-2 px-5 py-3 text-xs font-bold ${
                  index === 0
                    ? "border-black text-black"
                    : "border-transparent text-gray-500"
                }`}
              >
                {tab}
              </button>
            ))}
          </section>

          <div className="grid gap-4 xl:grid-cols-[1fr_330px]">
            <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                <h3 className="text-lg font-extrabold">
                  품목 목록
                </h3>

                <div className="flex gap-2">
                  <input
                    placeholder="품목명 검색"
                    className="rounded-xl border border-gray-200 px-3 py-2 text-xs outline-none focus:border-black"
                  />

                  <button className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-bold hover:border-black">
                    필터
                  </button>

                  <button className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-bold hover:border-black">
                    엑셀 다운로드
                  </button>
                </div>
              </div>

              <div className="overflow-auto">
                <table className="w-full min-w-[900px] text-xs">
                  <thead className="bg-[#fafafa] text-[11px] text-gray-500">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">
                        No.
                      </th>

                      <th className="px-4 py-3 text-left font-semibold">
                        품목명
                      </th>

                      <th className="px-4 py-3 text-left font-semibold">
                        도면번호
                      </th>

                      <th className="px-4 py-3 text-left font-semibold">
                        수량
                      </th>

                      <th className="px-4 py-3 text-left font-semibold">
                        단위
                      </th>

                      <th className="px-4 py-3 text-left font-semibold">
                        현재 공정
                      </th>

                      <th className="px-4 py-3 text-left font-semibold">
                        진행률
                      </th>

                      <th className="px-4 py-3 text-left font-semibold">
                        상태
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200">
                    {items.map((item, index) => (
                      <tr
                        key={item.no}
                        className="hover:bg-[#fafafa]"
                      >
                        <td className="px-4 py-3">
                          {item.no}
                        </td>

                        <td className="px-4 py-3 font-semibold">
                          {item.name}
                        </td>

                        <td className="px-4 py-3">
                          {item.drawing}
                        </td>

                        <td className="px-4 py-3">
                          {item.qty}
                        </td>

                        <td className="px-4 py-3">
                          {item.unit}
                        </td>

                        <td className="px-4 py-3">
                          <select
                            value={item.process}
                            onChange={(e) =>
                              handleProcessChange(
                                index,
                                e.target.value
                              )
                            }
                            className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-[11px] font-bold outline-none focus:border-black"
                          >
                            {processOptions.map((option) => (
                              <option
                                key={option}
                                value={option}
                              >
                                {option}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="w-8">
                              {item.progress}%
                            </span>

                            <div className="h-1.5 w-24 rounded-full bg-gray-200">
                              <div
                                className="h-1.5 rounded-full bg-black"
                                style={{
                                  width: `${item.progress}%`,
                                }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={`rounded-lg px-3 py-1.5 text-[11px] font-bold ${
                              item.status === "완료"
                                ? "bg-green-100 text-green-700"
                                : item.status === "검사중"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-center gap-2 border-t border-gray-200 px-6 py-4">
                {["1", "2", "3"].map((page, index) => (
                  <button
                    key={page}
                    className={`h-9 w-9 rounded-lg border text-sm font-bold ${
                      index === 0
                        ? "border-black bg-black text-white"
                        : "border-gray-300 bg-white hover:border-black"
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button className="h-9 w-9 rounded-lg border border-gray-300 bg-white text-sm font-bold hover:border-black">
                  ›
                </button>
              </div>
            </section>

            <div className="space-y-4">
              <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <h3 className="mb-5 text-base font-extrabold">
                  상세 정보
                </h3>

                <div className="space-y-4 text-xs">
                  {[
                    ["프로젝트 번호", "PO-2026-0001"],
                    ["발주처", "미래정밀(주)"],
                    ["납기일", "2026-06-20"],
                    ["현재 공정", "가공중"],
                    ["검사 상태", "검사 예정"],
                    ["납품 상태", "확인 대기"],
                    ["담당자", "김영철 과장"],
                    ["연락처", "010-1234-5678"],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex items-start justify-between gap-3"
                    >
                      <span className="text-gray-500">
                        {label}
                      </span>

                      <span className="text-right font-semibold">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <h3 className="mb-5 text-base font-extrabold">
                  진행 히스토리
                </h3>

                <div className="space-y-6 border-l border-gray-200 pl-5">
                  {[
                    ["검사 요청 예정", "2026-06-04 14:30"],
                    ["가공 공정 시작", "2026-05-28 09:10"],
                    ["발주 확정", "2026-05-26 16:45"],
                    ["입찰 완료", "2026-05-24 11:20"],
                  ].map(([title, date]) => (
                    <div
                      key={title}
                      className="relative"
                    >
                      <div className="absolute -left-[23px] top-1 h-2.5 w-2.5 rounded-full bg-black" />

                      <p className="text-xs font-bold">
                        {title}
                      </p>

                      <p className="mt-1 text-[11px] text-gray-500">
                        {date}
                      </p>
                    </div>
                  ))}
                </div>

                <button className="mt-6 w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-xs font-bold hover:border-black">
                  전체 히스토리 보기
                </button>
              </section>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}