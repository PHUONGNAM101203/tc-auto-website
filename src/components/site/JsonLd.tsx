/**
 * Nhung mot mau JSON-LD vao trang.
 *
 * `dangerouslySetInnerHTML` la cach DUY NHAT dat JSON vao the <script> trong
 * React — dat qua children thi React escape dau ngoac nhon va may tim kiem doc
 * khong ra. Du lieu o day do CHINH TA sinh tu `structured-data.ts`, khong co
 * gi tu nguoi dung, nen khong co duong chen ma.
 *
 * Van thay `</script>` cho chac: neu sau nay co truong nao lay tu CSDL (vi du
 * tieu de bai viet do admin go) thi mot chuoi nhu vay se dong the sac lai.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | null }) {
  if (!data) {
    return null;
  }
  const json = JSON.stringify(data).replace(/<\/script/gi, "<\\/script");
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger -- xem chu thich tren
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
