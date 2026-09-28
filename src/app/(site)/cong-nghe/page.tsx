import { PageShell } from "@/components/site/PageShell";
import { getPageContent } from "@/lib/content";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata("cong-nghe");
export const revalidate = 60;

export default async function Page() {
  const page = await getPageContent("cong-nghe");
  return <PageShell page={page} />;
}
