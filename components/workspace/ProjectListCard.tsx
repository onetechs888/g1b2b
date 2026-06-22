"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

interface ProjectItem {
  project_no: string;
  project_name: string;
  customer_name: string;
  due_date: string;
  status: string;
  bom_count: number;
  shipment_ready_count: number;
}

interface ProjectListCardProps {
  projects: ProjectItem[];
  allProjects: ProjectItem[];
  selectedProjectCode?: string;
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
    <div className="rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <h2 className="text-xl font-bold text-slate-900">프로젝트 목록</h2>

        <div className="flex gap-2">
          <select
            value={selectedProjectCode ?? "all"}
            onChange={(event) => handleProjectChange(event.target.value)}
            className="rounded-lg border border-blue-500 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 outline-none"
          >
            <option value="all">전체 프로젝트</option>

            {allProjects.map((project) => (
              <option key={project.project_no} value={project.project_no}>
                {project.project_no} / {project.project_name}
              </option>
            ))}
          </select>

          <button className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium">
            내보내기
          </button>
        </div>
      </div>

      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50 text-xs text-slate-500">
            <th className="px-4 py-3 text-left">프로젝트</th>
            <th className="px-4 py-3 text-left">고객사</th>
            <th className="px-4 py-3 text-left">납기일</th>
            <th className="px-4 py-3 text-left">상태</th>
            <th className="px-4 py-3 text-center">BOM</th>
            <th className="px-4 py-3 text-center">출하준비</th>
            <th className="px-4 py-3 text-center">관리</th>
          </tr>
        </thead>

        <tbody>
          {projects.map((project) => (
            <tr
              key={project.project_no}
              className="border-b border-slate-100 hover:bg-slate-50"
            >
              <td className="px-4 py-4">
                <div className="font-semibold text-slate-900">
                  {project.project_no}
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  {project.project_name}
                </div>
              </td>

              <td className="px-4 py-4 text-sm">{project.customer_name}</td>
              <td className="px-4 py-4 text-sm">{project.due_date}</td>

              <td className="px-4 py-4">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    project.status === "진행중"
                      ? "bg-green-100 text-green-700"
                      : project.status === "완료"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-orange-100 text-orange-700"
                  }`}
                >
                  {project.status}
                </span>
              </td>

              <td className="px-4 py-4 text-center font-semibold">
                {project.bom_count}
              </td>

              <td className="px-4 py-4 text-center font-semibold">
                {project.shipment_ready_count}
              </td>

              <td className="px-4 py-4 text-center">
                <Link
                  href={`/workspace/partner/production?project=${project.project_no}`}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-100"
                >
                  관리
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex items-center justify-between px-6 py-4">
        <div className="text-sm text-slate-500">
          전체 {projects.length}개 프로젝트
        </div>

        <div className="flex gap-2">
          <button className="h-8 w-8 rounded border border-slate-200">‹</button>
          <button className="h-8 w-8 rounded bg-blue-600 text-white">1</button>
          <button className="h-8 w-8 rounded border border-slate-200">›</button>
        </div>
      </div>
    </div>
  );
}