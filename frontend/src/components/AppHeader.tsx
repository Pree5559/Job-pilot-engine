"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function AppHeader() {
  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-xl font-bold tracking-tight text-primary">
          JobFlow AI
        </Link>
        <nav className="flex items-center gap-1">
          <Link href="/jobs">
            <Button variant="ghost" size="sm" className="font-semibold">
              Jobs Board
            </Button>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm" className="font-semibold">
              Resume Studio
            </Button>
          </Link>
          <Link href="/outreach">
            <Button variant="ghost" size="sm" className="font-semibold">
              Outreach Desk
            </Button>
          </Link>
          <Link href="/analytics">
            <Button variant="ghost" size="sm" className="font-semibold">
              Analytics
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}