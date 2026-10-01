import { describe, expect, it } from "vitest";
import { buildTree, countNodes, type TreeNode } from "@/lib/mobile-tree";

function find(nodes: readonly TreeNode[], href: string): TreeNode | undefined {
  for (const node of nodes) {
    if (node.href === href) {
      return node;
    }
    const hit = find(node.children, href);
    if (hit) {
      return hit;
    }
  }
  return undefined;
}

describe("cây mục lục cho điện thoại", () => {
  it("mục Công nghệ có hai trang con và chúng tự mang trang con của mình", () => {
    const tree = buildTree("cong-nghe");
    expect(tree.map((node) => node.href)).toEqual([
      "/cong-nghe/tien-phong-cong-nghe",
      "/cong-nghe/ung-dung",
    ]);
    expect(find(tree, "/cong-nghe/ung-dung")?.children).toHaveLength(2);
  });

  it("đi được tới cấp thứ ba — chính chỗ danh sách phẳng cũ giấu mất", () => {
    const tree = buildTree("nhan-su");
    const sau = find(tree, "/nhan-su/tuyen-dung/vi-tri-dang-tuyen");
    expect(sau?.children).toHaveLength(1);
  });

  it("độ sâu truyền vào cắt đúng chỗ", () => {
    expect(buildTree("cong-nghe", 1).every((node) => node.children.length === 0)).toBe(true);
    expect(buildTree("cong-nghe", 0)).toHaveLength(0);
  });

  it("mỗi nhánh đều có nhãn và đường dẫn tuyệt đối", () => {
    for (const slug of ["trai-nghiem", "giai-phap", "cong-nghe", "dai-ly", "nhan-su"]) {
      const tree = buildTree(slug);
      expect(tree.length).toBeGreaterThan(0);
      const flat: TreeNode[] = [];
      const walk = (nodes: readonly TreeNode[]) => {
        for (const node of nodes) {
          flat.push(node);
          walk(node.children);
        }
      };
      walk(tree);
      expect(flat).toHaveLength(countNodes(tree));
      for (const node of flat) {
        expect(node.href.startsWith("/")).toBe(true);
        expect(node.label.length).toBeGreaterThan(0);
      }
    }
  });

  it("không trang nào xuất hiện hai lần trong cùng một cây", () => {
    const tree = buildTree("");
    const seen: string[] = [];
    const walk = (nodes: readonly TreeNode[]) => {
      for (const node of nodes) {
        seen.push(node.href);
        walk(node.children);
      }
    };
    walk(tree);
    expect(new Set(seen).size).toBe(seen.length);
  });
});
