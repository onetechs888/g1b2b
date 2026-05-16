import "./globals.css";

export const metadata = {
  title: "G1B2B",
  description: "제조업 파트너 매칭 플랫폼",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="bg-[#f6f6f4] text-black">
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
          <div className="max-w-7xl mx-auto flex items-center justify-between px-8 py-5">
            {/* 로고 */}
            <a
              href="/"
              className="text-3xl font-extrabold tracking-tight"
            >
              G1B2B
            </a>

            {/* 중앙 메뉴 */}
            <nav className="flex items-center gap-8 text-sm font-medium">
              {/* 발주 */}
              <div className="relative group">
                <a
                  href="/order"
                  className="text-gray-700 hover:text-black transition"
                >
                  발주
                </a>

                <div className="absolute left-0 top-full pt-3 hidden group-hover:block">
                  <div className="min-w-40 rounded-2xl border border-gray-200 bg-white p-2 shadow-xl">
                    <a
                      href="/order"
                      className="block rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-black transition"
                    >
                      발주목록
                    </a>

                    <a
                      href="/order/new"
                      className="block rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-black transition"
                    >
                      발주등록
                    </a>
                  </div>
                </div>
              </div>

              {/* 입찰 */}
              <div className="relative group">
                <a
                  href="/bid"
                  className="text-gray-700 hover:text-black transition"
                >
                  입찰
                </a>

                <div className="absolute left-0 top-full pt-3 hidden group-hover:block">
                  <div className="min-w-40 rounded-2xl border border-gray-200 bg-white p-2 shadow-xl">
                    <a
                      href="/bid"
                      className="block rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-black transition"
                    >
                      입찰목록
                    </a>

                    <a
                      href="/bid/new"
                      className="block rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-black transition"
                    >
                      입찰등록
                    </a>
                  </div>
                </div>
              </div>

              {/* 파트너 */}
              <a
                href="/partner"
                className="text-gray-700 hover:text-black transition"
              >
                파트너
              </a>

              {/* 이용안내 */}
              <a
                href="/about"
                className="text-gray-700 hover:text-black transition"
              >
                이용안내
              </a>

              {/* 고객지원 */}
              <a
                href="/support"
                className="text-gray-700 hover:text-black transition"
              >
                고객지원
              </a>
            </nav>

            {/* 우측 메뉴 */}
            <div className="flex items-center gap-4">
              <a
                href="/workspace"
                className="text-sm text-gray-700 hover:text-black transition"
              >
                업무관리
              </a>

              <a
                href="/login"
                className="text-sm text-gray-700 hover:text-black transition"
              >
                로그인
              </a>

              <a
                href="/signup"
                className="bg-black text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition"
              >
                회원가입
              </a>
            </div>
          </div>
        </header>

        {children}
      </body>
    </html>
  );
}