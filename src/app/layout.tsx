import "~/styles/globals.css";

import { type Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";

import { AppProviders } from "~/components/providers/app-providers";
import { getServiceFlags } from "~/lib/service-flags";

export const metadata: Metadata = {
  title: "stayfocused.site | Your website retreat",
  description:
    "A calm productivity retreat with living scenery, ambient focus sound, and a minimalist dashboard that helps you stay with the work.",
  icons: [{ rel: "icon", url: "/focus-dashboard.ico" }],
  openGraph: {
    title: "stayfocused.site | Your website retreat",
    description:
      "A calm productivity retreat with living scenery, ambient focus sound, and a minimalist dashboard that helps you stay with the work.",
    images: [
      "https://og-image-wheat.vercel.app/api/og?title=Stay+Focused&description=Take+back+your+focus+and+stay+lock+in&logoUrl=https%3A%2F%2Fraw.githubusercontent.com%2FZofserif%2Ffocus-dashboard%2Frefs%2Fheads%2Fmain%2Fpublic%2Fstay-focused-icon.png",
    ],
  },
};

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const services = getServiceFlags();

  return (
    <html
      lang="en"
      className={`${manrope.variable} ${cormorant.variable}`}
      suppressHydrationWarning
    >
      <body className="bg-background text-foreground min-h-screen font-sans antialiased">
        <AppProviders
          services={services}
          convexUrl={process.env.NEXT_PUBLIC_CONVEX_URL}
        >
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
