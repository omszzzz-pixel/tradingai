import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import MobileNav from "@/components/MobileNav";

export const metadata: Metadata = {
  title: "tradingai — AI 매매 관찰",
  description:
    "8개의 AI 에이전트가 BTC/USDT를 페이퍼 트레이딩하는 모습을 실시간 관찰하세요. 투자 추천 아님.",
};

const themeBootstrap = `(function(){try{var t=localStorage.getItem('theme_v2')||'light';if(t==='dark'){document.documentElement.classList.add('dark');}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <head>
        <link
          rel="preconnect"
          href="https://cdn.jsdelivr.net"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          as="style"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
        />
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body className="min-h-full flex flex-col lg:h-screen lg:overflow-hidden">
        <Header />
        <main className="flex-1 lg:min-h-0 lg:overflow-hidden">{children}</main>
        <MobileNav />
      </body>
    </html>
  );
}
