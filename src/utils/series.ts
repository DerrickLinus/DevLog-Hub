import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';

export type SeriesEntry = CollectionEntry<'series'>;
export type PostEntry = CollectionEntry<'posts'>;

export interface SeriesInfo {
  /** 系列元数据条目 */
  entry: SeriesEntry;
  /** 该系列全部文章，按 seriesOrder 升序（无序号的排最后，按日期） */
  posts: PostEntry[];
  /** 最新一篇（用于“最近更新”展示） */
  latestPost: PostEntry | undefined;
}

/** 获取全部系列及其文章映射，按 series.order 升序 */
export async function getAllSeries(): Promise<SeriesInfo[]> {
  const seriesEntries = (await getCollection('series')).sort(
    (a, b) => a.data.order - b.data.order,
  );
  const posts = await getCollection('posts', ({ data }) => !data.draft);

  return seriesEntries.map((entry) => {
    const postsOfSeries = posts
      .filter((p) => p.data.series === entry.id.replace(/\.(json|ya?ml)$/, ''))
      .sort(
        (a, b) =>
          (a.data.seriesOrder ?? Infinity) - (b.data.seriesOrder ?? Infinity) ||
          a.data.date.valueOf() - b.data.date.valueOf(),
      );
    const latestPost = postsOfSeries.length
      ? postsOfSeries.reduce((m, p) => (p.data.date > m.data.date ? p : m))
      : undefined;

    return { entry, posts: postsOfSeries, latestPost };
  });
}

/** 系列页 URL 的标识（去掉数据文件扩展名） */
export function seriesSlug(entry: SeriesEntry): string {
  return entry.id.replace(/\.(json|ya?ml)$/, '');
}
