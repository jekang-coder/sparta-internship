import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "스파르타 면접 트래커",
  description: "일경험 사업 참여 청년과 기업의 면접 일정 조율 서비스",
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
