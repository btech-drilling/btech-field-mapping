import { supabase } from "@/lib/supabase";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const { data: projects, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return <div className="p-6">Error: {error.message}</div>;
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl p-6">
        <div className="mb-6">
          <Link href="/" className="text-sm text-slate-300 underline">
            ← Dashboard
          </Link>
        </div>

        <section className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 p-8 shadow-2xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-sm text-emerald-300">
                Project Workspace
              </div>

              <h1 className="text-4xl font-black tracking-tight">
                Field Mapping Projects
              </h1>

              <p className="mt-3 max-w-2xl text-slate-300">
                Manage geological mapping projects, field records, geology
                layers, samples and site progress.
              </p>
            </div>

            <Link
              href="/projects/new"
              className="rounded-xl bg-white px-5 py-3 font-semibold text-slate-950 shadow hover:bg-slate-100"
            >
              + Add Project
            </Link>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur">
              <div className="text-sm text-slate-300">Total projects</div>
              <div className="mt-2 text-4xl font-black">
                {projects?.length ?? 0}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur">
              <div className="text-sm text-slate-300">Active projects</div>
              <div className="mt-2 text-4xl font-black">
                {(projects ?? []).filter((p) => p.status === "ACTIVE").length}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur">
              <div className="text-sm text-slate-300">System status</div>
              <div className="mt-2 text-2xl font-black text-emerald-300">
                Ready
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Projects</h2>

            <Link href="/projects/new" className="text-sm text-slate-300 underline">
              Create new
            </Link>
          </div>

          <div className="grid gap-4">
            {(projects ?? []).map((p) => (
              <div
                key={p.id}
                className="overflow-hidden rounded-3xl border border-white/10 bg-white text-slate-950 shadow-xl"
              >
                <div className="grid gap-0 lg:grid-cols-[1fr_auto]">
                  <Link
                    href={`/projects/${p.id}`}
                    className="block p-6 hover:bg-slate-50"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="text-sm font-semibold text-slate-500">
                          Project
                        </div>

                        <h3 className="mt-1 text-2xl font-black">
                          {p.project_code}
                        </h3>

                        <p className="mt-1 text-slate-600">{p.project_name}</p>

                        {p.description && (
                          <p className="mt-2 text-sm text-slate-500">
                            {p.description}
                          </p>
                        )}
                      </div>

                      <span className="w-fit rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                        {p.status}
                      </span>
                    </div>
                  </Link>

                  <div className="grid border-t bg-slate-50 p-4 lg:w-56 lg:border-l lg:border-t-0">
                    <Link
                      href={`/projects/${p.id}`}
                      className="rounded-xl px-4 py-3 font-semibold hover:bg-white"
                    >
                      Dashboard →
                    </Link>

                    <Link
                      href={`/projects/${p.id}/map`}
                      className="rounded-xl px-4 py-3 font-semibold hover:bg-white"
                    >
                      Open Map
                    </Link>

                    <Link
                      href={`/projects/${p.id}/points`}
                      className="rounded-xl px-4 py-3 font-semibold hover:bg-white"
                    >
                      Points List
                    </Link>

                    <Link
                      href={`/projects/${p.id}/import`}
                      className="rounded-xl px-4 py-3 font-semibold hover:bg-white"
                    >
                      Import KML
                    </Link>
                  </div>
                </div>
              </div>
            ))}

            {(projects ?? []).length === 0 && (
              <div className="rounded-3xl border border-dashed border-white/20 p-10 text-center text-slate-300">
                <div className="text-xl font-bold">No projects yet</div>
                <p className="mt-2">Create your first field mapping project.</p>

                <Link
                  href="/projects/new"
                  className="mt-5 inline-flex rounded-xl bg-white px-5 py-3 font-semibold text-slate-950"
                >
                  + Add Project
                </Link>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}