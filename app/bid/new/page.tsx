"use client";

import Link from "next/link";
import { useRef, useState } from "react";

type BomItem = {
  no: number;
  name: string;
  drawingNo: string;
  qty: number;
  material: string;
  postProcess: string;
  dueDate: string;
  pdf: boolean;
  dwg: boolean;
  step: boolean;
  note: string;
};

const initialBomItems: BomItem[] = [
  {
    no: 1,
    name: "Chamber 본체",
    drawingNo: "DRW-001",
    qty: 2,
    material: "AL6061",
    postProcess: "아노다이징",
    dueDate: "2026-06-20",
    pdf: true,
    dwg: true,
    step: true,
    note: "-",
  },
  {
    no: 2,
    name: "Cover",
    drawingNo: "DRW-002",
    qty: 1,
    material: "SUS304",
    postProcess: "없음",
    dueDate: "2026-06-22",
    pdf: true,
    dwg: true,
    step: true,
    note: "-",
  },
  {
    no: 3,
    name: "Bracket",
    drawingNo: "DRW-003",
    qty: 4,
    material: "AL6061",
    postProcess: "아노다이징",
    dueDate: "2026-06-18",
    pdf: true,
    dwg: true,
    step: true,
    note: "-",
  },
  {
    no: 4,
    name: "Shaft",
    drawingNo: "DRW-004",
    qty: 2,
    material: "S45C",
    postProcess: "흑착색",
    dueDate: "2026-06-25",
    pdf: true,
    dwg: true,
    step: true,
    note: "-",
  },
  {
    no: 5,
    name: "Bolt",
    drawingNo: "DRW-005",
    qty: 8,
    material: "SS400",
    postProcess: "아연도금",
    dueDate: "2026-06-30",
    pdf: true,
    dwg: true,
    step: true,
    note: "-",
  },
];

function FileIcon({ type }: { type: "pdf" | "dwg" | "step" }) {
  const color =
    type === "pdf"
      ? "text-red-500"
      : type === "dwg"
        ? "text-green-600"
        : "text-blue-500";

  return (
    <button
      type="button"
      onClick={() => alert(`${type.toUpperCase()} 파일 미리보기 기능은 추후 연결 예정입니다.`)}
      className={`inline-flex items-center justify-center text-lg font-bold ${color}`}
    >
      {type === "step" ? "◇" : "▧"}
    </button>
  );
}

function CheckBox({
  checked,
  onClick,
}: {
  checked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-5 w-5 items-center justify-center rounded border text-[11px] font-bold ${
        checked ? "border-black bg-black text-white" : "border-gray-300 bg-white text-white"
      }`}
    >
      ✓
    </button>
  );
}

export default function BidNewPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [bomItems, setBomItems] = useState<BomItem[]>(initialBomItems);
  const [editingNo, setEditingNo] = useState<number | null>(null);
  const [requirementMemo, setRequirementMemo] = useState("");
  const [message, setMessage] = useState("");

  const [settings, setSettings] = useState({
    partialShipment: true,
    urgentProduction: false,
    priorityInspection: false,
    nda: true,
    g1Measure: false,
    g1QualityReview: false,
    firstArticleInspection: false,
  });

  const updateBomItem = (
    no: number,
    key: keyof BomItem,
    value: string | number | boolean,
  ) => {
    setBomItems((prev) =>
      prev.map((item) => (item.no === no ? { ...item, [key]: value } : item)),
    );
  };

  const handleAddItem = () => {
    const nextNo = bomItems.length + 1;

    setBomItems([
      ...bomItems,
      {
        no: nextNo,
        name: `신규 품목 ${nextNo}`,
        drawingNo: `DRW-${String(nextNo).padStart(3, "0")}`,
        qty: 1,
        material: "AL6061",
        postProcess: "없음",
        dueDate: "2026-06-30",
        pdf: false,
        dwg: false,
        step: false,
        note: "-",
      },
    ]);
  };

  const handleDeleteItem = (no: number) => {
    setBomItems((prev) =>
      prev
        .filter((item) => item.no !== no)
        .map((item, index) => ({
          ...item,
          no: index + 1,
        })),
    );
  };

  return (
    <main className="min-h-screen bg-[#f6f6f4] text-black">
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) alert(`${file.name} 파일이 선택되었습니다.`);
        }}
      />

      <div className="grid min-h-screen grid-cols-[240px_1fr]">
        <aside className="border-r border-gray-200 bg-white px-4 py-8">
          <div className="mb-12 px-2">
            <h2 className="text-4xl font-extrabold tracking-tight">G1B2B</h2>
            <p className="mt-2 text-sm text-gray-500">Customer Workspace</p>
          </div>

          <nav className="space-y-2 text-sm font-bold">
            <Link
              href="/workspace"
              className="block rounded-2xl px-4 py-3 text-gray-700 hover:bg-gray-100"
            >
              업무관리
            </Link>

            <Link
              href="/workspace/customer"
              className="block rounded-2xl px-4 py-3 text-gray-700 hover:bg-gray-100"
            >
              고객 업무관리
            </Link>

            <Link
              href="/order/new"
              className="block rounded-2xl px-4 py-3 text-gray-700 hover:bg-gray-100"
            >
              발주 등록
            </Link>

            <Link
              href="/bid/new"
              className="block rounded-2xl bg-black px-4 py-3 text-white"
            >
              입찰 등록
            </Link>

            <Link
              href="/workspace/quality"
              className="block rounded-2xl px-4 py-3 text-gray-700 hover:bg-gray-100"
            >
              품질관리
            </Link>

            <Link
              href="/settings"
              className="block rounded-2xl px-4 py-3 text-gray-700 hover:bg-gray-100"
            >
              설정
            </Link>
          </nav>

          <div className="mt-96 rounded-2xl border border-gray-200 bg-white p-4">
            <p className="text-sm font-extrabold">고객 PM Center</p>
            <p className="mt-2 text-xs text-gray-500">pm@mirae.co.kr</p>
            <p className="text-xs text-gray-500">010-1234-5678</p>
          </div>
        </aside>

        <section className="px-8 py-7">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-extrabold">
                입찰 등록 <span className="text-lg">(프로젝트 기반)</span>
              </h1>
              <p className="mt-3 text-sm text-gray-600">
                프로젝트 정보를 입력하고 BOM 품목과 요구사항을 등록하여 입찰을 요청합니다.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => alert("임시 저장되었습니다.")}
                className="h-11 rounded-xl border border-gray-300 bg-white px-7 text-sm font-bold"
              >
                임시 저장
              </button>

              <button
                type="button"
                onClick={() => alert("입찰 요청이 등록되었습니다.")}
                className="h-11 rounded-xl bg-black px-8 text-sm font-bold text-white"
              >
                입찰 요청 등록
              </button>
            </div>
          </div>

          <section className="mb-4 rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-extrabold">프로젝트 정보</h2>
            </div>

            <div className="grid grid-cols-5 gap-5 p-6">
              {[
                ["PO No.", "PO-2026-0031"],
                ["발주번호", "ORD-2026-0021"],
                ["프로젝트명", "Chamber Module 제작"],
                ["담당 PM", "김지민 PM"],
                ["연락처", "010-1234-5678"],
                ["이메일", "kim.pm@mirae.co.kr"],
              ].map(([label, value]) => (
                <label key={label} className="space-y-2">
                  <span className="text-xs font-bold text-gray-600">{label}</span>
                  <input
                    className="h-11 w-full rounded-lg border border-gray-300 px-4 text-sm font-bold"
                    defaultValue={value}
                  />
                </label>
              ))}

              <label className="space-y-2">
                <span className="text-xs font-bold text-gray-600">고객사</span>
                <select className="h-11 w-full rounded-lg border border-gray-300 px-4 text-sm font-bold">
                  <option>미래정밀(주)</option>
                  <option>에이원테크</option>
                  <option>지원테크</option>
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-xs font-bold text-gray-600">납기일</span>
                <input
                  type="date"
                  className="h-11 w-full rounded-lg border border-gray-300 px-4 text-sm font-bold"
                  defaultValue="2026-06-30"
                />
              </label>

              <label className="space-y-2">
                <span className="text-xs font-bold text-gray-600">통화</span>
                <select className="h-11 w-full rounded-lg border border-gray-300 px-4 text-sm font-bold">
                  <option>KRW</option>
                  <option>USD</option>
                  <option>JPY</option>
                </select>
              </label>

              <label className="col-span-2 space-y-2">
                <span className="text-xs font-bold text-gray-600">프로젝트 설명 (선택)</span>
                <input
                  className="h-11 w-full rounded-lg border border-gray-300 px-4 text-sm"
                  placeholder="프로젝트에 대한 간단한 설명을 입력하세요."
                />
              </label>
            </div>
          </section>

          <section className="mb-4 rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-extrabold">BOM 품목 리스트</h2>
                <p className="mt-2 text-xs text-gray-500">
                  프로젝트에 포함된 모든 품목을 등록하세요.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-10 rounded-xl border border-gray-300 bg-white px-5 text-sm font-bold"
                >
                  엑셀 업로드
                </button>

                <button
                  type="button"
                  onClick={handleAddItem}
                  className="h-10 rounded-xl bg-black px-5 text-sm font-bold text-white"
                >
                  + 품목 추가
                </button>
              </div>
            </div>

            <div className="overflow-auto">
              <table className="w-full min-w-[1240px] text-sm">
                <thead className="bg-[#fafafa] text-xs text-gray-500">
                  <tr>
                    <th className="px-5 py-4 text-left">No.</th>
                    <th className="px-5 py-4 text-left">품목명</th>
                    <th className="px-5 py-4 text-left">도면번호</th>
                    <th className="px-5 py-4 text-left">수량</th>
                    <th className="px-5 py-4 text-left">재질</th>
                    <th className="px-5 py-4 text-left">후처리</th>
                    <th className="px-5 py-4 text-left">납기</th>
                    <th className="px-5 py-4 text-left">도면(PDF)</th>
                    <th className="px-5 py-4 text-left">도면(DWG)</th>
                    <th className="px-5 py-4 text-left">3D(STEP)</th>
                    <th className="px-5 py-4 text-left">비고</th>
                    <th className="px-5 py-4 text-left">관리</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {bomItems.map((item) => (
                    <tr key={item.no} className="hover:bg-[#fafafa]">
                      <td className="px-5 py-4 font-bold">{item.no}</td>

                      <td className="px-5 py-4 font-extrabold">
                        {editingNo === item.no ? (
                          <input
                            value={item.name}
                            onChange={(e) => updateBomItem(item.no, "name", e.target.value)}
                            className="h-9 rounded border px-2"
                          />
                        ) : (
                          item.name
                        )}
                      </td>

                      <td className="px-5 py-4 font-bold">
                        {editingNo === item.no ? (
                          <input
                            value={item.drawingNo}
                            onChange={(e) =>
                              updateBomItem(item.no, "drawingNo", e.target.value)
                            }
                            className="h-9 rounded border px-2"
                          />
                        ) : (
                          item.drawingNo
                        )}
                      </td>

                      <td className="px-5 py-4 font-bold">
                        {editingNo === item.no ? (
                          <input
                            type="number"
                            value={item.qty}
                            onChange={(e) => updateBomItem(item.no, "qty", Number(e.target.value))}
                            className="h-9 w-16 rounded border px-2"
                          />
                        ) : (
                          item.qty
                        )}
                      </td>

                      <td className="px-5 py-4 font-bold">
                        {editingNo === item.no ? (
                          <input
                            value={item.material}
                            onChange={(e) => updateBomItem(item.no, "material", e.target.value)}
                            className="h-9 rounded border px-2"
                          />
                        ) : (
                          item.material
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {editingNo === item.no ? (
                          <select
                            value={item.postProcess}
                            onChange={(e) =>
                              updateBomItem(item.no, "postProcess", e.target.value)
                            }
                            className="h-9 rounded border px-2"
                          >
                            <option>없음</option>
                            <option>아노다이징</option>
                            <option>아연도금</option>
                            <option>흑착색</option>
                            <option>연마</option>
                            <option>열처리</option>
                          </select>
                        ) : (
                          item.postProcess
                        )}
                      </td>

                      <td className="px-5 py-4 font-bold">
                        {editingNo === item.no ? (
                          <input
                            type="date"
                            value={item.dueDate}
                            onChange={(e) => updateBomItem(item.no, "dueDate", e.target.value)}
                            className="h-9 rounded border px-2"
                          />
                        ) : (
                          item.dueDate
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <FileIcon type="pdf" />
                      </td>
                      <td className="px-5 py-4">
                        <FileIcon type="dwg" />
                      </td>
                      <td className="px-5 py-4">
                        <FileIcon type="step" />
                      </td>
                      <td className="px-5 py-4">{item.note}</td>

                      <td className="px-5 py-4">
                        <div className="flex gap-2 text-xs font-bold">
                          <button
                            type="button"
                            onClick={() => setEditingNo(editingNo === item.no ? null : item.no)}
                            className="rounded border px-2 py-1 hover:border-black"
                          >
                            {editingNo === item.no ? "완료" : "수정"}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item.no)}
                            className="rounded border px-2 py-1 hover:border-red-500 hover:text-red-500"
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 px-6 py-4">
                <h2 className="text-lg font-extrabold">제조 요구사항</h2>
              </div>

              <div className="grid grid-cols-3 gap-5 p-6">
                {["재질 / 규격", "공차", "표면처리", "후처리", "검사 조건", "포장 조건"].map(
                  (label) => (
                    <label key={label} className="space-y-2">
                      <span className="text-xs font-bold text-gray-600">{label}</span>
                      <select className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm">
                        <option>도면 기준</option>
                        <option>별도 협의</option>
                      </select>
                    </label>
                  ),
                )}

                <label className="col-span-3 space-y-2">
                  <span className="text-xs font-bold text-gray-600">
                    특이사항 / 추가 요구사항
                  </span>
                  <textarea
                    value={requirementMemo}
                    onChange={(e) => setRequirementMemo(e.target.value.slice(0, 1000))}
                    className="h-20 w-full resize-none rounded-lg border border-gray-300 p-4 text-sm"
                    placeholder="특이사항이나 추가 요구사항이 있으면 입력하세요."
                  />
                  <p className="text-right text-xs text-gray-500">
                    {requirementMemo.length} / 1000
                  </p>
                </label>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 px-6 py-4">
                <h2 className="text-lg font-extrabold">기타 설정</h2>
              </div>

              <div className="grid grid-cols-3 gap-x-8 gap-y-5 p-6">
                {[
                  ["partialShipment", "부분 출하 허용"],
                  ["urgentProduction", "긴급 생산 요청"],
                  ["priorityInspection", "우선 검수 요청"],
                  ["nda", "NDA 필요"],
                  ["g1Measure", "G1 3차원 측정 요청"],
                  ["g1QualityReview", "G1 품질 검토 지원"],
                  ["firstArticleInspection", "초도품 검사 요청"],
                ].map(([key, label]) => (
                  <label key={key} className="flex items-center gap-3 text-sm font-bold">
                    <CheckBox
                      checked={settings[key as keyof typeof settings]}
                      onClick={() =>
                        setSettings((prev) => ({
                          ...prev,
                          [key]: !prev[key as keyof typeof settings],
                        }))
                      }
                    />
                    {label}
                  </label>
                ))}

                <label className="col-span-3 space-y-2">
                  <span className="text-xs font-bold text-gray-600">기타 전달사항</span>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value.slice(0, 500))}
                    className="h-20 w-full resize-none rounded-lg border border-gray-300 p-4 text-sm"
                    placeholder="업체에 전달할 기타 메시지를 입력하세요."
                  />
                  <p className="text-right text-xs text-gray-500">{message.length} / 500</p>
                </label>
              </div>
            </div>
          </section>

          <div className="mt-5 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => alert("임시 저장되었습니다.")}
              className="h-11 rounded-xl border border-gray-300 bg-white px-8 text-sm font-bold"
            >
              임시 저장
            </button>

            <button
              type="button"
              onClick={() => alert("입찰 요청이 등록되었습니다.")}
              className="h-11 rounded-xl bg-black px-10 text-sm font-bold text-white"
            >
              입찰 요청 등록
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}