"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/lib/nav";

export function Sidebar({
  items,
  userLabel,
  userInitials,
  actingOwner,
}: {
  items: NavItem[];
  userLabel: string;
  userInitials: string;
  actingOwner: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const withSeparators = items.map((item, i) => ({
    item,
    showSep: i === 0 || item.group !== items[i - 1].group,
  }));

  const navContent = (
    <>
      <div className="flex items-center gap-2 px-2 pb-4 mb-2 border-b border-line">
        <div className="btn-chrome font-extrabold text-xs px-2 py-1 rounded">J-G</div>
        <span className="font-bold text-navy text-sm">Dispatch</span>
        <button
          onClick={() => setOpen(false)}
          className="ml-auto md:hidden text-muted text-lg leading-none px-1"
          aria-label="Close menu"
        >
          ✕
        </button>
      </div>

      {actingOwner && (
        <div className="text-[11px] bg-blue/15 text-blue border border-blue/30 rounded-md px-2 py-1.5 mb-3 text-center font-semibold">
          🔑 Acting-owner access
        </div>
      )}

      <nav className="flex-1 overflow-y-auto">
        {withSeparators.map(({ item, showSep }) => {
          const active = pathname === item.href;
          return (
            <div key={item.id}>
              {showSep && (
                <div className="text-[10.5px] uppercase tracking-wide text-muted font-bold px-3 pt-3.5 pb-1.5">
                  {item.group}
                </div>
              )}
              <Link
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg mb-0.5 text-sm font-semibold ${
                  active ? "btn-chrome" : "text-ink hover:bg-card-2"
                }`}
              >
                <span className="w-5 text-center">{item.icon}</span>
                {item.label}
              </Link>
            </div>
          );
        })}
      </nav>

      <div className="flex items-center gap-2 px-2 pt-3 border-t border-line mt-2">
        <div className="w-7 h-7 rounded-full bg-card-2 border border-line flex items-center justify-center text-xs font-bold text-navy">
          {userInitials}
        </div>
        <span className="text-xs font-semibold text-ink truncate">{userLabel}</span>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-30 bg-card border-b border-line px-4 py-3 flex items-center gap-3">
        <button onClick={() => setOpen(true)} aria-label="Open menu" className="text-ink text-xl leading-none">
          ☰
        </button>
        <div className="btn-chrome font-extrabold text-xs px-2 py-1 rounded">J-G</div>
        <span className="font-bold text-navy text-sm">Dispatch</span>
        <div className="ml-auto w-7 h-7 rounded-full bg-card-2 border border-line flex items-center justify-center text-xs font-bold text-navy">
          {userInitials}
        </div>
      </div>

      {/* Overlay behind the mobile drawer */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar / drawer */}
      <aside
        className={`fixed md:static top-0 left-0 h-full z-50 md:z-auto w-[240px] md:w-[210px] shrink-0 bg-card border-r border-line p-3 flex flex-col transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        {navContent}
      </aside>
    </>
  );
}
