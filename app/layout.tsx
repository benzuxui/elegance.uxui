import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sprintline — สร้าง Timeline แบบ 2 สัปดาห์",
  description: "วางแผนโปรเจกต์เป็น Sprint ละ 2 สัปดาห์ เพิ่มงาน และติดตามความคืบหน้าได้ในหน้าเดียว",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
