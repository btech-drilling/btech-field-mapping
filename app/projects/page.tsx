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
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Projects</h1>

        <Link
          href="/projects/new"
          className="rounded bg-black px-4 py-2 text-white"
        >
          + Add Project
        </Link>
      </div>

      <div className="grid gap-4">
        {(projects ?? []).map((p) => (
          <Link
            key={p.id}
            href={`/projects/${p.id}`}
            className="rounded-lg border p-4 hover:bg-gray-50"
          >
            <div className="font-bold">{p.project_code}</div>
            <div>{p.project_name}</div>
            <div className="text-sm text-gray-500">{p.status}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}