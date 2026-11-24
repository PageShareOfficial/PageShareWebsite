'use client';

import RightRail from './RightRail';

/** Shared right sidebar (network stats + optional upgrade card). */
export default function RightSidebar() {
  return (
    <div className="hidden lg:block w-[350px] shrink-0 pl-4">
      <RightRail />
    </div>
  );
}