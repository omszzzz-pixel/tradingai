"use client";

import Chat from "./Chat";
import PriceChips from "./PriceChips";

export default function HomeView() {
  return (
    <>
      {/* Desktop: single column, max-width centered */}
      <div className="hidden lg:flex lg:flex-col lg:h-full max-w-[1400px] mx-auto w-full overflow-hidden">
        <PriceChips />
        <div className="flex-1 flex justify-center min-h-0 px-4 pb-4 pt-3">
          <div className="w-full max-w-[860px] flex">
            <Chat fixedMode="agent" />
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
