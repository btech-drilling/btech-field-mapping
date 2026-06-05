import Link from "next/link";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: points } = await supabase
    .from("mapping_points")
    .select(
      "id, status, project_id, sample_id, sample_photo_url, outcrop_photo_url"
    );

  const totalProjects = projects?.length ?? 0;
  const totalPoints = points?.length ?? 0;

  const completed = points?.filter((p) => p.status === "COMPLETED").length ?? 0;
  const sampled = points?.filter((p) => p.status === "SAMPLED").length ?? 0;
  const visited = points?.filter((p) => p.status === "VISITED").length ?? 0;
  const needRevisit =
    points?.filter((p) => p.status === "NEED_REVISIT").length ?? 0;
  const planned = points?.filter((p) => p.status === "PLANNED").length ?? 0;

  const sampleCount = points?.filter((p) => p.sample_id).length ?? 0;
  const photoCount =
    points?.filter((p) => p.sample_photo_url || p.outcrop_photo_url).length ??
    0;

  const progress =
    totalPoints > 0 ? Math.round((completed / totalPoints) * 100) : 0;

  const statusRows = [
    ["COMPLETED", completed, "bg-green-600"],
    ["SAMPLED", sampled, "bg-orange-500"],
    ["VISITED", visited, "bg-yellow-500"],
    ["NEED_REVISIT", needRevisit, "bg-red-600"],
    ["PLANNED", planned, "bg-blue-600"],
  ] as const;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl p-6">
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 p-8 shadow-2xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-sm text-emerald-300">
                BTECH GIS Platform
              </div>

              <h1 className="text-4xl font-black tracking-tight">
                Field Mapping Dashboard
              </h1>

              <p className="mt-3 max-w-2xl text-slate-300">
                Geological mapping, field records, samples, photos and project
                progress in one workspace.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/projects"
                className="rounded-xl bg-white px-5 py-3 font-semibold text-slate-950 shadow hover:bg-slate-100"
              >
                Open Projects
              </Link>

              <Link
                href="/projects/new"
                className="rounded-xl border border-white/20 px-5 py-3 font-semibold text-white hover:bg-white/10"
              >
                + Add Project
              </Link>
            </div>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-4">
            {[
              ["Projects", totalProjects],
              ["Mapping Points", totalPoints],
              ["Samples", sampleCount],
              ["Photos", photoCount],
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

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-white/10 bg-white p-6 text-slate-950 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Overall Progress</h2>
                <p className="text-sm text-slate-500">
                  Based on completed mapping points
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
              <h2 className="text-2xl font-bold">Recent Projects</h2>
              <Link href="/projects" className="text-sm underline">
                View all
              </Link>
            </div>

            <div className="grid gap-3">
              {(projects ?? []).slice(0, 5).map((p) => (
                <Link
                  key={p.id}
                  href={`/projects/${p.id}`}
                  className="rounded-2xl border p-4 hover:bg-slate-50"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-bold">{p.project_code}</div>
                      <div className="text-sm text-slate-600">
                        {p.project_name}
                      </div>
                    </div>

                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                      {p.status}
                    </span>
                  </div>
                </Link>
              ))}

              {(projects ?? []).length === 0 && (
                <div className="rounded-2xl border border-dashed p-6 text-center text-slate-500">
                  No projects yet
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}