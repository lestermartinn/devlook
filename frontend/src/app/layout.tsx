// devlook/frontend/src/app/layout.tsx
import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "DevLook",
  description: "Privacy-first productivity analytics for developers",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#0b0f17] text-white antialiased`}>
        {children}
      </body>
    </html>
  );
}

