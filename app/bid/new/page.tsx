export default function NewBidPage() {
  return (
    <main className="min-h-screen bg-[#f6f6f4] text-black">
      <section className="max-w-7xl mx-auto px-8 py-12">
        {/* 상단 */}
        <div className="mb-10">
          <p className="text-sm font-semibold text-gray-500 mb-3">
            New Manufacturing Bid
          </p>

          <h1 className="text-4xl font-extrabold mb-4">입찰 등록</h1>

          <p className="text-sm text-gray-600">
            도면과 요구사항을 등록하고, 검증된 파트너들의 견적을 비교할 수
            있습니다.
          </p>
        </div>

        <section className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
          {/* 왼쪽 입력 영역 */}
          <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
            <h2 className="text-xl font-bold mb-6">프로젝트 정보</h2>

            <div className="grid md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="프로젝트명"
                className="bg-[#f8f8f7] border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-black transition"
              />

              <select className="bg-[#f8f8f7] border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-black transition">
                <option>가공 방식 선택</option>
                <option>MCT · CNC 가공</option>
                <option>판금 · 레이저</option>
                <option>사출성형</option>
                <option>용접 · 제관</option>
                <option>연삭 가공</option>
                <option>후가공</option>
              </select>

              <input
                type="text"
                placeholder="예상 수량 예: 500EA"
                className="bg-[#f8f8f7] border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-black transition"
              />

              <input
                type="text"
                placeholder="입찰 마감일 예: 2026-06-30"
                className="bg-[#f8f8f7] border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-black transition"
              />

              <select className="bg-[#f8f8f7] border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-black transition">
                <option>참여 가능 등급 선택</option>
                <option>D 등급 이상</option>
                <option>C 등급 이상</option>
                <option>B 등급 이상</option>
                <option>A 등급 이상</option>
              </select>

              <select className="bg-[#f8f8f7] border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-black transition">
                <option>입찰 방식 선택</option>
                <option>온라인 입찰</option>
                <option>오프라인 입찰</option>
                <option>보안 입찰</option>
              </select>

              <textarea
                placeholder="요구사항 및 특이사항을 입력하세요"
                rows={7}
                className="md:col-span-2 bg-[#f8f8f7] border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-black transition resize-none"
              />
            </div>
          </div>

          {/* 오른쪽 업로드 영역 */}
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
              <h2 className="text-xl font-bold mb-3">도면 / 3D 파일 업로드</h2>

              <p className="text-xs text-gray-500 mb-6">
                DWG, DXF, PDF, STEP, STL, OBJ 파일을 첨부할 수 있습니다.
              </p>

              <label className="block border-2 border-dashed border-gray-300 rounded-3xl p-10 text-center cursor-pointer hover:border-black transition bg-[#fafafa]">
                <input
                  type="file"
                  multiple
                  accept=".dwg,.dxf,.pdf,.step,.stp,.stl,.obj"
                  className="hidden"
                />

                <div className="text-4xl mb-4">📐</div>

                <div className="text-sm font-bold mb-2">
                  도면 파일을 선택하거나 업로드하세요
                </div>

                <div className="text-xs text-gray-500">
                  입찰 검토에 필요한 도면 및 3D 모델 첨부
                </div>
              </label>

              <div className="mt-6 border border-gray-200 rounded-2xl p-4 bg-[#f8f8f7]">
                <h3 className="text-sm font-bold mb-3">도면 미리보기</h3>

                <div className="h-40 flex items-center justify-center border border-gray-200 rounded-2xl text-gray-400 text-xs bg-white">
                  PDF / 3D 파일 미리보기 연결 예정
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
              <h3 className="text-sm font-bold mb-3">입찰 등록 안내</h3>

              <ul className="space-y-2 text-xs text-gray-500 leading-relaxed">
                <li>• 등록된 도면과 요구사항을 기준으로 파트너가 견적을 제출합니다.</li>
                <li>• 대외비 품목은 보안 입찰 또는 오프라인 입찰로 운영할 수 있습니다.</li>
                <li>• 입찰 마감 후 견적 비교 및 파트너 선정이 가능합니다.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 하단 버튼 */}
        <div className="mt-8 flex justify-between">
          <a
            href="/bid"
            className="border border-gray-300 bg-white px-5 py-3 rounded-xl text-sm font-semibold hover:border-black transition"
          >
            입찰 목록으로
          </a>

          <button className="bg-black text-white px-6 py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition">
            입찰 등록하기
          </button>
        </div>
      </section>
    </main>
  );
}