import { PageShell } from "@/components/site/PageShell";
import { getPageContent } from "@/lib/content";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata("trai-nghiem");
export const revalidate = 60;

export default async function Page() {
  const page = await getPageContent("trai-nghiem");
  return <PageShell page={page} />;
}
