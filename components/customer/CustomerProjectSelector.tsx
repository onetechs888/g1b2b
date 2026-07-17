"use client";

import { useEffect, useMemo, useState } from "react";
import { FolderKanban, Search } from "lucide-react";
import { supabase } from "@/lib/supabase";

type CustomerProject = {
  id: string;
  project_code: string | null;
  project_name: string | null;
  status: string | null;
  due_date: string | null;
};

interface CustomerProjectSelectorProps {
  selectedProjectId: string;
  onChange: (projectId: string) => void;
}

function getProjectStatusLabel(status: string | null) {
  if (status === "draft") return "등록";
  if (status === "bidding") return "입찰";
  if (status === "ordered") return "발주";
  if (status === "production") return "생산";
  if (status === "quality") return "품질";
  if (status === "shipment") return "출하";
  if (status === "settlement") return "정산";
  if (status === "completed") return "완료";

  return status || "-";
}

export default function CustomerProjectSelector({
  selectedProjectId,
  onChange,
}: CustomerProjectSelectorProps) {
  const [projects, setProjects] = useState<CustomerProject[]>([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    async function fetchProjects() {
      setLoading(true);
      setErrorMessage("");

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          throw authError;
        }

        if (!user) {
          throw new Error("로그인 사용자 정보를 확인할 수 없습니다.");
        }

        const { data: userProfile, error: userProfileError } = await supabase
          .from("users")
          .select("company_id")
          .eq("id", user.id)
          .single();

        if (userProfileError) {
          throw userProfileError;
        }

        if (!userProfile?.company_id) {
          throw new Error("로그인 사용자에게 연결된 회사 정보가 없습니다.");
        }

        const { data: projectData, error: projectError } = await supabase
          .from("projects")
          .select(
            "id, project_code, project_name, status, due_date"
          )
          .eq("customer_company_id", userProfile.company_id)
          .neq("status", "completed")
          .order("created_at", { ascending: false });

        if (projectError) {
          throw projectError;
        }

        if (!mounted) return;

        const nextProjects = projectData ?? [];

        setProjects(nextProjects);

        const selectedProjectExists = nextProjects.some(
          (project) => project.id === selectedProjectId
        );

        if (!selectedProjectExists && nextProjects.length > 0) {
          onChange(nextProjects[0].id);
        }

        if (nextProjects.length === 0) {
          onChange("");
        }
      } catch (error) {
        if (!mounted) return;

        const message =
          error instanceof Error
            ? error.message
            : "프로젝트 목록을 불러오지 못했습니다.";

        setErrorMessage(message);
        setProjects([]);
        onChange("");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchProjects();

    return () => {
      mounted = false;
    };
  }, [onChange, selectedProjectId]);

  const filteredProjects = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    if (!normalizedKeyword) {
      return projects;
    }

    return projects.filter((project) => {
      const projectCode = project.project_code?.toLowerCase() ?? "";
      const projectName = project.project_name?.toLowerCase() ?? "";

      return (
        projectCode.includes(normalizedKeyword) ||
        projectName.includes(normalizedKeyword)
      );
    });
  }, [keyword, projects]);

  const selectedProject =
    projects.find((project) => project.id === selectedProjectId) ?? null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <FolderKanban size={18} className="text-blue-600" />

            <h2 className="text-base font-black text-slate-950">
              프로젝트 선택
            </h2>
          </div>

          <p className="mt-2 text-sm font-medium text-slate-500">
            모니터링할 프로젝트를 선택해주세요.
          </p>
        </div>

        <div className="grid w-full gap-3 md:grid-cols-[280px_360px] xl:w-auto">
          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="프로젝트번호 또는 프로젝트명 검색"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <select
            value={selectedProjectId}
            onChange={(event) => onChange(event.target.value)}
            disabled={loading || filteredProjects.length === 0}
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-400"
          >
            {loading ? (
              <option value="">프로젝트를 불러오는 중...</option>
            ) : null}

            {!loading && filteredProjects.length === 0 ? (
              <option value="">조회 가능한 프로젝트가 없습니다.</option>
            ) : null}

            {!loading
              ? filteredProjects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.project_code ?? "-"} /{" "}
                    {project.project_name ?? "-"}
                  </option>
                ))
              : null}
          </select>
        </div>
      </div>

      {errorMessage ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {errorMessage}
        </div>
      ) : null}

      {!errorMessage && selectedProject ? (
        <div className="mt-5 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-3">
          <div>
            <div className="text-xs font-bold text-slate-400">프로젝트번호</div>
            <div className="mt-1 text-sm font-black text-slate-950">
              {selectedProject.project_code ?? "-"}
            </div>
          </div>

          <div>
            <div className="text-xs font-bold text-slate-400">현재 상태</div>
            <div className="mt-1 text-sm font-black text-blue-600">
              {getProjectStatusLabel(selectedProject.status)}
            </div>
          </div>

          <div>
            <div className="text-xs font-bold text-slate-400">납기일</div>
            <div className="mt-1 text-sm font-black text-slate-950">
              {selectedProject.due_date ?? "-"}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}