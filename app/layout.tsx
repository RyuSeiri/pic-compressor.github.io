import type { Metadata } from "next";
import "@/styles/globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const metadata: Metadata = {
  metadataBase: new URL(`https://pic-compressor.github.io${basePath}`),
  title: {
    default: "Pic Compressor — Free Online Image Tools",
    template: "%s | Pic Compressor",
  },
  description: "Compress and convert JPG, PNG, WebP and GIF images directly in your browser. Free, private and easy to use.",
  keywords: ["image compressor","compress images","JPG compressor","PNG compressor","WebP compressor","image tools"],
  icons: {
    icon: `${basePath}/favicon.svg`,
    apple: `${basePath}/favicon.svg`,
  },
  openGraph: {
    title: "Pic Compressor — Free Online Image Tools",
    description: "Fast browser-based image compression and conversion tools.",
    type: "website",
  },
  verification: {
    google: "nScZP2sBUKhxwKfvtKwCxQkPMCIOOvYNT35E5W2pDn8",
  },
};

export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en"><body><div className="min-h-screen"><Header/><div>{children}</div><Footer/></div></body></html>;
}
