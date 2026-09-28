import { PageShell } from "@/components/site/PageShell";
import { getPageContent } from "@/lib/content";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata("giai-phap");
export const revalidate = 60;

export default async function Page() {
  const page = await getPageContent("giai-phap");
  return <PageShell page={page} />;
}
