"use client";

import { useState } from "react";

export default function BidPage() {
  const categories = [
    "전체",
    "MCT · CNC 가공",
    "판금 · 레이저",
    "사출성형",
    "용접 · 제관",
    "연삭 가공",
    "후가공",
  ];

  const bids = [
    {
      id: 1,
      title: "알루미늄 브라켓 CNC 가공",
      category: "MCT · CNC 가공",
      deadline: "2026-06-30",
      grade: "D 등급 이상",
      file: "bracket_sample.pdf",
    },
    {
      id: 2,
      title: "판금 케이스 제작",
      category: "판금 · 레이저",
      deadline: "2026-07-10",
      grade: "C 등급 이상",
      file: "case_drawing.dxf",
    },
    {
      id: 3,
      title: "사출 하우징 시제품 제작",
      category: "사출성형",
      deadline: "2026-07-18",
      grade: "C 등급 이상",
      file: "housing_step.stp",
    },
    {
      id: 4,
      title: "스테인리스 용접 프레임 제작",
      category: "용접 · 제관",
      deadline: "2026-07-25",
      grade: "B 등급 이상",
      file: "frame_drawing.pdf",
    },
    {
      id: 5,
      title: "정밀 샤프트 연삭 가공",
      category: "연삭 가공",
      deadline: "2026-08-02",
      grade: "B 등급 이상",
      file: "shaft_dwg.dwg",
    },
    {
      id: 6,
      title: "알루미늄 압출 부품 후가공",
      category: "후가공",
      deadline: "2026-08-12",
      grade: "D 등급 이상",
      file: "extrusion_part.dxf",
    },
  ];

  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [categorySearch, setCategorySearch] = useState("");
  const [gradeSearch, setGradeSearch] = useState("");
  const [deadlineSearch, setDeadlineSearch] = useState("");

  const filteredBids = bids.filter((bid) => {
    const matchesCategory =
      selectedCategory === "전체" || bid.category === selectedCategory;

    const matchesCategorySearch = bid.category
      .toLowerCase()
      .includes(categorySearch.toLowerCase());

    const matchesGrade = bid.grade
      .toLowerCase()
      .includes(gradeSearch.toLowerCase());

    const matchesDeadline = bid.deadline
      .toLowerCase()
      .includes(deadlineSearch.toLowerCase());

    return (
      matchesCategory &&
      matchesCategorySearch &&
      matchesGrade &&
      matchesDeadline
    );
  });

  return (
    <main className="min-h-screen bg-[#f6f6f4] text-black">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-gray-200">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/images/bid-bg.png')",
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-r from-[#f6f6f4] via-[#f6f6f4]/95 to-[#f6f6f4]/30" />

        <div className="relative max-w-7xl mx-auto px-8 py-24">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-gray-500 mb-4">
              Manufacturing Bid
            </p>

            <h1 className="text-5xl font-extrabold leading-tight mb-6">
              제조 프로젝트,
              <br />
              투명하게 입찰하세요
            </h1>

            <p className="text-base text-gray-600 leading-relaxed mb-8">
              도면과 요구사항을 기반으로 검증된 파트너들의 견적을 비교하고,
              최적의 제조 파트너를 선택할 수 있습니다.
            </p>

            <a
              href="/bid/new"
              className="inline-block bg-black text-white px-6 py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition"
            >
              입찰 등록하기
            </a>
          </div>

          <div className="mt-16 grid md:grid-cols-4 gap-4">
            <div className="bg-white/90 backdrop-blur-md border border-gray-200 rounded-3xl p-6 shadow-sm">
              <h3 className="text-3xl font-bold mb-2">2,500+</h3>
              <p className="text-sm text-gray-500">검증된 파트너사</p>
            </div>

            <div className="bg-white/90 backdrop-blur-md border border-gray-200 rounded-3xl p-6 shadow-sm">
              <h3 className="text-3xl font-bold mb-2">1,800+</h3>
              <p className="text-sm text-gray-500">누적 입찰 건수</p>
            </div>

            <div className="bg-white/90 backdrop-blur-md border border-gray-200 rounded-3xl p-6 shadow-sm">
              <h3 className="text-3xl font-bold mb-2">94.2%</h3>
              <p className="text-sm text-gray-500">견적 응답률</p>
            </div>

            <div className="bg-white/90 backdrop-blur-md border border-gray-200 rounded-3xl p-6 shadow-sm">
              <h3 className="text-3xl font-bold mb-2">72h</h3>
              <p className="text-sm text-gray-500">평균 견적 검토 시간</p>
            </div>
          </div>
        </div>
      </section>

      {/* 본문 */}
      <section className="max-w-7xl mx-auto px-8 py-12">
        <div className="grid lg:grid-cols-[180px_1fr] gap-6">
          <aside className="border border-gray-200 rounded-3xl bg-white p-4 h-fit shadow-sm">
            <h2 className="text-sm font-bold mb-4">업종별 분류</h2>

            <div className="space-y-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`w-full text-left rounded-xl px-3 py-2 text-xs transition ${
                    selectedCategory === category
                      ? "bg-black text-white"
                      : "text-gray-600 hover:bg-gray-100 hover:text-black"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </aside>

          <section>
            <div className="grid md:grid-cols-3 gap-3 mb-6">
              <input
                type="text"
                placeholder="업종 검색"
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                className="bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-black transition shadow-sm"
              />

              <input
                type="text"
                placeholder="등급 검색"
                value={gradeSearch}
                onChange={(e) => setGradeSearch(e.target.value)}
                className="bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-black transition shadow-sm"
              />

              <input
                type="text"
                placeholder="마감일 검색"
                value={deadlineSearch}
                onChange={(e) => setDeadlineSearch(e.target.value)}
                className="bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-black transition shadow-sm"
              />
            </div>

            <div className="mb-4 text-xs text-gray-500">
              검색 결과: {filteredBids.length}개
            </div>

            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredBids.map((bid) => (
                <div
                  key={bid.id}
                  className="border border-gray-200 rounded-3xl p-5 bg-white hover:border-black transition shadow-sm"
                >
                  <div className="flex justify-between items-start gap-3 mb-4">
                    <h2 className="text-base font-bold leading-snug">
                      {bid.title}
                    </h2>

                    <span className="shrink-0 text-[11px] border border-gray-300 rounded-full px-2 py-1 text-gray-600">
                      {bid.grade}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-gray-600">
                    <p>분야: {bid.category}</p>
                    <p>마감일: {bid.deadline}</p>
                    <p>첨부: {bid.file}</p>
                  </div>

                  <div className="mt-4 h-24 border border-dashed border-gray-300 rounded-2xl flex items-center justify-center text-xs text-gray-400 bg-gray-50">
                    도면 미리보기
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <a
                      href={`/bid/${bid.id}`}
                      className="text-center border border-gray-300 px-3 py-2 rounded-xl text-xs font-semibold hover:border-black transition"
                    >
                      상세 보기
                    </a>

                    <button className="bg-black text-white px-3 py-2 rounded-xl text-xs font-semibold hover:opacity-90 transition">
                      입찰 참여
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}