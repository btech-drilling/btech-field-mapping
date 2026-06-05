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
    .select(
      "id, point_code, status, sample_id, sample_photo_url, outcrop_photo_url, updated_at"
    )
    .eq("project_id", id)
    .order("updated_at", { ascending: false });

  const pointList = points ?? [];
  const totalPoints = pointList.length;

  const planned = pointList.filter((p) => p.status === "PLANNED").length;
  const visited = pointList.filter((p) => p.status === "VISITED").length;
  const sampled = pointList.filter((p) => p.status === "SAMPLED").length;
  const completed = pointList.filter((p) => p.status === "COMPLETED").length;
  const needRevisit = pointList.filter(
    (p) => p.status === "NEED_REVISIT"
  ).length;

  const sampleCount = pointList.filter((p) => p.sample_id).length;
  const photoCount = pointList.filter(
    (p) => p.sample_photo_url || p.outcrop_photo_url
  ).length;

  const progress =
    totalPoints > 0 ? Math.round((completed / totalPoints) * 100) : 0;

  const statusRows = [
    ["COMPLETED", completed, "bg-green-600"],
    ["SAMPLED", sampled, "bg-orange-500"],
    ["VISITED", visited, "bg-yellow-500"],
    ["NEED_REVISIT", needRevisit, "bg-red-600"],
    ["PLANNED", planned, "bg-blue-600"],
  ] as const;

  const recentPoints = pointList
    .filter((p) => p.status && p.status !== "PLANNED")
    .slice(0, 6);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl p-6">
        <div className="mb-6">
          <Link href="/projects" className="text-sm text-slate-300 underline">
            ← Back to Projects
          </Link>
        </div>

        <section className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 p-8 shadow-2xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-sm text-emerald-300">
                Project Dashboard
              </div>

              <h1 className="text-4xl font-black tracking-tight">
                {project.project_code}
              </h1>

              <p className="mt-2 text-xl text-slate-200">
                {project.project_name}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-sm font-semibold text-emerald-300">
                  {project.status}
                </span>

                {project.description && (
                  <span className="rounded-full bg-white/10 px-3 py-1 text-sm text-slate-300">
                    {project.description}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={`/projects/${project.id}/map`}
                className="rounded-xl bg-white px-5 py-3 font-semibold text-slate-950 shadow hover:bg-slate-100"
              >
                Open Map
              </Link>

              <Link
                href={`/projects/${project.id}/points`}
                className="rounded-xl border border-white/20 px-5 py-3 font-semibold text-white hover:bg-white/10"
              >
                Points List
              </Link>

              <Link
                href={`/projects/${project.id}/import`}
                className="rounded-xl border border-white/20 px-5 py-3 font-semibold text-white hover:bg-white/10"
              >
                Import KML
              </Link>
            </div>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-4">
            {[
              ["Total Points", totalPoints],
              ["Samples", sampleCount],
              ["Photos", photoCount],
              ["Completed", completed],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur"
              >
                <div className="text-sm text-slate-300">{label}</div>
                <div className="mt-2 text-4xl font-black">{value}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-3xl border border-white/10 bg-white p-6 text-slate-950 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Project Progress</h2>
                <p className="text-sm text-slate-500">
                  Completed points compared with total mapping points
                </p>
              </div>

              <div className="text-4xl font-black">{progress}%</div>
            </div>

            <div className="h-5 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-emerald-600"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="mt-6 grid gap-4">
              {statusRows.map(([label, value, color]) => {
                const percent =
                  totalPoints > 0
                    ? Math.round((Number(value) / totalPoints) * 100)
                    : 0;

                return (
                  <div key={label}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="font-medium">{label}</span>
                      <span className="text-slate-500">
                        {value} / {totalPoints} ({percent}%)
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded bg-slate-200">
                      <div
                        className={`h-full ${color}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white p-6 text-slate-950 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Quick Actions</h2>
            </div>

            <div className="grid gap-3">
              <Link
                href={`/projects/${project.id}/map`}
                className="rounded-2xl border p-4 hover:bg-slate-50"
              >
                <div className="font-bold">🗺 Open Map</div>
                <div className="text-sm text-slate-500">
                  View geology layers, TV layers and field mapping points
                </div>
              </Link>

              <Link
                href={`/projects/${project.id}/points`}
                className="rounded-2xl border p-4 hover:bg-slate-50"
              >
                <div className="font-bold">📍 Mapping Points</div>
                <div className="text-sm text-slate-500">
                  Review field records, status and photos
                </div>
              </Link>

              <Link
                href={`/projects/${project.id}/import`}
                className="rounded-2xl border p-4 hover:bg-slate-50"
              >
                <div className="font-bold">⬆ Import KML / KMZ</div>
                <div className="text-sm text-slate-500">
                  Upload planned points, geology polygons and map layers
                </div>
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-white/10 bg-white p-6 text-slate-950 shadow-xl">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Recent Field Updates</h2>
              <p className="text-sm text-slate-500">
                Latest non-planned mapping records
              </p>
            </div>

            <Link
              href={`/projects/${project.id}/points`}
              className="text-sm underline"
            >
              View all
            </Link>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {recentPoints.map((p) => (
              <Link
                key={p.id}
                href={`/projects/${project.id}/points/${p.id}`}
                className="rounded-2xl border p-4 hover:bg-slate-50"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-bold">{p.point_code}</div>
                    <div className="text-sm text-slate-500">
                      {p.sample_id ? `Sample: ${p.sample_id}` : "No sample"}
                    </div>
                  </div>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {p.status}
                  </span>
                </div>
              </Link>
            ))}

            {recentPoints.length === 0 && (
              <div className="rounded-2xl border border-dashed p-6 text-center text-slate-500">
                No field updates yet
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}