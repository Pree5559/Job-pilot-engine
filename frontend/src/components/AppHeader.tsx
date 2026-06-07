"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function AppHeader() {
  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" prefetch={false} className="text-xl font-bold tracking-tight text-primary">
          JobFlow AI
        </Link>
        <nav className="flex items-center gap-1">
          <Link href="/" prefetch={false}>
            <Button variant="ghost" size="sm" className="font-semibold">
              Jobs Board
            </Button>
          </Link>
          <Link href="/studio" prefetch={false}>
            <Button variant="ghost" size="sm" className="font-semibold">
              Resume Studio
            </Button>
          </Link>
          <Link href="/outreach" prefetch={false}>
            <Button variant="ghost" size="sm" className="font-semibold">
              Outreach Desk
            </Button>
          </Link>
          <Link href="/analytics" prefetch={false}>
            <Button variant="ghost" size="sm" className="font-semibold">
              Analytics
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}