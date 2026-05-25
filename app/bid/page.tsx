"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type BidStatus =
  | "입찰 진행중"
  | "검토중"
  | "입찰 준비중"
  | "업체 선정"
  | "입찰 완료";

type BidProject = {
  id: number;
  bidNo: string;
  projectName: string;
  poNo: string;
  bomCount: number;
  partners: number;
  dueDate: string;
  progress: number;
  status: BidStatus;
  dday: string;
  urgent?: boolean;
};

const projects: BidProject[] = [
  {
    id: 1,
    bidNo: "BID-2026-0058",
    projectName: "반도체 장비 프레임 제작",
    poNo: "PO-2026-0031",
    bomCount: 48,
    partners: 8,
    dueDate: "2026-05-26 17:00",
    progress: 75,
    status: "입찰 진행중",
    dday: "D-3",
    urgent: true,
  },
  {
    id: 2,
    bidNo: "BID-2026-0057",
    projectName: "정밀 지그 플레이트 제작",
    poNo: "PO-2026-0030",
    bomCount: 29,
    partners: 5,
    dueDate: "2026-05-28 17:00",
    progress: 55,
    status: "입찰 진행중",
    dday: "D-5",
  },
  {
    id: 3,
    bidNo: "BID-2026-0056",
    projectName: "자동화 라인 브라켓류 제작",
    poNo: "PO-2026-0028",
    bomCount: 32,
    partners: 6,
    dueDate: "2026-05-30 17:00",
    progress: 60,
    status: "입찰 진행중",
    dday: "D-7",
  },
  {
    id: 4,
    bidNo: "BID-2026-0055",
    projectName: "디스플레이 장비 부품 제작",
    poNo: "PO-2026-0027",
    bomCount: 22,
    partners: 4,
    dueDate: "2026-05-31 17:00",
    progress: 40,
    status: "검토중",
    dday: "D-8",
  },
  {
    id: 5,
    bidNo: "BID-2026-0054",
    projectName: "의료기기 하우징 가공",
    poNo: "PO-2026-0025",
    bomCount: 26,
    partners: 5,
    dueDate: "2026-06-01 17:00",
    progress: 45,
    status: "입찰 진행중",
    dday: "D-9",
  },
  {
    id: 6,
    bidNo: "BID-2026-0052",
    projectName: "UAM 프레임 부품 제작",
    poNo: "PO-2026-0022",
    bomCount: 63,
    partners: 7,
    dueDate: "2026-06-06 17:00",
    progress: 30,
    status: "검토중",
    dday: "D-14",
  },
  {
    id: 7,
    bidNo: "BID-2026-0049",
    projectName: "산업용 로봇 암 부품",
    poNo: "PO-2026-0018",
    bomCount: 41,
    partners: 6,
    dueDate: "2026-06-12 17:00",
    progress: 20,
    status: "검토중",
    dday: "-",
  },
  {
    id: 8,
    bidNo: "BID-2026-0047",
    projectName: "수소밸브 바디 가공",
    poNo: "PO-2026-0015",
    bomCount: 18,
    partners: 4,
    dueDate: "2026-06-18 17:00",
    progress: 10,
    status: "입찰 준비중",
    dday: "-",
  },
];

function StatusBadge({ status }: { status: BidStatus }) {
  const styles: Record<BidStatus, string> = {
    "입찰 진행중": "bg-red-50 text-red-600 border-red-100",
    검토중: "bg-blue-50 text-blue-600 border-blue-100",
    "입찰 준비중": "bg-gray-100 text-gray-600 border-gray-200",
    "업체 선정": "bg-green-50 text-green-600 border-green-100",
    "입찰 완료": "bg-black text-white border-black",
  };

  return (
    <span className={`rounded-full border px-3 py-1 text-[11px] font-bold ${styles[status]}`}>
      {status}
    </span>
  );
}

function DdayBadge({ dday }: { dday: string }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold ${
        dday === "D-3"
          ? "bg-red-100 text-red-600"
          : dday === "D-5" || dday === "D-7"
            ? "bg-orange-100 text-orange-600"
            : dday === "-"
              ? "bg-gray-100 text-gray-500"
              : "bg-gray-100 text-gray-600"
      }`}
    >
      {dday}
    </span>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-10 text-xs font-bold">{value}%</span>
      <div className="h-2 w-20 overflow-hidden rounded-full bg-gray-200">
        <div
          className={`h-full rounded-full ${
            value >= 70 ? "bg-red-500" : value >= 40 ? "bg-orange-400" : "bg-blue-500"
          }`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export default function BidPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("전체");

  const filteredProjects = useMemo(() => {
    return projects.filter((item) => {
      const matchSearch =
        item.projectName.includes(search) ||
        item.bidNo.includes(search) ||
        item.poNo.includes(search);

      const matchStatus = statusFilter === "전체" ? true : item.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [search, statusFilter]);

  return (
    <main className="min-h-screen bg-[#f6f6f4] text-black">
      <div className="grid min-h-screen grid-cols-[260px_1fr]">
        <aside className="border-r border-gray-200 bg-white px-4 py-8">
          <div className="mb-12 px-2">
            <h2 className="text-4xl font-extrabold tracking-tight">G1B2B</h2>
            <p className="mt-2 text-sm text-gray-500">Manufacturing OS</p>
          </div>

          <nav className="space-y-3">
            <Link
              href="/workspace"
              className="block rounded-2xl border border-gray-200 bg-white p-4 hover:bg-gray-50"
            >
              <div className="text-sm font-extrabold">업무관리</div>
            </Link>

            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm font-extrabold">입찰</div>
                <span className="text-xs">⌃</span>
              </div>

              <div className="space-y-2">
                <Link href="/bid" className="block rounded-xl bg-black px-3 py-2 text-sm font-bold text-white">
                  입찰 목록
                </Link>
                <Link href="/bid/1" className="block rounded-xl px-3 py-2 text-sm font-bold text-gray-700 hover:bg-gray-100">
                  입찰 상세
                </Link>
                <Link href="/bid/new" className="block rounded-xl px-3 py-2 text-sm font-bold text-gray-700 hover:bg-gray-100">
                  입찰 등록
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm font-extrabold">발주</div>
                <span className="text-xs">⌃</span>
              </div>

              <div className="space-y-2">
                <Link href="/order" className="block rounded-xl px-3 py-2 text-sm font-bold text-gray-700 hover:bg-gray-100">
                  발주 목록
                </Link>
                <Link href="/order/1" className="block rounded-xl px-3 py-2 text-sm font-bold text-gray-700 hover:bg-gray-100">
                  발주 상세
                </Link>
                <Link href="/order/new" className="block rounded-xl px-3 py-2 text-sm font-bold text-gray-700 hover:bg-gray-100">
                  발주 등록
                </Link>
              </div>
            </div>
          </nav>

          <div className="mt-24 rounded-2xl border border-gray-200 bg-white p-4">
            <p className="text-sm font-extrabold">G1B2B 운영센터</p>
            <p className="mt-2 text-xs text-gray-500">support@g1b2b.com</p>
            <p className="text-xs text-gray-500">070-1234-5678</p>
          </div>
        </aside>

        <section className="px-8 py-7">
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold">입찰 프로젝트</h1>
            <p className="mt-3 text-sm text-gray-600">
              검증된 파트너들의 견적을 비교하고, 최적의 제조 파트너를 선택하세요.
            </p>
          </div>

          <section className="mb-6 grid grid-cols-5 gap-4">
            {[
              ["진행중 입찰 프로젝트", "12", "전체 입찰 중 48%", "P"],
              ["참여 파트너사", "187", "누적 참여 업체 수", "U"],
              ["BOM 품목 수", "2,846", "전체 프로젝트 기준", "B"],
              ["평균 견적 응답 시간", "72h", "지난 30일 기준", "T"],
              ["견적 응답률", "94.2%", "지난 30일 기준", "%"],
            ].map(([title, value, desc, icon]) => (
              <div key={title} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-sm font-extrabold text-white">
                    {icon}
                  </div>
                  <div className="text-sm font-bold">{title}</div>
                </div>
                <div className="text-4xl font-extrabold tracking-tight">{value}</div>
                <div className="mt-3 text-xs font-bold text-gray-500">{desc}</div>
              </div>
            ))}
          </section>

          <section className="mb-6 rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
              <div>
                <div className="mb-2 flex items-center gap-3">
                  <h2 className="text-xl font-extrabold">현재 진행중인 입찰 프로젝트</h2>
                  <span className="rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white">6건</span>
                </div>
                <p className="text-sm text-gray-500">마감일이 임박했거나 활발히 진행중인 프로젝트입니다.</p>
              </div>

              <button className="rounded-xl border border-gray-300 bg-white px-5 py-2 text-sm font-bold hover:bg-gray-50">
                전체 입찰 목록 보기 →
              </button>
            </div>

            <div className="overflow-auto">
              <table className="w-full min-w-[1300px] text-sm">
                <thead className="bg-[#fafafa] text-xs text-gray-500">
                  <tr>
                    <th className="px-5 py-4 text-left">긴급/마감 D-day</th>
                    <th className="px-5 py-4 text-left">입찰번호</th>
                    <th className="px-5 py-4 text-left">프로젝트명</th>
                    <th className="px-5 py-4 text-left">PO 번호</th>
                    <th className="px-5 py-4 text-left">BOM 품목 수</th>
                    <th className="px-5 py-4 text-left">참여업체</th>
                    <th className="px-5 py-4 text-left">마감일</th>
                    <th className="px-5 py-4 text-left">진행상태</th>
                    <th className="px-5 py-4 text-left">진행률</th>
                    <th className="px-5 py-4 text-left">액션</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {projects.slice(0, 6).map((item) => (
                    <tr key={item.id} className={`hover:bg-[#fafafa] ${item.urgent ? "bg-red-50/40" : ""}`}>
                      <td className="px-5 py-4">
                        <DdayBadge dday={item.dday} />
                      </td>
                      <td className="px-5 py-4 font-bold">{item.bidNo}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold">{item.projectName}</span>
                          {item.urgent && (
                            <span className="rounded-full bg-red-500 px-2 py-1 text-[10px] font-bold text-white">
                              긴급
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 font-bold">{item.poNo}</td>
                      <td className="px-5 py-4 font-bold">{item.bomCount}</td>
                      <td className="px-5 py-4 font-bold">{item.partners}</td>
                      <td className="px-5 py-4 font-bold">{item.dueDate}</td>
                      <td className="px-5 py-4">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-5 py-4">
                        <ProgressBar value={item.progress} />
                      </td>
                      <td className="px-5 py-4">
                        <Link
                          href={`/bid/${item.id}`}
                          className="rounded-lg bg-black px-4 py-2 text-xs font-bold text-white"
                        >
                          상세보기
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="grid grid-cols-[240px_1fr] gap-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="mb-5 text-lg font-extrabold">입찰 상태 필터</h3>

              <div className="space-y-3">
                {[
                  ["전체", 25],
                  ["입찰 진행중", 12],
                  ["검토중", 6],
                  ["업체 선정", 4],
                  ["입찰 완료", 3],
                ].map(([label, count]) => (
                  <button
                    key={label}
                    onClick={() => setStatusFilter(String(label))}
                    className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-bold ${
                      statusFilter === label ? "bg-black text-white" : "hover:bg-gray-100"
                    }`}
                  >
                    <span>{label}</span>
                    <span>{count}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-200 p-5">
                <div className="flex items-center gap-3">
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="프로젝트명 / 입찰번호 / PO 번호 검색"
                    className="h-11 w-[320px] rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium outline-none"
                  />

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-11 rounded-xl border border-gray-300 bg-white px-4 text-sm font-bold"
                  >
                    <option>전체</option>
                    <option>입찰 진행중</option>
                    <option>검토중</option>
                    <option>입찰 준비중</option>
                    <option>업체 선정</option>
                    <option>입찰 완료</option>
                  </select>

                  <select className="h-11 rounded-xl border border-gray-300 bg-white px-4 text-sm font-bold">
                    <option>마감일 전체</option>
                  </select>

                  <button
                    onClick={() => {
                      setSearch("");
                      setStatusFilter("전체");
                    }}
                    className="h-11 rounded-xl border border-gray-300 bg-white px-5 text-sm font-bold hover:bg-gray-50"
                  >
                    검색 초기화
                  </button>
                </div>

                <Link href="/bid/new" className="flex h-11 items-center rounded-xl bg-black px-5 text-sm font-bold text-white">
                  + 입찰 등록하기
                </Link>
              </div>

              <div className="overflow-auto">
                <table className="w-full min-w-[1200px] text-sm">
                  <thead className="bg-[#fafafa] text-xs text-gray-500">
                    <tr>
                      <th className="px-5 py-4 text-left">입찰번호</th>
                      <th className="px-5 py-4 text-left">프로젝트명</th>
                      <th className="px-5 py-4 text-left">PO 번호</th>
                      <th className="px-5 py-4 text-left">BOM 품목 수</th>
                      <th className="px-5 py-4 text-left">참여업체</th>
                      <th className="px-5 py-4 text-left">마감일</th>
                      <th className="px-5 py-4 text-left">진행상태</th>
                      <th className="px-5 py-4 text-left">진행률</th>
                      <th className="px-5 py-4 text-left">액션</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200">
                    {filteredProjects.map((item) => (
                      <tr key={item.id} className="hover:bg-[#fafafa]">
                        <td className="px-5 py-4 font-bold">{item.bidNo}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold">{item.projectName}</span>
                            {item.urgent && (
                              <span className="rounded-full bg-red-500 px-2 py-1 text-[10px] font-bold text-white">
                                긴급
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 font-bold">{item.poNo}</td>
                        <td className="px-5 py-4 font-bold">{item.bomCount}</td>
                        <td className="px-5 py-4 font-bold">{item.partners}</td>
                        <td className="px-5 py-4 font-bold">{item.dueDate}</td>
                        <td className="px-5 py-4">
                          <StatusBadge status={item.status} />
                        </td>
                        <td className="px-5 py-4">
                          <ProgressBar value={item.progress} />
                        </td>
                        <td className="px-5 py-4">
                          <Link
                            href={`/bid/${item.id}`}
                            className="rounded-lg bg-black px-4 py-2 text-xs font-bold text-white"
                          >
                            상세보기
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-center gap-2 border-t border-gray-200 px-6 py-5">
                {[1, 2, 3, 4, 5].map((page) => (
                  <button
                    key={page}
                    className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold ${
                      page === 1 ? "bg-black text-white" : "border border-gray-300 bg-white"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}