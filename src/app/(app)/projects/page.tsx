import { createClient } from "@/lib/supabase/server";
import { ProjectsClient } from "./ProjectsClient";

export default async function ProjectsPage() {
  const supabase = await createClient();
  const { data: projects } = await supabase
    .from("projects")
    .select(
      "id, name, client, location, start_date, end_date, status, description, is_24hr, project_units(id, category, quantity), project_load_items(id, item_name, quantity, packed)"
    )
    .order("start_date");

  return <ProjectsClient initialProjects={projects ?? []} />;
}
