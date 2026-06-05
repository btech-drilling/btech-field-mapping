import { supabase } from "@/lib/supabase";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: project, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !project) {
    return <div className="p-6">Project not found</div>;
  }

  const { data: points } = await supabase
    .from("mapping_points")
    .select("id, status")
    .eq("project_id", id);

  const pointList = points ?? [];
  const totalPoints = pointList.length;
  const visitedPoints = pointList.filter((p) => p.status === "VISITED").length;
  const sampledPoints = pointList.filter((p) => p.status === "SAMPLED").length;
  const completedPoints = pointList.filter(
    (p) => p.status === "COMPLETED"
  ).length;

  return (
    <div className="p-6">
      <Link href="/projects" className="text-sm underline">
        ← Back to Projects
      </Link>

      <div className="mt-4 rounded-lg border p-5">
        <div className="text-sm text-gray-500">Project</div>
        <h1 className="text-2xl font-bold">{project.project_code}</h1>
        <p className="text-lg">{project.project_name}</p>
        <p className="mt-1 text-sm text-gray-500">Status: {project.status}</p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border p-4">
          <div className="text-sm text-gray-500">Total Points</div>
          <div className="text-2xl font-bold">{totalPoints}</div>
        </div>

        <div className="rounded-lg border p-4">
          <div className="text-sm text-gray-500">Visited</div>
          <div className="text-2xl font-bold">{visitedPoints}</div>
        </div>

        <div className="rounded-lg border p-4">
          <div className="text-sm text-gray-500">Sampled</div>
          <div className="text-2xl font-bold">{sampledPoints}</div>
        </div>

        <div className="rounded-lg border p-4">
          <div className="text-sm text-gray-500">Completed</div>
          <div className="text-2xl font-bold">{completedPoints}</div>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <Link
          href={`/projects/${project.id}/map`}
          className="rounded-lg border p-4 hover:bg-gray-50"
        >
          <div className="font-bold">🗺 View Map</div>
          <div className="text-sm text-gray-500">
            View field points, popup data, and photos
          </div>
        </Link>

        <Link
          href={`/projects/${project.id}/points`}
          className="rounded-lg border p-4 hover:bg-gray-50"
        >
          <div className="font-bold">📍 Mapping Points</div>
          <div className="text-sm text-gray-500">
            Field mapping records and photo thumbnails
          </div>
        </Link>

        <Link
          href={`/projects/${project.id}/import`}
          className="rounded-lg border p-4 hover:bg-gray-50"
        >
          <div className="font-bold">Import KML</div>
          <div className="text-sm text-gray-500">
            Upload planned points / geology layer
          </div>
        </Link>
      </div>
    </div>
  );
}