"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface Project {
  id: string;
  name: string;
}

interface ProjectSelectorProps {
  projects: Project[];
}

export default function ProjectSelector({
  projects,
}: ProjectSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedProject =
    searchParams.get("project") ?? "all";

  const handleChange = (projectId: string) => {
    if (projectId === "all") {
      router.push(pathname);
      return;
    }

    const params = new URLSearchParams(
      searchParams.toString()
    );

    params.set("project", projectId);

    router.push(
      `${pathname}?${params.toString()}`
    );
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
        PROJECT
      </label>

      <select
        value={selectedProject}
        onChange={(e) => handleChange(e.target.value)}
        className="
          h-11
          w-full
          rounded-xl
          border
          border-slate-200
          bg-white
          px-4
          text-sm
          font-semibold
          text-slate-800
          shadow-sm
          outline-none
          transition-all
          hover:border-blue-300
          focus:border-blue-500
          focus:ring-2
          focus:ring-blue-100
        "
      >
        <option value="all">
          전체 프로젝트
        </option>

        {projects.map((project) => (
          <option
            key={project.id}
            value={project.id}
          >
            {project.name}
          </option>
        ))}
      </select>
    </div>
  );
}