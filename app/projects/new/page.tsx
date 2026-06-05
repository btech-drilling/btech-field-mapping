import { supabase } from "@/lib/supabase";
import { redirect } from "next/navigation";

async function createProject(formData: FormData) {
  "use server";

  const project_code = String(formData.get("project_code") ?? "");
  const project_name = String(formData.get("project_name") ?? "");
  const description = String(formData.get("description") ?? "");

  await supabase.from("projects").insert({
    project_code,
    project_name,
    description,
    status: "ACTIVE",
  });

  redirect("/projects");
}

export default function NewProjectPage() {
  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-2xl font-bold mb-6">Add Project</h1>

      <form action={createProject} className="grid gap-4">
        <input
          name="project_code"
          placeholder="Project Code เช่น DMR-2569"
          className="border rounded p-3"
          required
        />

        <input
          name="project_name"
          placeholder="Project Name"
          className="border rounded p-3"
          required
        />

        <textarea
          name="description"
          placeholder="Description"
          className="border rounded p-3"
          rows={4}
        />

        <button className="rounded bg-black px-4 py-3 text-white">
          Save Project
        </button>
      </form>
    </div>
  );
}