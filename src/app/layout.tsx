import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

export const metadata: Metadata = {
  title: "Stay Focused",
  description: "Take back your focus and stay lock in",
  icons: [{ rel: "icon", url: "/focus-dashboard.ico" }],
  openGraph: {
    images: [
      "https://og-image-wheat.vercel.app/api/og?title=Stay+Focused&description=Take+back+your+focus+and+stay+lock+in&logoUrl=https%3A%2F%2Fraw.githubusercontent.com%2FZofserif%2Ffocus-dashboard%2Frefs%2Fheads%2Fmain%2Fpublic%2Fstay-focused-icon.png",
    ],
  },
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`}>
      <body>{children}</body>
    </html>
  );
}
