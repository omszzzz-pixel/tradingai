"use client";

import Chat from "./Chat";
import PriceChips from "./PriceChips";

export default function HomeView() {
  return (
    <>
      {/* Desktop: 70/30 split — AI 토론 / 사용자 채팅 */}
      <div className="hidden lg:flex lg:flex-col lg:h-full w-full overflow-hidden">
        <PriceChips />
        <div className="flex-1 min-h-0 w-full max-w-[1400px] mx-auto px-4 pb-4 pt-3 flex gap-3">
          <div className="flex-[7] min-w-0 flex">
            <Chat fixedMode="agent" />
          </div>
          <div className="flex-[3] min-w-0 flex">
            <Chat fixedMode="general" title="사용자 채팅" />
          </div>
        </div>
      </div>

      {/* Mobile: single column */}
      <div className="lg:hidden">
        <PriceChips />
        <div className="fixed inset-x-0 top-[88px] bottom-[50px] flex">
          <div className="flex-1 min-h-0 flex">
            <Chat fixedMode="agent" />
          </div>
        </div>
      </div>
    </>
  );
}
