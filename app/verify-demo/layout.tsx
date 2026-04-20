import type { Metadata } from "next";
import type { ReactNode } from "react";

const VERIFY_DEMO_SOCIAL_IMAGE_URL = "https://trucore.xyz/twitter-image";

export const metadata: Metadata = {
  title: "Verify Demo",
  description:
    "Live protected trade receipt demo for TruCore ATF with deterministic verification proof.",
  openGraph: {
    title: "Verify Demo - TruCore ATF",
    description:
      "Live protected trade receipt demo for TruCore ATF with deterministic verification proof.",
    url: "https://trucore.xyz/verify-demo",
    siteName: "TruCore",
    type: "website",
    images: [
      {
        url: VERIFY_DEMO_SOCIAL_IMAGE_URL,
        width: 1200,
        height: 630,
        alt: "TruCore verify demo social preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Verify Demo - TruCore ATF",
    description:
      "Live protected trade receipt demo for TruCore ATF with deterministic verification proof.",
    images: [VERIFY_DEMO_SOCIAL_IMAGE_URL],
  },
};

export default function VerifyDemoLayout({ children }: { children: ReactNode }) {
  return children;
}
