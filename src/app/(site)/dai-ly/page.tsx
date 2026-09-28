import { PageShell } from "@/components/site/PageShell";
import { getPageContent } from "@/lib/content";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata("dai-ly");
export const revalidate = 60;

export default async function Page() {
  const page = await getPageContent("dai-ly");
  return <PageShell page={page} />;
}
