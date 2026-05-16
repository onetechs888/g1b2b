"use client";

import { useState } from "react";

export default function PartnerPage() {
  const categories = [
    "전체",
    "MCT · CNC 가공",
    "판금 · 레이저",
    "사출성형",
    "용접 · 제관",
    "연삭 가공",
    "후가공",
    "자동화 장비",
    "금형",
  ];

  const partners = [
    {
      name: "정밀가공테크",
      category: "MCT · CNC 가공",
      region: "경기도",
      grade: "B2",
    },
    {
      name: "한국판금산업",
      category: "판금 · 레이저",
      region: "인천",
      grade: "A3",
    },
    {
      name: "스마트사출",
      category: "사출성형",
      region: "대구",
      grade: "C1",
    },
    {
      name: "우진용접",
      category: "용접 · 제관",
      region: "부산",
      grade: "D1",
    },
    {
      name: "대한연삭",
      category: "연삭 가공",
      region: "창원",
      grade: "B1",
    },
    {
      name: "미래정밀",
      category: "MCT · CNC 가공",
      region: "화성",
      grade: "C2",
    },
    {
      name: "에이스금형",
      category: "금형",
      region: "시흥",
      grade: "A2",
    },
    {
      name: "스마트자동화",
      category: "자동화 장비",
      region: "안산",
      grade: "B3",
    },
  ];

  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [categorySearch, setCategorySearch] = useState("");
  const [regionSearch, setRegionSearch] = useState("");
  const [gradeSearch, setGradeSearch] = useState("");

  const filteredPartners = partners.filter((partner) => {
    const matchesCategory =
      selectedCategory === "전체" ||
      partner.category === selectedCategory;

    const matchesCategorySearch = partner.category
      .toLowerCase()
      .includes(categorySearch.toLowerCase());

    const matchesRegion = partner.region
      .toLowerCase()
      .includes(regionSearch.toLowerCase());

    const matchesGrade = partner.grade
      .toLowerCase()
      .includes(gradeSearch.toLowerCase());

    return (
      matchesCategory &&
      matchesCategorySearch &&
      matchesRegion &&
      matchesGrade
    );
  });

  return (
    <main className="min-h-screen bg-[#f6f6f4] text-black">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-gray-200">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/images/partner-bg.png')",
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-r from-[#f6f6f4] via-[#f6f6f4]/95 to-[#f6f6f4]/30" />

        <div className="relative max-w-7xl mx-auto px-8 py-24">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-gray-500 mb-4">
              Manufacturing Partner
            </p>

            <h1 className="text-5xl font-extrabold leading-tight mb-6">
              신뢰할 수 있는
              <br />
              검증 파트너를 찾으세요
            </h1>

            <p className="text-base text-gray-600 leading-relaxed mb-8">
              업종, 지역, 기업 등급을 기준으로 검증된 제조 파트너를
              빠르게 검색하고 연결할 수 있습니다.
            </p>

            <a
              href="/partner"
              className="inline-block bg-black text-white px-6 py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition"
            >
              파트너 검색하기
            </a>
          </div>

          <div className="mt-16 grid md:grid-cols-4 gap-4">
            <div className="bg-white/90 backdrop-blur-md border border-gray-200 rounded-3xl p-6 shadow-sm">
              <h3 className="text-3xl font-bold mb-2">2,500+</h3>
              <p className="text-sm text-gray-500">검증된 파트너사</p>
            </div>

            <div className="bg-white/90 backdrop-blur-md border border-gray-200 rounded-3xl p-6 shadow-sm">
              <h3 className="text-3xl font-bold mb-2">120+</h3>
              <p className="text-sm text-gray-500">제조 업종 분류</p>
            </div>

            <div className="bg-white/90 backdrop-blur-md border border-gray-200 rounded-3xl p-6 shadow-sm">
              <h3 className="text-3xl font-bold mb-2">A1~D3</h3>
              <p className="text-sm text-gray-500">기업 등급 체계</p>
            </div>

            <div className="bg-white/90 backdrop-blur-md border border-gray-200 rounded-3xl p-6 shadow-sm">
              <h3 className="text-3xl font-bold mb-2">98.6%</h3>
              <p className="text-sm text-gray-500">파트너 만족도</p>
            </div>
          </div>
        </div>
      </section>

      {/* 본문 */}
      <section className="max-w-7xl mx-auto px-8 py-12">
        <div className="grid lg:grid-cols-[180px_1fr] gap-6">
          {/* 카테고리 */}
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

          {/* 오른쪽 콘텐츠 */}
          <section>
            {/* 검색 */}
            <div className="grid md:grid-cols-3 gap-3 mb-6">
              <input
                type="text"
                placeholder="업종 검색"
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                className="bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm text-black placeholder:text-gray-400 outline-none focus:border-black transition shadow-sm"
              />

              <input
                type="text"
                placeholder="지역 검색"
                value={regionSearch}
                onChange={(e) => setRegionSearch(e.target.value)}
                className="bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm text-black placeholder:text-gray-400 outline-none focus:border-black transition shadow-sm"
              />

              <input
                type="text"
                placeholder="등급 검색"
                value={gradeSearch}
                onChange={(e) => setGradeSearch(e.target.value)}
                className="bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm text-black placeholder:text-gray-400 outline-none focus:border-black transition shadow-sm"
              />
            </div>

            <div className="mb-4 text-xs text-gray-500">
              검색 결과: {filteredPartners.length}개
            </div>

            {/* 파트너 목록 */}
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredPartners.map((partner) => (
                <div
                  key={partner.name}
                  className="border border-gray-200 rounded-3xl p-5 bg-white hover:border-black transition shadow-sm"
                >
                  <div className="flex justify-between items-start gap-3 mb-4">
                    <h2 className="text-base font-bold leading-snug">
                      {partner.name}
                    </h2>

                    <span className="shrink-0 text-[11px] border border-gray-300 rounded-full px-2 py-1 text-gray-600">
                      {partner.grade}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-gray-600">
                    <p>업종: {partner.category}</p>
                    <p>지역: {partner.region}</p>
                  </div>

                  <div className="mt-4 h-24 border border-dashed border-gray-300 rounded-2xl flex items-center justify-center text-xs text-gray-400 bg-gray-50">
                    설비 / 인증 정보 미리보기
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <a
                      href="#"
                      className="text-center border border-gray-300 px-3 py-2 rounded-xl text-xs font-semibold hover:border-black transition"
                    >
                      상세 보기
                    </a>

                    <button className="bg-black text-white px-3 py-2 rounded-xl text-xs font-semibold hover:opacity-90 transition">
                      문의하기
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