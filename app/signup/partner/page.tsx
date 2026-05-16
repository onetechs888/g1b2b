export default function PartnerSignupPage() {
    return (
      <main className="min-h-screen bg-[#f6f6f4] text-black">
        <section className="max-w-4xl mx-auto px-8 py-16">
          <div className="mb-10">
            <p className="text-xs font-semibold text-gray-500 mb-3">
              Partner Registration
            </p>
  
            <h1 className="text-4xl font-extrabold mb-4">파트너사 가입</h1>
  
            <p className="text-sm text-gray-600">
              입찰 참여와 수주 관리를 위한 파트너사 정보를 입력하세요.
            </p>
          </div>
  
          <div className="bg-white border border-gray-200 rounded-[2rem] p-8 shadow-sm">
            <div className="grid md:grid-cols-2 gap-4">
              {[
                "사업자번호",
                "회사명",
                "대표자명",
                "담당자명",
                "연락처",
                "이메일",
                "비밀번호",
                "비밀번호 확인",
                "주요 업종 예: MCT · CNC 가공",
                "지역 예: 경기도 화성",
                "보유 설비",
                "보유 인증",
              ].map((placeholder) => (
                <input
                  key={placeholder}
                  type={placeholder.includes("비밀번호") ? "password" : "text"}
                  placeholder={placeholder}
                  className="bg-[#f8f8f7] border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-black transition"
                />
              ))}
  
              <textarea
                placeholder="회사 소개 및 주요 가공 가능 품목"
                rows={5}
                className="md:col-span-2 bg-[#f8f8f7] border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-black transition resize-none"
              />
            </div>
  
            <div className="mt-8 flex justify-between">
              <a
                href="/signup"
                className="border border-gray-300 bg-white px-5 py-3 rounded-xl text-sm font-semibold hover:border-black transition"
              >
                이전으로
              </a>
  
              <button className="bg-black text-white px-6 py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition">
                파트너사 가입 완료
              </button>
            </div>
          </div>
        </section>
      </main>
    );
  }