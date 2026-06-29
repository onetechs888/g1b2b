"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import WorkspaceLayout from "@/components/workspace/WorkspaceLayout";
import ProjectSelector from "@/components/workspace/ProjectSelector";
import { supabase } from "@/lib/supabase";

function formatMoney(value: number) {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function getNumber(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

export default function CompletedProjectsPage() {
  const searchParams = useSearchParams();
  const selectedProjectCode = searchParams.get("project");
  const isAllProjects = !selectedProjectCode || selectedProjectCode === "all";

  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [projectRows, setProjectRows] = useState<any[]>([]);
  const [bomRows, setBomRows] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      const { data: projectData } = await supabase
        .from("projects")
        .select("*")
        .order("project_code", { ascending: true });

      setProjects(projectData ?? []);

      const currentProject =
        !isAllProjects &&
        projectData?.some(
          (project) => project.project_code === selectedProjectCode
        )
          ? projectData.find(
              (project) => project.project_code === selectedProjectCode
            )
          : null;

      let bomQuery = supabase.from("bom_items").select("*");

      if (!isAllProjects && currentProject?.id) {
        bomQuery = bomQuery.eq("project_id", currentProject.id);
      }

      const { data: bomItems } = await bomQuery;

      const bomIds = bomItems?.map((item) => item.id) ?? [];

      const { data: completedSettlements } = bomIds.length
        ? await supabase
            .from("settlements")
            .select("*")
            .in("bom_item_id", bomIds)
            .eq("status", "completed")
            .order("updated_at", { ascending: false })
        : { data: [] };

      const completedBomIds =
        completedSettlements?.map((item) => item.bom_item_id).filter(Boolean) ??
        [];

      const completedBomSet = new Set(completedBomIds.map(String));

      const completedProjectIds = Array.from(
        new Set(
          bomItems
            ?.filter((item) => completedBomSet.has(String(item.id)))
            .map((item) => item.project_id)
            .filter(Boolean) ?? []
        )
      );

      const targetProjects =
        projectData?.filter((project) =>
          completedProjectIds.includes(project.id)
        ) ?? [];

      const { data: shipments } = completedBomIds.length
        ? await supabase
            .from("shipments")
            .select("*")
            .in("bom_item_id", completedBomIds)
        : { data: [] };

      const { data: documentData } = completedProjectIds.length
        ? await supabase
            .from("documents")
            .select("*")
            .in("project_id", completedProjectIds)
        : { data: [] };

      const { data: logs } = completedProjectIds.length
        ? await supabase
            .from("activity_logs")
            .select("*")
            .in("project_id", completedProjectIds)
            .order("created_at", { ascending: false })
            .limit(8)
        : { data: [] };

      const settlementMap = new Map<string, any>();
      completedSettlements?.forEach((settlement) => {
        settlementMap.set(String(settlement.bom_item_id), settlement);
      });

      const shipmentMap = new Map<string, any>();
      shipments?.forEach((shipment) => {
        shipmentMap.set(String(shipment.bom_item_id), shipment);
      });

      const nextBomRows =
        bomItems
          ?.filter((item) => completedBomSet.has(String(item.id)))
          .map((item) => {
            const settlement = settlementMap.get(String(item.id));
            const shipment = shipmentMap.get(String(item.id));

            const quantity = getNumber(item.quantity);
            const unitPrice = getNumber(item.unit_price);
            const supplyAmount =
              getNumber(settlement?.amount) || quantity * unitPrice;
            const vatAmount =
              getNumber(settlement?.vat) || Math.round(supplyAmount * 0.1);
            const totalAmount =
              getNumber(settlement?.total_amount) || supplyAmount + vatAmount;

            return {
              id: item.id,
              project_id: item.project_id,
              part_number: item.part_number ?? "-",
              part_name: item.part_name ?? "-",
              drawing_no: item.drawing_no ?? "-",
              quantity,
              unit_price: unitPrice,
              supply_amount: supplyAmount,
              vat_amount: vatAmount,
              total_amount: totalAmount,
              shipment_status: shipment?.shipment_status ?? "-",
              settlement_status: settlement?.status ?? "-",
              completed_at:
                settlement?.updated_at ?? settlement?.created_at ?? "-",
            };
          }) ?? [];

      const nextProjectRows = targetProjects.map((project) => {
        const projectBomItems =
          bomItems?.filter((item) => item.project_id === project.id) ?? [];

        const completedItems = nextBomRows.filter(
          (item) => item.project_id === project.id
        );

        const totalBomCount = projectBomItems.length;
        const completedBomCount = completedItems.length;

        const completedAmount = completedItems.reduce(
          (sum, item) => sum + getNumber(item.total_amount),
          0
        );

        const latestCompletedAt =
          completedItems
            .map((item) => item.completed_at)
            .filter(Boolean)
            .sort()
            .reverse()[0] ?? "-";

        return {
          id: project.id,
          project_code: project.project_code ?? "-",
          project_name: project.project_name ?? "-",
          customer_name:
            project.customer_name ??
            project.customer_company_name ??
            project.client_name ??
            "-",
          total_bom_count: totalBomCount,
          completed_bom_count: completedBomCount,
          completion_rate: totalBomCount
            ? Math.round((completedBomCount / totalBomCount) * 100)
            : 0,
          completed_amount: completedAmount,
          completed_at: latestCompletedAt,
        };
      });

      setProjectRows(nextProjectRows);
      setBomRows(nextBomRows);
      setDocuments(documentData ?? []);
      setActivityLogs(logs ?? []);

      if (nextProjectRows.length) {
        setSelectedProjectId(nextProjectRows[0].id);
      } else {
        setSelectedProjectId(null);
      }

      setLoading(false);
    }

    fetchData();
  }, [selectedProjectCode, isAllProjects]);

  const filteredProjectRows = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    if (!normalizedKeyword) return projectRows;

    return projectRows.filter((project) => {
      return (
        String(project.project_code).toLowerCase().includes(normalizedKeyword) ||
        String(project.project_name).toLowerCase().includes(normalizedKeyword) ||
        String(project.customer_name).toLowerCase().includes(normalizedKeyword)
      );
    });
  }, [projectRows, keyword]);

  const selectedProject = useMemo(() => {
    return projectRows.find((project) => project.id === selectedProjectId);
  }, [projectRows, selectedProjectId]);

  const selectedBomRows = useMemo(() => {
    if (!selectedProjectId) return [];
    return bomRows.filter((item) => item.project_id === selectedProjectId);
  }, [bomRows, selectedProjectId]);

  const selectedDocuments = useMemo(() => {
    if (!selectedProjectId) return [];
    return documents.filter((doc) => doc.project_id === selectedProjectId);
  }, [documents, selectedProjectId]);

  const totalCompletedProjects = projectRows.length;
  const totalCompletedBom = bomRows.length;
  const totalCompletedAmount = bomRows.reduce(
    (sum, item) => sum + getNumber(item.total_amount),
    0
  );
  const totalSupplyAmount = bomRows.reduce(
    (sum, item) => sum + getNumber(item.supply_amount),
    0
  );

  if (loading) {
    return (
      <WorkspaceLayout>
        <div className="p-6 text-sm font-bold text-slate-500">
          완료된 프로젝트 데이터를 불러오는 중...
        </div>
      </WorkspaceLayout>
    );
  }

  return (
    <WorkspaceLayout>
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="text-sm font-black text-slate-500">
              프로젝트 &gt; 완료된 프로젝트
            </div>

            <h1 className="mt-2 text-2xl font-black text-slate-950">
              완료된 프로젝트
            </h1>

            <p className="mt-2 text-sm font-medium text-slate-500">
              테스트 데이터 기준으로 정산완료된 BOM 품목이 있는 프로젝트를
              조회합니다.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="프로젝트번호, 프로젝트명, 고객사 검색"
              className="w-80 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-blue-400"
            />

            <button className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700">
              필터
            </button>
          </div>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="grid grid-cols-[260px_repeat(4,1fr)] items-center gap-4">
            <div>
              <div className="text-xs font-bold text-slate-500">
                프로젝트 선택
              </div>

              <div className="mt-3">
                <ProjectSelector
                  projects={[
                    { id: "all", name: "전체 프로젝트" },
                    ...projects.map((project) => ({
                      id: project.project_code,
                      name: `${project.project_code} / ${project.project_name}`,
                    })),
                  ]}
                />
              </div>
            </div>

            <div className="border-l border-slate-200 pl-5">
              <div className="text-xs font-bold text-slate-500">
                완료 프로젝트
              </div>
              <div className="mt-2 text-3xl font-black text-slate-950">
                {totalCompletedProjects}
                <span className="ml-1 text-sm text-slate-500">건</span>
              </div>
            </div>

            <div className="border-l border-slate-200 pl-5">
              <div className="text-xs font-bold text-slate-500">완료 BOM</div>
              <div className="mt-2 text-3xl font-black text-blue-600">
                {totalCompletedBom}
                <span className="ml-1 text-sm text-slate-500">EA</span>
              </div>
            </div>

            <div className="border-l border-slate-200 pl-5">
              <div className="text-xs font-bold text-slate-500">
                총 출하금액
              </div>
              <div className="mt-2 text-xl font-black text-slate-950">
                {formatMoney(totalSupplyAmount)}
              </div>
            </div>

            <div className="border-l border-slate-200 pl-5">
              <div className="text-xs font-bold text-slate-500">
                총 정산금액
              </div>
              <div className="mt-2 text-xl font-black text-emerald-600">
                {formatMoney(totalCompletedAmount)}
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-[1fr_360px] gap-5">
          <section className="rounded-2xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-lg font-black text-slate-950">
                완료 프로젝트 목록
              </h2>
              <p className="mt-1 text-xs font-bold text-slate-500">
                settlements.status = completed 기준 / 테스트 데이터 기반
              </p>
            </div>

            <div className="max-h-[520px] overflow-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="sticky top-0 z-10 bg-slate-50 text-xs font-black text-slate-500">
                  <tr>
                    <th className="px-4 py-3">프로젝트번호</th>
                    <th className="px-4 py-3">프로젝트명</th>
                    <th className="px-4 py-3">고객사</th>
                    <th className="px-4 py-3">완료 BOM</th>
                    <th className="px-4 py-3">총 BOM</th>
                    <th className="px-4 py-3">완료율</th>
                    <th className="px-4 py-3">정산금액</th>
                    <th className="px-4 py-3">완료일</th>
                    <th className="px-4 py-3">상태</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredProjectRows.length ? (
                    filteredProjectRows.map((project) => {
                      const active = selectedProjectId === project.id;

                      return (
                        <Fragment key={project.id}>
                          <tr
                            onClick={() =>
                              setSelectedProjectId(
                                active ? null : project.id
                              )
                            }
                            className={[
                              "cursor-pointer hover:bg-blue-50",
                              active ? "bg-blue-50" : "",
                            ].join(" ")}
                          >
                            <td className="px-4 py-3 font-black text-slate-950">
                              {project.project_code}
                            </td>
                            <td className="px-4 py-3 font-bold text-slate-800">
                              {project.project_name}
                            </td>
                            <td className="px-4 py-3 font-medium text-slate-600">
                              {project.customer_name}
                            </td>
                            <td className="px-4 py-3 font-black text-blue-600">
                              {project.completed_bom_count}
                            </td>
                            <td className="px-4 py-3 font-bold text-slate-700">
                              {project.total_bom_count}
                            </td>
                            <td className="px-4 py-3 font-black text-slate-950">
                              {project.completion_rate}%
                            </td>
                            <td className="px-4 py-3 font-black text-emerald-600">
                              {formatMoney(project.completed_amount)}
                            </td>
                            <td className="px-4 py-3 font-bold text-slate-600">
                              {project.completed_at === "-"
                                ? "-"
                                : String(project.completed_at).slice(0, 10)}
                            </td>
                            <td className="px-4 py-3">
                              <span className="rounded-lg bg-emerald-50 px-2 py-1 text-xs font-black text-emerald-600">
                                완료
                              </span>
                            </td>
                          </tr>

                          {active ? (
                            <tr>
                              <td
                                colSpan={9}
                                className="bg-slate-50 px-5 py-5"
                              >
                                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                                  <div className="mb-4 flex items-center justify-between">
                                    <div>
                                      <h3 className="text-lg font-black text-slate-950">
                                        {project.project_code} BOM 완료 상세
                                      </h3>
                                      <p className="mt-1 text-sm font-medium text-slate-500">
                                        정산완료된 BOM 품목 기준으로 표시합니다.
                                      </p>
                                    </div>
                                    <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-600">
                                      Archive
                                    </span>
                                  </div>

                                  <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 text-xs font-black text-slate-500">
                                      <tr>
                                        <th className="px-3 py-2">Part No</th>
                                        <th className="px-3 py-2">품명</th>
                                        <th className="px-3 py-2">도면번호</th>
                                        <th className="px-3 py-2">수량</th>
                                        <th className="px-3 py-2">출하</th>
                                        <th className="px-3 py-2">정산</th>
                                        <th className="px-3 py-2">정산금액</th>
                                        <th className="px-3 py-2">완료일</th>
                                      </tr>
                                    </thead>

                                    <tbody className="divide-y divide-slate-100">
                                      {selectedBomRows.map((item) => (
                                        <tr key={item.id}>
                                          <td className="px-3 py-2 font-black text-slate-950">
                                            {item.part_number}
                                          </td>
                                          <td className="px-3 py-2 font-bold text-slate-800">
                                            {item.part_name}
                                          </td>
                                          <td className="px-3 py-2 font-medium text-slate-600">
                                            {item.drawing_no}
                                          </td>
                                          <td className="px-3 py-2 font-bold text-slate-700">
                                            {item.quantity}
                                          </td>
                                          <td className="px-3 py-2">
                                            <span className="rounded-lg bg-blue-50 px-2 py-1 text-xs font-black text-blue-600">
                                              출하완료
                                            </span>
                                          </td>
                                          <td className="px-3 py-2">
                                            <span className="rounded-lg bg-emerald-50 px-2 py-1 text-xs font-black text-emerald-600">
                                              정산완료
                                            </span>
                                          </td>
                                          <td className="px-3 py-2 font-black text-emerald-600">
                                            {formatMoney(item.total_amount)}
                                          </td>
                                          <td className="px-3 py-2 font-bold text-slate-600">
                                            {item.completed_at === "-"
                                              ? "-"
                                              : String(item.completed_at).slice(
                                                  0,
                                                  10
                                                )}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </td>
                            </tr>
                          ) : null}
                        </Fragment>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-4 py-10 text-center text-sm font-bold text-slate-400"
                      >
                        정산완료된 BOM 기준 완료 프로젝트가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-black text-slate-950">
                프로젝트 문서
              </h2>

              <div className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="font-bold text-slate-600">선택 프로젝트</span>
                  <span className="font-black text-slate-950">
                    {selectedProject?.project_code ?? "-"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="font-bold text-slate-600">전체 문서</span>
                  <span className="font-black text-slate-950">
                    {selectedDocuments.length}건
                  </span>
                </div>

                <div className="rounded-xl bg-slate-50 px-4 py-3 text-xs font-bold text-slate-500">
                  도면, 검사성적서, 거래명세서, 세금계산서 등은 documents
                  테이블 연결 기준으로 집계됩니다.
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-black text-slate-950">
                최근 완료 이력
              </h2>

              <div className="mt-4 divide-y divide-slate-100">
                {activityLogs.length ? (
                  activityLogs.map((log) => (
                    <div key={log.id} className="py-3">
                      <div className="font-black text-slate-800">
                        {log.action ?? "활동"}
                      </div>
                      <div className="mt-1 text-xs font-medium text-slate-500">
                        {log.memo ?? "-"}
                      </div>
                      <div className="mt-1 text-xs font-bold text-slate-400">
                        {log.created_at
                          ? String(log.created_at).slice(0, 19)
                          : "-"}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-sm font-bold text-slate-400">
                    최근 완료 이력이 없습니다.
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </WorkspaceLayout>
  );
}