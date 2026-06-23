"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, MoreVertical } from "lucide-react";

interface ProjectItem {
  project_no: string;
  project_name: string;
  customer_name: string;
  due_date: string;
  dday?: string;
  health?: string;
  status: string;
  current_stage?: string;
  progress_percent?: number;
  bom_count: number;
  shipment_ready_count: number;
}

interface ProjectListCardProps {
  projects: ProjectItem[];
  allProjects: ProjectItem[];
  selectedProjectCode?: string;
}

function getHealthClass(health?: string) {
  if (health === "정상") return "bg-emerald-500 text-white";
  if (health === "주의") return "bg-orange-500 text-white";
  if (health === "지연") return "bg-red-500 text-white";
  return "bg-slate-400 text-white";
}

function getDdayClass(dday?: string) {
  if (!dday || dday === "-") return "text-slate-400";
  if (dday.startsWith("D+")) return "text-red-600";
  if (dday === "D-Day") return "text-orange-600";
  return "text-red-500";
}

export default function ProjectListCard({
  projects,
  allProjects,
  selectedProjectCode,
}: ProjectListCardProps) {
  const router = useRouter();

  function handleProjectChange(value: string) {
    if (value === "all") {
      router.push("/workspace/partner");
      return;
    }

    router.push(`/workspace/partner?project=${value}`);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <h2 className="text-xl font-black tracking-tight text-slate-950">
          프로젝트 목록
        </h2>

        <div className="flex gap-2">
          <select
            value={selectedProjectCode ?? "all"}
            onChange={(event) => handleProjectChange(event.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 outline-none transition hover:border-blue-300"
          >
            <option value="all">전체 프로젝트</option>

            {allProjects.map((project) => (
              <option key={project.project_no} value={project.project_no}>
                {project.project_no} / {project.project_name}
              </option>
            ))}
          </select>

          <button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 transition hover:border-blue-300 hover:text-blue-700">
            <Download size={14} />
            내보내기
          </button>
        </div>
      </div>

      <div className="px-4 py-3">
        <div className="max-h-[360px] overflow-y-auto pr-1">
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-white">
              <tr className="rounded-xl bg-slate-50 text-[11px] font-black text-slate-500">
                <th className="px-2 py-3 text-left">프로젝트</th>
                <th className="px-2 py-3 text-left">고객사</th>
                <th className="px-2 py-3 text-left">납기일</th>
                <th className="px-2 py-3 text-left">진행률</th>
                <th className="px-2 py-3 text-left">상태</th>
                <th className="px-2 py-3 text-center">BOM</th>
                <th className="px-2 py-3 text-center">출하</th>
                <th className="px-2 py-3 text-center">관리</th>
              </tr>
            </thead>

            <tbody>
              {projects.map((project) => (
                <tr
                  key={project.project_no}
                  className="border-b border-slate-100 transition hover:bg-slate-50"
                >
                  <td className="px-2 py-3">
                    <div className="text-sm font-black text-slate-950">
                      {project.project_no}
                    </div>
                    <div className="mt-1 text-xs font-semibold text-slate-500">
                      {project.project_name}
                    </div>
                  </td>

                  <td className="px-2 py-3 text-xs font-bold text-slate-700">
                    {project.customer_name}
                  </td>

                  <td className="px-2 py-3">
                    <div className="text-xs font-bold text-slate-950">
                      {project.due_date}
                    </div>
                    <div
                      className={`mt-1 text-[11px] font-black ${getDdayClass(
                        project.dday
                      )}`}
                    >
                      {project.dday ?? "-"}
                    </div>
                  </td>

                  <td className="px-2 py-3">
                    <div className="flex items-center gap-2">
                      <span className="w-8 text-xs font-black text-slate-800">
                        {Math.round(project.progress_percent ?? 0)}%
                      </span>
                      <div className="h-2 w-20 rounded-full bg-slate-100">
                        <div
                          className="h-2 rounded-full bg-blue-600"
                          style={{
                            width: `${Math.min(
                              project.progress_percent ?? 0,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </td>

                  <td className="px-2 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-black ${getHealthClass(
                        project.health
                      )}`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      {project.health ?? project.status}
                    </span>
                  </td>

                  <td className="px-2 py-3 text-center text-xs font-black text-slate-950">
                    {project.bom_count}
                  </td>

                  <td className="px-2 py-3 text-center text-xs font-black text-slate-950">
                    {project.shipment_ready_count}
                  </td>

                  <td className="px-2 py-3">
                    <div className="flex items-center justify-center gap-1.5">
                      <Link
                        href={`/workspace/partner/production?project=${project.project_no}`}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-black text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                      >
                        관리
                      </Link>

                      <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50">
                        <MoreVertical size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {projects.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-sm font-bold text-slate-400"
                  >
                    표시할 프로젝트가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-1 py-3">
          <div className="text-xs font-bold text-slate-500">
            전체 {projects.length}개 프로젝트
          </div>

          <div className="flex gap-2">
            <button className="h-8 w-8 rounded-lg border border-slate-200 text-xs font-black text-slate-600">
              ‹
            </button>
            <button className="h-8 w-8 rounded-lg bg-blue-600 text-xs font-black text-white">
              1
            </button>
            <button className="h-8 w-8 rounded-lg border border-slate-200 text-xs font-black text-slate-600">
              ›
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}