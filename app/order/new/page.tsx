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
  targetPrice: number;
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
    targetPrice: 3200000,
    pdf: true,
    dwg: true,
    step: true,
    note: "우선 제작",
  },
  {
    no: 2,
    name: "Cover",
    drawingNo: "DRW-002",
    qty: 1,
    material: "SUS304",
    postProcess: "없음",
    dueDate: "2026-06-22",
    targetPrice: 850000,
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
    targetPrice: 420000,
    pdf: true,
    dwg: true,
    step: true,
    note: "부분 출하 가능",
  },
];

function SidebarIcon() {
  return (
    <span className="flex h-4 w-4 items-center justify-center rounded border border-current text-[9px]">
      ·
    </span>
  );
}

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
      onClick={() =>
        alert(`${type.toUpperCase()} 파일 미리보기 기능 예정`)
      }
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
        checked
          ? "border-black bg-black text-white"
          : "border-gray-300 bg-white text-white"
      }`}
    >
      ✓
    </button>
  );
}

function money(value: number) {
  return value.toLocaleString("ko-KR");
}

export default function OrderNewPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [bomItems, setBomItems] =
    useState<BomItem[]>(initialBomItems);

  const [editingNo, setEditingNo] = useState<number | null>(
    null,
  );

  const [orderMemo, setOrderMemo] = useState("");
  const [partnerMessage, setPartnerMessage] =
    useState("");

  const [settings, setSettings] = useState({
    allowPartialShipment: true,
    urgentOrder: false,
    priorityInbound: false,
    g1Inspection: false,
    g1Measure: false,
    ndaRequired: true,
    firstArticle: false,
  });

  const totalTargetPrice = bomItems.reduce(
    (sum, item) =>
      sum + item.targetPrice * item.qty,
    0,
  );

  const updateBomItem = (
    no: number,
    key: keyof BomItem,
    value: string | number | boolean,
  ) => {
    setBomItems((prev) =>
      prev.map((item) =>
        item.no === no
          ? { ...item, [key]: value }
          : item,
      ),
    );
  };

  const handleAddItem = () => {
    const nextNo = bomItems.length + 1;

    setBomItems([
      ...bomItems,
      {
        no: nextNo,
        name: `신규 품목 ${nextNo}`,
        drawingNo: `DRW-${String(nextNo).padStart(
          3,
          "0",
        )}`,
        qty: 1,
        material: "AL6061",
        postProcess: "없음",
        dueDate: "2026-06-30",
        targetPrice: 0,
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
      />

      <div className="grid min-h-screen grid-cols-[240px_1fr]">
        <aside className="border-r border-gray-200 bg-white px-4 py-8">
          <div className="mb-12 px-2">
            <h2 className="text-4xl font-extrabold tracking-tight">
              G1B2B
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Customer Workspace
            </p>
          </div>

          <nav className="space-y-2 text-sm font-bold">
            <Link
              href="/workspace"
              className="flex items-center gap-3 rounded-2xl px-4 py-3 text-gray-700 hover:bg-gray-100"
            >
              <SidebarIcon />
              업무관리
            </Link>

            <Link
              href="/workspace/customer"
              className="flex items-center gap-3 rounded-2xl px-4 py-3 text-gray-700 hover:bg-gray-100"
            >
              <SidebarIcon />
              고객 업무관리
            </Link>

            <Link
              href="/order/new"
              className="flex items-center gap-3 rounded-2xl bg-black px-4 py-3 text-white"
            >
              <SidebarIcon />
              발주 등록
            </Link>

            <Link
              href="/bid/new"
              className="flex items-center gap-3 rounded-2xl px-4 py-3 text-gray-700 hover:bg-gray-100"
            >
              <SidebarIcon />
              입찰 등록
            </Link>

            <Link
              href="/workspace/quality"
              className="flex items-center gap-3 rounded-2xl px-4 py-3 text-gray-700 hover:bg-gray-100"
            >
              <SidebarIcon />
              품질관리
            </Link>

            <Link
              href="/settings"
              className="flex items-center gap-3 rounded-2xl px-4 py-3 text-gray-700 hover:bg-gray-100"
            >
              <SidebarIcon />
              설정
            </Link>
          </nav>
        </aside>

        <section className="px-8 py-7">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-extrabold">
                발주 등록
                <span className="ml-2 text-lg">
                  (타겟금액 기반)
                </span>
              </h1>

              <p className="mt-3 text-sm text-gray-600">
                고객이 목표금액과 BOM을 제시하고,
                파트너사가 발주 참여를 요청하는
                방식입니다.
              </p>
            </div>

            <div className="flex gap-3">
              <button className="h-11 rounded-xl border border-gray-300 bg-white px-7 text-sm font-bold">
                임시 저장
              </button>

              <button className="h-11 rounded-xl bg-black px-8 text-sm font-bold text-white">
                발주 요청 등록
              </button>
            </div>
          </div>

          <section className="mb-4 rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-extrabold">
                발주 프로젝트 정보
              </h2>
            </div>

            <div className="grid grid-cols-5 gap-5 p-6">
              {[
                ["Order No.", "ORD-2026-0021"],
                ["PO No.", "PO-2026-0031"],
                ["프로젝트명", "Chamber Module 제작"],
                ["담당 PM", "김지민 PM"],
                ["연락처", "010-1234-5678"],
                ["이메일", "kim.pm@mirae.co.kr"],
              ].map(([label, value]) => (
                <label
                  key={label}
                  className="space-y-2"
                >
                  <span className="text-xs font-bold text-gray-600">
                    {label}
                  </span>

                  <input
                    className="h-11 w-full rounded-lg border border-gray-300 px-4 text-sm font-bold"
                    defaultValue={value}
                  />
                </label>
              ))}

              <label className="space-y-2">
                <span className="text-xs font-bold text-gray-600">
                  고객사
                </span>

                <select className="h-11 w-full rounded-lg border border-gray-300 px-4 text-sm font-bold">
                  <option>미래정밀(주)</option>
                  <option>지원테크</option>
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-xs font-bold text-gray-600">
                  납기일
                </span>

                <input
                  type="date"
                  className="h-11 w-full rounded-lg border border-gray-300 px-4 text-sm font-bold"
                  defaultValue="2026-06-30"
                />
              </label>

              <label className="space-y-2">
                <span className="text-xs font-bold text-gray-600">
                  통화
                </span>

                <select className="h-11 w-full rounded-lg border border-gray-300 px-4 text-sm font-bold">
                  <option>KRW</option>
                  <option>USD</option>
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-xs font-bold text-gray-600">
                  목표 총액
                </span>

                <div className="flex h-11 items-center rounded-lg border border-gray-300 bg-[#fafafa] px-4 text-sm font-extrabold">
                  {money(totalTargetPrice)}원
                </div>
              </label>

              <label className="space-y-2">
                <span className="text-xs font-bold text-gray-600">
                  발주 방식
                </span>

                <div className="flex h-11 items-center rounded-lg border border-gray-300 bg-[#fafafa] px-4 text-sm font-extrabold">
                  타겟금액 요청
                </div>
              </label>

              <label className="col-span-5 space-y-2">
                <span className="text-xs font-bold text-gray-600">
                  프로젝트 설명
                </span>

                <input
                  className="h-11 w-full rounded-lg border border-gray-300 px-4 text-sm"
                  placeholder="프로젝트 및 발주 설명 입력"
                />
              </label>
            </div>
          </section>

          <section className="mb-4 rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-extrabold">
                  BOM 품목 및 타겟금액
                </h2>

                <p className="mt-2 text-xs text-gray-500">
                  품목별 목표금액과 도면 연결 구조
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
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
              <table className="w-full min-w-[1360px] text-sm">
                <thead className="bg-[#fafafa] text-xs text-gray-500">
                  <tr>
                    <th className="px-5 py-4 text-left">
                      No.
                    </th>
                    <th className="px-5 py-4 text-left">
                      품목명
                    </th>
                    <th className="px-5 py-4 text-left">
                      도면번호
                    </th>
                    <th className="px-5 py-4 text-left">
                      수량
                    </th>
                    <th className="px-5 py-4 text-left">
                      재질
                    </th>
                    <th className="px-5 py-4 text-left">
                      후처리
                    </th>
                    <th className="px-5 py-4 text-left">
                      납기
                    </th>
                    <th className="px-5 py-4 text-left">
                      목표단가
                    </th>
                    <th className="px-5 py-4 text-left">
                      목표금액
                    </th>
                    <th className="px-5 py-4 text-left">
                      PDF
                    </th>
                    <th className="px-5 py-4 text-left">
                      DWG
                    </th>
                    <th className="px-5 py-4 text-left">
                      STEP
                    </th>
                    <th className="px-5 py-4 text-left">
                      관리
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {bomItems.map((item) => (
                    <tr
                      key={item.no}
                      className="hover:bg-[#fafafa]"
                    >
                      <td className="px-5 py-4 font-bold">
                        {item.no}
                      </td>

                      <td className="px-5 py-4 font-extrabold">
                        {editingNo === item.no ? (
                          <input
                            value={item.name}
                            onChange={(e) =>
                              updateBomItem(
                                item.no,
                                "name",
                                e.target.value,
                              )
                            }
                            className="h-9 rounded border px-2"
                          />
                        ) : (
                          item.name
                        )}
                      </td>

                      <td className="px-5 py-4 font-bold">
                        {item.drawingNo}
                      </td>

                      <td className="px-5 py-4 font-bold">
                        {item.qty}
                      </td>

                      <td className="px-5 py-4 font-bold">
                        {item.material}
                      </td>

                      <td className="px-5 py-4">
                        {item.postProcess}
                      </td>

                      <td className="px-5 py-4 font-bold">
                        {item.dueDate}
                      </td>

                      <td className="px-5 py-4 font-bold">
                        {editingNo === item.no ? (
                          <input
                            type="number"
                            value={item.targetPrice}
                            onChange={(e) =>
                              updateBomItem(
                                item.no,
                                "targetPrice",
                                Number(
                                  e.target.value,
                                ),
                              )
                            }
                            className="h-9 w-28 rounded border px-2 text-right"
                          />
                        ) : (
                          `${money(
                            item.targetPrice,
                          )}원`
                        )}
                      </td>

                      <td className="px-5 py-4 font-extrabold">
                        {money(
                          item.targetPrice *
                            item.qty,
                        )}
                        원
                      </td>

                      <td className="px-5 py-4">
                        {item.pdf ? (
                          <FileIcon type="pdf" />
                        ) : (
                          "-"
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {item.dwg ? (
                          <FileIcon type="dwg" />
                        ) : (
                          "-"
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {item.step ? (
                          <FileIcon type="step" />
                        ) : (
                          "-"
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex gap-2 text-xs font-bold">
                          <button
                            type="button"
                            onClick={() =>
                              setEditingNo(
                                editingNo === item.no
                                  ? null
                                  : item.no,
                              )
                            }
                            className="rounded border px-2 py-1"
                          >
                            {editingNo === item.no
                              ? "완료"
                              : "수정"}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteItem(
                                item.no,
                              )
                            }
                            className="rounded border px-2 py-1"
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

          <section className="grid grid-cols-[1fr_420px] gap-4">
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 px-6 py-4">
                <h2 className="text-lg font-extrabold">
                  발주 조건 및 제조 요구사항
                </h2>
              </div>

              <div className="grid grid-cols-3 gap-5 p-6">
                {[
                  "재질 / 규격",
                  "공차",
                  "표면처리",
                  "후처리",
                  "검사 조건",
                  "포장 조건",
                ].map((label) => (
                  <label
                    key={label}
                    className="space-y-2"
                  >
                    <span className="text-xs font-bold text-gray-600">
                      {label}
                    </span>

                    <select className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm">
                      <option>도면 기준</option>
                    </select>
                  </label>
                ))}

                <label className="col-span-3 space-y-2">
                  <span className="text-xs font-bold text-gray-600">
                    발주 특이사항
                  </span>

                  <textarea
                    value={orderMemo}
                    onChange={(e) =>
                      setOrderMemo(
                        e.target.value.slice(
                          0,
                          1000,
                        ),
                      )
                    }
                    className="h-24 w-full resize-none rounded-lg border border-gray-300 p-4 text-sm"
                  />

                  <p className="text-right text-xs text-gray-500">
                    {orderMemo.length} / 1000
                  </p>
                </label>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 px-6 py-4">
                <h2 className="text-lg font-extrabold">
                  발주 설정
                </h2>
              </div>

              <div className="space-y-5 p-6">
                {[
                  [
                    "allowPartialShipment",
                    "부분 출하 허용",
                  ],
                  [
                    "urgentOrder",
                    "긴급 생산 요청",
                  ],
                  [
                    "priorityInbound",
                    "우선 입고 요청",
                  ],
                  [
                    "g1Inspection",
                    "G1 품질 검토 지원",
                  ],
                  [
                    "g1Measure",
                    "G1 3차원 측정 요청",
                  ],
                  ["ndaRequired", "NDA 필요"],
                  [
                    "firstArticle",
                    "초도품 검사 요청",
                  ],
                ].map(([key, label]) => (
                  <label
                    key={key}
                    className="flex items-center gap-3 text-sm font-bold"
                  >
                    <CheckBox
                      checked={
                        settings[
                          key as keyof typeof settings
                        ]
                      }
                      onClick={() =>
                        setSettings((prev) => ({
                          ...prev,
                          [key]:
                            !prev[
                              key as keyof typeof settings
                            ],
                        }))
                      }
                    />

                    {label}
                  </label>
                ))}

                <label className="block space-y-2">
                  <span className="text-xs font-bold text-gray-600">
                    파트너 요청 마감일
                  </span>

                  <input
                    type="date"
                    className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm"
                    defaultValue="2026-05-28"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-xs font-bold text-gray-600">
                    파트너 전달사항
                  </span>

                  <textarea
                    value={partnerMessage}
                    onChange={(e) =>
                      setPartnerMessage(
                        e.target.value.slice(
                          0,
                          500,
                        ),
                      )
                    }
                    className="h-20 w-full resize-none rounded-lg border border-gray-300 p-4 text-sm"
                  />

                  <p className="text-right text-xs text-gray-500">
                    {partnerMessage.length} / 500
                  </p>
                </label>
              </div>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}