import { ImageResponse } from "next/og";
import { getAllPostsMeta, getPostBySlug } from "@/lib/mdx";

type BlogPostOpenGraphImageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

function formatDate(isoDate: string) {
  return new Date(isoDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export async function generateStaticParams() {
  const posts = await getAllPostsMeta();
  return posts.map((post) => ({ slug: post.slug }));
}

export const dynamicParams = false;

export default async function BlogPostOpenGraphImage({ params }: BlogPostOpenGraphImageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  const title = post?.title ?? "TruCore Blog";
  const date = post?.date ? formatDate(post.date) : "";
  const tags = post?.tags.slice(0, 4) ?? [];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px",
          background: "linear-gradient(160deg, rgba(10,24,42,1) 0%, rgba(5,12,22,1) 70%)",
          color: "#eef8ff",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 26, fontWeight: 600, color: "#b8e3ff" }}>TruCore Blog</div>
          <div style={{ fontSize: 22, color: "#f08a1f", fontWeight: 500 }}>{date}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: 1020 }}>
          <div style={{ fontSize: 62, fontWeight: 700, lineHeight: 1.08, color: "#ffe0b2" }}>
            {title}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
            {tags.map((tag) => (
              <span
                key={tag}
                style={{
                  border: "1px solid rgba(167, 218, 255, 0.45)",
                  borderRadius: "9999px",
                  padding: "8px 14px",
                  fontSize: 22,
                  fontWeight: 600,
                  color: "#d8efff",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: "#f08a1f",
            fontSize: 24,
            fontWeight: 500,
          }}
        >
          <span>Infrastructure for Autonomous Finance</span>
          <span>trucore.xyz/blog</span>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}