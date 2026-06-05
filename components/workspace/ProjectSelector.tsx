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
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <label className="mb-2 block text-xs font-medium text-gray-500">
        프로젝트 선택
      </label>

      <select className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.id} · {project.name}
          </option>
        ))}
      </select>
    </div>
  );
}