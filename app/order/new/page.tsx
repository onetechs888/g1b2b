"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function NewOrderPage() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [quantity, setQuantity] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [deadline, setDeadline] = useState("");
  const [grade, setGrade] = useState("");
  const [description, setDescription] = useState("");
  const [fileName, setFileName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title || !category || !targetPrice || !deadline || !grade) {
      alert("필수 항목을 입력해주세요.");
      return;
    }

    setLoading(true);

    let fileUrl = "";

    if (file) {
      const filePath = `${Date.now()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("order-files")
        .upload(filePath, file);

      if (uploadError) {
        console.error(uploadError);
        alert("파일 업로드 중 오류가 발생했습니다.");
        setLoading(false);
        return;
      }

      const { data } = supabase.storage
        .from("order-files")
        .getPublicUrl(filePath);

      fileUrl = data.publicUrl;
    }

    const { error } = await supabase.from("orders").insert([
      {
        title,
        category,
        target_price: targetPrice,
        deadline,
        grade,
        file_name: fileName,
        file_url: fileUrl,
      },
    ]);

    setLoading(false);

    if (error) {
      console.error(error);
      alert("발주 등록 중 오류가 발생했습니다.");
      return;
    }

    alert("발주가 등록되었습니다.");
    window.location.href = "/order";
  };

  return (
    <main className="min-h-screen bg-[#f6f6f4] text-black">
      <section className="max-w-7xl mx-auto px-8 py-12">
        <div className="mb-10">
          <p className="text-sm font-semibold text-gray-500 mb-3">
            New Manufacturing Order
          </p>

          <h1 className="text-4xl font-extrabold mb-4">발주 등록</h1>

          <p className="text-sm text-gray-600">
            타겟금액이 정해진 제조 품목을 등록하고, 검증된 파트너의 참여를 받을 수 있습니다.
          </p>
        </div>

        <section className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
          <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
            <h2 className="text-xl font-bold mb-6">품목 정보</h2>

            <div className="grid md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="품목명"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-[#f8f8f7] border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-black transition"
              />

              <input
                type="text"
                placeholder="가공 방식 예: MCT · CNC 가공"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-[#f8f8f7] border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-black transition"
              />

              <input
                type="text"
                placeholder="수량 예: 1,000EA"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="bg-[#f8f8f7] border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-black transition"
              />

              <input
                type="text"
                placeholder="타겟금액 예: 1,200만 원"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                className="bg-[#f8f8f7] border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-black transition"
              />

              <input
                type="text"
                placeholder="희망 납기 예: 2026-06-30"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="bg-[#f8f8f7] border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-black transition"
              />

              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="bg-[#f8f8f7] border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-black transition"
              >
                <option value="">참여 가능 등급 선택</option>
                <option>D 등급 이상</option>
                <option>C 등급 이상</option>
                <option>B 등급 이상</option>
                <option>A 등급 이상</option>
              </select>

              <textarea
                placeholder="요청 사항을 입력하세요"
                rows={7}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="md:col-span-2 bg-[#f8f8f7] border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-black transition resize-none"
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
              <h2 className="text-xl font-bold mb-3">도면 / 3D 파일 업로드</h2>

              <p className="text-xs text-gray-500 mb-6">
                DWG, DXF, PDF, STEP, STL, OBJ 파일을 첨부할 수 있습니다.
              </p>

              <label className="block border-2 border-dashed border-gray-300 rounded-3xl p-10 text-center cursor-pointer hover:border-black transition bg-[#fafafa]">
                <input
                  type="file"
                  accept=".dwg,.dxf,.pdf,.step,.stp,.stl,.obj"
                  className="hidden"
                  onChange={(e) => {
                    const selectedFile = e.target.files?.[0];

                    if (selectedFile) {
                      setFile(selectedFile);
                      setFileName(selectedFile.name);
                    }
                  }}
                />

                <div className="text-4xl mb-4">📎</div>

                <div className="text-sm font-bold mb-2">
                  파일을 선택하거나 업로드하세요
                </div>

                <div className="text-xs text-gray-500">
                  {fileName || "도면 및 3D 모델 파일 첨부 가능"}
                </div>
              </label>

              <div className="mt-6 border border-gray-200 rounded-2xl p-4 bg-[#f8f8f7]">
                <h3 className="text-sm font-bold mb-3">파일 미리보기</h3>

                <div className="h-40 flex items-center justify-center border border-gray-200 rounded-2xl text-gray-400 text-xs bg-white">
                  PDF / 3D 파일 미리보기 연결 예정
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
              <h3 className="text-sm font-bold mb-3">발주 등록 안내</h3>

              <ul className="space-y-2 text-xs text-gray-500 leading-relaxed">
                <li>• 타겟금액은 파트너 검색 및 참여 조건에 활용됩니다.</li>
                <li>• 대외비 도면은 보안 입찰 또는 오프라인 입찰로 전환할 수 있습니다.</li>
                <li>• 등록 후 파트너 참여 신청을 받을 수 있습니다.</li>
              </ul>
            </div>
          </div>
        </section>

        <div className="mt-8 flex justify-between">
          <a
            href="/order"
            className="border border-gray-300 bg-white px-5 py-3 rounded-xl text-sm font-semibold hover:border-black transition"
          >
            발주 목록으로
          </a>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-black text-white px-6 py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? "등록 중..." : "발주 등록하기"}
          </button>
        </div>
      </section>
    </main>
  );
}