import type { Metadata, Viewport } from "next";
import { Cinzel, Figtree } from "next/font/google";
import { Shell } from "@/components/Shell";
import { brand } from "@/lib/brand";
import { CommerceProvider } from "@/lib/commerce";
import { ProductProvider } from "@/lib/product";
import { FeconProvider } from "@/lib/store";
import "./globals.css";

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
});

export const metadata: Metadata = {
  title: brand.name,
  description: brand.tagline,
  applicationName: brand.name,
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: brand.name,
    statusBarStyle: "black-translucent",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${figtree.variable} ${cinzel.variable} antialiased`}>
        <FeconProvider>
          <ProductProvider>
            <CommerceProvider>
              <Shell>{children}</Shell>
            </CommerceProvider>
          </ProductProvider>
        </FeconProvider>
      </body>
    </html>
  );
}
