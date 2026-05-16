"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Order = {
  id: number;
  title: string;
  category: string;
  target_price: string;
  deadline: string;
  grade: string;
  file_name: string | null;
  created_at: string;
};

export default function OrderPage() {
  const categories = [
    "전체",
    "MCT · CNC 가공",
    "판금 · 레이저",
    "사출성형",
    "용접 · 제관",
    "연삭 가공",
    "후가공",
  ];

  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [categorySearch, setCategorySearch] = useState("");
  const [priceSearch, setPriceSearch] = useState("");
  const [deadlineSearch, setDeadlineSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      alert("발주 목록을 불러오는 중 오류가 발생했습니다.");
      setLoading(false);
      return;
    }

    setOrders(data || []);
    setLoading(false);
  };

  const getNumber = (value: string) => {
    return Number(value.replace(/[^0-9]/g, ""));
  };

  const filteredOrders = orders.filter((order) => {
    const matchesCategory =
      selectedCategory === "전체" || order.category === selectedCategory;

    const matchesCategorySearch = order.category
      .toLowerCase()
      .includes(categorySearch.toLowerCase());

    const inputPrice = getNumber(priceSearch);
    const orderPrice = getNumber(order.target_price || "");

    const matchesPrice =
      priceSearch.trim() === "" || orderPrice <= inputPrice;

    const matchesDeadline = order.deadline
      .toLowerCase()
      .includes(deadlineSearch.toLowerCase());

    return (
      matchesCategory &&
      matchesCategorySearch &&
      matchesPrice &&
      matchesDeadline
    );
  });

  return (
    <main className="min-h-screen bg-[#f6f6f4] text-black">
      <section className="relative overflow-hidden border-b border-gray-200">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/images/order-bg.png')",
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-r from-[#f6f6f4] via-[#f6f6f4]/95 to-[#f6f6f4]/30" />

        <div className="relative max-w-7xl mx-auto px-8 py-24">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-gray-500 mb-4">
              Manufacturing Order
            </p>

            <h1 className="text-5xl font-extrabold leading-tight mb-6">
              필요한 제조,
              <br />
              간편하게 발주하세요
            </h1>

            <p className="text-base text-gray-600 leading-relaxed mb-8">
              타겟금액이 정해진 제조 품목을 등록하고,
              신뢰할 수 있는 파트너와 안전하게 연결됩니다.
            </p>

            <a
              href="/order/new"
              className="inline-block bg-black text-white px-6 py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition"
            >
              발주 등록하기
            </a>
          </div>
        </div>
      </section>

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
                placeholder="금액 검색 예: 3000"
                value={priceSearch}
                onChange={(e) => setPriceSearch(e.target.value)}
                className="bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-black transition shadow-sm"
              />

              <input
                type="text"
                placeholder="납기 검색"
                value={deadlineSearch}
                onChange={(e) => setDeadlineSearch(e.target.value)}
                className="bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-black transition shadow-sm"
              />
            </div>

            <div className="mb-4 text-xs text-gray-500">
              {loading ? "불러오는 중..." : `검색 결과: ${filteredOrders.length}개`}
            </div>

            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="border border-gray-200 rounded-3xl p-5 bg-white hover:border-black transition shadow-sm"
                >
                  <div className="flex justify-between items-start gap-3 mb-4">
                    <h2 className="text-base font-bold leading-snug">
                      {order.title}
                    </h2>

                    <span className="shrink-0 text-[11px] border border-gray-300 rounded-full px-2 py-1 text-gray-600">
                      {order.grade}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-gray-600">
                    <p>분야: {order.category}</p>
                    <p>타겟금액: {order.target_price}</p>
                    <p>희망 납기: {order.deadline}</p>
                    <p>첨부: {order.file_name || "첨부 없음"}</p>
                  </div>

                  <div className="mt-4 h-24 border border-dashed border-gray-300 rounded-2xl flex items-center justify-center text-xs text-gray-400 bg-gray-50">
                    도면 미리보기
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <a
                      href={`/order/${order.id}`}
                      className="text-center border border-gray-300 px-3 py-2 rounded-xl text-xs font-semibold hover:border-black transition"
                    >
                      상세 보기
                    </a>

                    <button className="bg-black text-white px-3 py-2 rounded-xl text-xs font-semibold hover:opacity-90 transition">
                      참여 신청
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {!loading && filteredOrders.length === 0 && (
              <div className="mt-10 bg-white border border-gray-200 rounded-3xl p-10 text-center text-sm text-gray-500">
                등록된 발주가 없습니다.
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}