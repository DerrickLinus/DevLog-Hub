// 阅读时长估算：中文按 300 字/分钟，英文按 180 词/分钟，最少 1 分钟。
// 输入为 Markdown 源文本（post.body），先剔除不参与阅读的语法元素。
export function readingTime(raw: string): number {
  const text = raw
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // 图片
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // 链接只保留文字
    .replace(/\$\$[\s\S]*?\$\$/g, ' ') // 块级公式
    .replace(/\$[^$\n]+\$/g, ' ') // 行内公式
    .replace(/[#>*_~]+/g, ' '); // markdown 符号

  const cjk = (text.match(/[一-鿿㐀-䶿]/g) ?? []).length;
  const latinWords = (
    text.replace(/[一-鿿㐀-䶿]/g, ' ').match(/[A-Za-z0-9]+/g) ?? []
  ).length;

  return Math.max(1, Math.round(cjk / 300 + latinWords / 180));
}
