import { PageShell } from "@/components/site/PageShell";
import { getPageContent } from "@/lib/content";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata("home");
export const revalidate = 60;

export default async function Page() {
  const page = await getPageContent("home");
  return <PageShell page={page} />;
}
