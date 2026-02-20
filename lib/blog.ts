import { getAllPostsMeta, getPostBySlug } from "@/lib/mdx";

export type BlogPost = Awaited<ReturnType<typeof getPostBySlug>>;

export async function getPost(slug: string) {
  return getPostBySlug(slug);
}

export async function getAllPosts() {
  return getAllPostsMeta();
}
