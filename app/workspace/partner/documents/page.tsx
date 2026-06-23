import WorkspaceLayout from "@/components/workspace/WorkspaceLayout";
import ProjectSelector from "@/components/workspace/ProjectSelector";
import { supabase } from "@/lib/supabase";

type DocumentsPageProps = {
  searchParams: Promise<{
    project?: string;
  }>;
};

function getDocumentTypeLabel(type: string) {
  if (type === "drawing") return "도면";
  if (type === "pdf") return "PDF";
  if (type === "dwg") return "DWG";
  if (type === "dxf") return "DXF";
  if (type === "step") return "STEP";
  if (type === "inspection_report") return "검사성적서";
  if (type === "measurement_data") return "측정데이터";
  if (type === "ncr") return "NCR";
  if (type === "shipment") return "출하문서";
  if (type === "settlement") return "정산문서";
  if (type === "work_order") return "작업지시서";
  return type ?? "-";
}

function getDocumentBadgeClass(type: string) {
  if (type === "drawing" || type === "dwg" || type === "dxf" || type === "step") {
    return "bg-blue-50 text-blue-600";
  }

  if (type === "inspection_report" || type === "measurement_data") {
    return "bg-emerald-50 text-emerald-600";
  }

  if (type === "ncr") {
    return "bg-red-50 text-red-600";
  }

  if (type === "shipment") {
    return "bg-cyan-50 text-cyan-600";
  }

  if (type === "settlement") {
    return "bg-orange-50 text-orange-600";
  }

  return "bg-slate-100 text-slate-600";
}

function getFileExtension(fileName: string) {
  const parts = fileName?.split(".") ?? [];
  return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : "-";
}

function formatFileSize(size: unknown) {
  const value = Number(size);

  if (!Number.isFinite(value) || value <= 0) {
    return "-";
  }

  if (value >= 1024 * 1024) {
    return `${(value / 1024 / 1024).toFixed(1)} MB`;
  }

  if (value >= 1024) {
    return `${Math.round(value / 1024)} KB`;
  }

  return `${value} B`;
}

export default async function DocumentsPage({ searchParams }: DocumentsPageProps) {
  const params = await searchParams;
  const selectedProjectCode = params?.project;

  const { data: projects, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .order("project_code", { ascending: true });

  if (projectError) {
    return (
      <WorkspaceLayout>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          프로젝트 데이터를 불러오지 못했습니다.
        </div>
      </WorkspaceLayout>
    );
  }

  const selectedProject =
    selectedProjectCode &&
    projects?.some((project) => project.project_code === selectedProjectCode)
      ? projects.find((project) => project.project_code === selectedProjectCode)
      : projects?.[0];

  const { data: bomItems, error: bomError } = await supabase
    .from("bom_items")
    .select("*")
    .eq("project_id", selectedProject?.id ?? "")
    .order("part_number", { ascending: true });

  const bomIds = bomItems?.map((item) => item.id) ?? [];

  const { data: documents, error: documentError } = bomIds.length
    ? await supabase
        .from("documents")
        .select("*")
        .in("bom_item_id", bomIds)
        .order("created_at", { ascending: false })
    : { data: [], error: null };

  if (bomError || documentError) {
    return (
      <WorkspaceLayout>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          문서 데이터를 불러오지 못했습니다.
        </div>
      </WorkspaceLayout>
    );
  }

  const bomMap = new Map();

  bomItems?.forEach((item) => {
    bomMap.set(String(item.id), item);
  });

  const rows =
    documents?.map((document, index) => {
      const bom = bomMap.get(String(document.bom_item_id));
      const fileName =
        document.file_name ??
        document.name ??
        document.title ??
        "문서명 없음";

      const documentType =
        document.document_type ??
        document.file_type ??
        document.type ??
        getFileExtension(fileName).toLowerCase();

      return {
        no: index + 1,
        id: document.id,
        project_code: selectedProject?.project_code ?? "-",
        project_name: selectedProject?.project_name ?? "-",
        bom_item_id: document.bom_item_id,
        part_number: bom?.part_number ?? "-",
        part_name: bom?.part_name ?? "-",
        drawing_no: bom?.drawing_no ?? "-",
        file_name: fileName,
        file_type: documentType,
        extension: getFileExtension(fileName),
        revision: document.revision ?? document.rev ?? "-",
        file_size: formatFileSize(document.file_size ?? document.size_bytes),
        file_url: document.file_url ?? document.url ?? document.storage_url ?? null,
        uploaded_by: document.uploaded_by ?? document.created_by ?? "-",
        created_at: document.created_at ?? "-",
        status: document.status ?? "active",
      };
    }) ?? [];

  const totalCount = rows.length;

  const drawingCount = rows.filter((row) =>
    ["drawing", "pdf", "dwg", "dxf", "step"].includes(row.file_type)
  ).length;

  const inspectionCount = rows.filter((row) =>
    ["inspection_report", "measurement_data"].includes(row.file_type)
  ).length;

  const shipmentCount = rows.filter((row) => row.file_type === "shipment").length;

  const settlementCount = rows.filter(
    (row) => row.file_type === "settlement"
  ).length;

  const recentRows = rows.slice(0, 5);

  return (
    <WorkspaceLayout>
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="text-sm font-black text-slate-500">
              문서관리 &gt; 문서 관리
            </div>

            <h1 className="mt-2 text-2xl font-black text-slate-950">
              문서관리
            </h1>

            <p className="mt-2 text-sm font-medium text-slate-500">
              프로젝트별 도면, PDF, DWG, STEP, 검사성적서, 출하문서를
              다운로드할 수 있습니다.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-500">
              프로젝트명, 품목명, 문서명 검색
            </div>

            <button className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700">
              필터
            </button>
          </div>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="grid grid-cols-[240px_repeat(5,1fr)] items-center gap-4">
            <div>
              <div className="text-xs font-bold text-slate-500">
                프로젝트 (PO)
              </div>

              <div className="mt-3">
                <ProjectSelector
                  projects={
                    projects?.map((project) => ({
                      id: project.project_code,
                      name: `${project.project_code} / ${project.project_name}`,
                    })) ?? []
                  }
                />
              </div>
            </div>

            <div className="border-l border-slate-200 pl-5">
              <div className="text-xs font-bold text-slate-500">전체 문서</div>
              <div className="mt-2 text-2xl font-black text-slate-950">
                {totalCount}
                <span className="ml-1 text-sm text-slate-500">건</span>
              </div>
            </div>

            <div className="border-l border-slate-200 pl-5">
              <div className="text-xs font-bold text-slate-500">
                도면/PDF/DWG
              </div>
              <div className="mt-2 text-2xl font-black text-blue-600">
                {drawingCount}
                <span className="ml-1 text-sm text-slate-500">건</span>
              </div>
            </div>

            <div className="border-l border-slate-200 pl-5">
              <div className="text-xs font-bold text-slate-500">
                검사문서
              </div>
              <div className="mt-2 text-2xl font-black text-emerald-600">
                {inspectionCount}
                <span className="ml-1 text-sm text-slate-500">건</span>
              </div>
            </div>

            <div className="border-l border-slate-200 pl-5">
              <div className="text-xs font-bold text-slate-500">
                출하문서
              </div>
              <div className="mt-2 text-2xl font-black text-cyan-600">
                {shipmentCount}
                <span className="ml-1 text-sm text-slate-500">건</span>
              </div>
            </div>

            <div className="border-l border-slate-200 pl-5">
              <div className="text-xs font-bold text-slate-500">
                정산문서
              </div>
              <div className="mt-2 text-2xl font-black text-orange-600">
                {settlementCount}
                <span className="ml-1 text-sm text-slate-500">건</span>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-[1fr_320px] gap-5">
          <section className="rounded-2xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="w-72 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-500">
                  문서명, 품목명 검색
                </div>

                <select className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700">
                  <option>문서 유형 전체</option>
                </select>

                <select className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700">
                  <option>파일 타입 전체</option>
                </select>
              </div>

              <button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white hover:bg-blue-700">
                문서 업로드
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left text-sm">
                <thead className="bg-slate-50 text-xs font-black text-slate-500">
                  <tr>
                    <th className="px-4 py-3">No.</th>
                    <th className="px-4 py-3">문서명</th>
                    <th className="px-4 py-3">프로젝트 / 품목</th>
                    <th className="px-4 py-3">도면번호</th>
                    <th className="px-4 py-3">문서유형</th>
                    <th className="px-4 py-3">파일</th>
                    <th className="px-4 py-3">Rev</th>
                    <th className="px-4 py-3">등록일</th>
                    <th className="px-4 py-3">크기</th>
                    <th className="px-4 py-3">다운로드</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {rows.length ? (
                    rows.map((row) => (
                      <tr key={row.id} className="hover:bg-blue-50">
                        <td className="px-4 py-3 font-bold text-slate-600">
                          {row.no}
                        </td>

                        <td className="px-4 py-3">
                          <div className="font-black text-slate-950">
                            {row.file_name}
                          </div>
                          <div className="mt-1 text-xs font-medium text-slate-500">
                            {row.extension}
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900">
                            {row.project_code}
                          </div>
                          <div className="text-xs font-medium text-slate-500">
                            {row.part_number} / {row.part_name}
                          </div>
                        </td>

                        <td className="px-4 py-3 font-medium text-slate-600">
                          {row.drawing_no}
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={`rounded-lg px-2 py-1 text-xs font-black ${getDocumentBadgeClass(
                              row.file_type
                            )}`}
                          >
                            {getDocumentTypeLabel(row.file_type)}
                          </span>
                        </td>

                        <td className="px-4 py-3 font-bold text-slate-700">
                          {row.extension}
                        </td>

                        <td className="px-4 py-3 font-bold text-slate-700">
                          {row.revision}
                        </td>

                        <td className="px-4 py-3 font-bold text-slate-600">
                          {row.created_at === "-"
                            ? "-"
                            : String(row.created_at).slice(0, 10)}
                        </td>

                        <td className="px-4 py-3 font-bold text-slate-600">
                          {row.file_size}
                        </td>

                        <td className="px-4 py-3">
                          {row.file_url ? (
                            <a
                              href={row.file_url}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-black text-blue-600 hover:bg-blue-50"
                            >
                              다운로드
                            </a>
                          ) : (
                            <span className="text-xs font-bold text-slate-400">
                              파일 없음
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={10}
                        className="px-4 py-12 text-center text-sm font-bold text-slate-400"
                      >
                        등록된 문서가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4">
              <div className="text-sm font-bold text-slate-500">
                총 {totalCount}건
              </div>

              <div className="text-xs font-bold text-slate-400">
                프로젝트별 제조문서 다운로드 포털
              </div>
            </div>
          </section>

          <aside className="space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-slate-950">
                  최근 문서
                </h2>
                <span className="text-xs font-black text-blue-600">
                  전체보기
                </span>
              </div>

              <div className="mt-4 divide-y divide-slate-100">
                {recentRows.length ? (
                  recentRows.map((row) => (
                    <div key={row.id} className="py-3">
                      <div className="font-black text-slate-950">
                        {row.file_name}
                      </div>
                      <div className="mt-1 text-xs font-medium text-slate-500">
                        {row.project_code} / {row.part_number}
                      </div>
                      <div className="mt-1 text-xs font-bold text-slate-400">
                        {row.created_at === "-"
                          ? "-"
                          : String(row.created_at).slice(0, 16)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-sm font-bold text-slate-400">
                    최근 문서가 없습니다.
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-black text-slate-950">바로가기</h2>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <button className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-4 text-sm font-black text-slate-700">
                  도면
                </button>
                <button className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-4 text-sm font-black text-slate-700">
                  DWG
                </button>
                <button className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-4 text-sm font-black text-slate-700">
                  STEP
                </button>
                <button className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-4 text-sm font-black text-slate-700">
                  검사성적서
                </button>
                <button className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-4 text-sm font-black text-slate-700">
                  출하문서
                </button>
                <button className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-4 text-sm font-black text-slate-700">
                  정산문서
                </button>
              </div>
            </section>

            <section className="rounded-xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm font-bold text-blue-700">
              도면, DWG, STEP 파일은 프로젝트와 BOM 품목 기준으로 관리됩니다.
            </section>
          </aside>
        </div>
      </div>
    </WorkspaceLayout>
  );
}