"use client";

import Image from "next/image";

function formatToday() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export default function Header() {
  return (
    <header className="space-y-1 px-0.5 pt-1">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Today
          </p>
          <h1 className="mt-0.5 text-3xl font-extrabold tracking-tight text-foreground">Sumiran</h1>
          <p className="mt-1 text-sm font-medium text-muted-foreground">{formatToday()}</p>
        </div>
        <div className="relative size-14 shrink-0 overflow-hidden rounded-full border-2 border-foreground/10 bg-card shadow-md ring-2 ring-background">
          <Image
            src="/logo/icon-192.png"
            alt="Profile"
            width={56}
            height={56}
            className="object-cover"
            priority
          />
        </div>
      </div>
    </header>
  );
}
