import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "스파르타 인터뷰 트래커",
  description: "일경험 사업 면접 일정을 한 곳에서. 청년은 기업을 선택하고, 기업은 일정을 등록하고, 매니저는 전체 현황을 확인합니다.",
  openGraph: {
    title: "스파르타 인터뷰 트래커",
    description: "일경험 사업 면접 일정을 한 곳에서. 청년은 기업을 선택하고, 기업은 일정을 등록하고, 매니저는 전체 현황을 확인합니다.",
    url: "https://sparta-internship-iota.vercel.app",
    siteName: "스파르타 인터뷰 트래커",
    locale: "ko_KR",
    type: "website",
    images: [
      {
        url: "https://sparta-internship-iota.vercel.app/og-image",
        width: 1200,
        height: 630,
        alt: "스파르타 인터뷰 트래커 — 면접 일정을 한 곳에서",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "스파르타 인터뷰 트래커",
    description: "일경험 사업 면접 일정을 한 곳에서.",
    images: ["https://sparta-internship-iota.vercel.app/og-image"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
