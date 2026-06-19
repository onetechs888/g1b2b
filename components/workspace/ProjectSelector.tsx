"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface Project {
  id: string;
  name: string;
}

interface ProjectSelectorProps {
  projects: Project[];
}

export default function ProjectSelector({ projects }: ProjectSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedProject = searchParams.get("project") ?? projects[0]?.id ?? "";

  const handleChange = (projectId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("project", projectId);

    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <label className="mb-2 block text-xs font-medium text-gray-500">
        프로젝트 선택
      </label>

      <select
        value={selectedProject}
        onChange={(event) => handleChange(event.target.value)}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
      >
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.name}
          </option>
        ))}
      </select>
    </div>
  );
}