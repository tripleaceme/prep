"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Code2,
  FileText,
  History,
  Home,
  LogOut,
  Settings,
  Bot,
  Dumbbell,
} from "lucide-react";
import { PrepMark } from "@/components/PrepMark";
import { ApiKeyBadge } from "@/components/ApiKeyBadge";

interface NavChild {
  href: string;
  label: string;
  tag?: string;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: NavChild[];
}

/**
 * Navigation deliberately differs from the reference: "Prepare & Apply" is
 * gone (we are not a job board), "Generate My CV" became "Revamp My CV"
 * because we improve an existing CV rather than invent one, and "Skill
 * Practice" became "Mock Interview" with data-domain tracks underneath.
 */
const NAV: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/cv", label: "Revamp My CV", icon: FileText },
  { href: "/interview", label: "AI Interview", icon: Bot },
  {
    href: "/mock",
    label: "Mock Interview",
    icon: Dumbbell,
    children: [
      { href: "/mock", label: "Practice Tracks" },
      { href: "/coding", label: "Coding Problems", tag: "FREE" },
    ],
  },
  { href: "/reports", label: "My Reports", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({
  displayName,
  avatar,
}: {
  displayName: string;
  avatar?: string | null;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(
    pathname.startsWith("/mock") || pathname.startsWith("/coding"),
  );

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <aside className="flex h-dvh w-[260px] shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface)]">
      <div className="border-b border-[var(--border)] px-5 py-5">
        <PrepMark href="/dashboard" />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <p className="px-2 pb-3 text-[11px] font-semibold tracking-[0.14em] text-[var(--text-faint)]">
          NAVIGATION
        </p>

        <ul className="space-y-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            if (item.children) {
              return (
                <li key={item.href}>
                  <button
                    type="button"
                    onClick={() => setOpen((o) => !o)}
                    aria-expanded={open}
                    className={[
                      "flex w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-[15px] font-medium transition-colors",
                      active
                        ? "bg-[var(--surface-2)] text-[var(--text)]"
                        : "text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]",
                    ].join(" ")}
                  >
                    <Icon className="size-[18px]" />
                    <span className="flex-1 text-left">{item.label}</span>
                    {open ? (
                      <ChevronDown className="size-4" />
                    ) : (
                      <ChevronRight className="size-4" />
                    )}
                  </button>

                  {open ? (
                    <ul className="mt-1 space-y-1 pl-4">
                      {item.children.map((child) => (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            className={[
                              "flex items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-sm transition-colors",
                              pathname === child.href
                                ? "border-l-2 border-[var(--brand-bright)] bg-[var(--surface-2)] text-[var(--brand-bright)]"
                                : "text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]",
                            ].join(" ")}
                          >
                            {child.href === "/coding" ? (
                              <Code2 className="size-4" />
                            ) : (
                              <Dumbbell className="size-4" />
                            )}
                            <span className="flex-1">{child.label}</span>
                            {child.tag ? (
                              <span className="rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-[var(--brand-bright)]">
                                {child.tag}
                              </span>
                            ) : null}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              );
            }

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={[
                    "flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-[15px] font-medium transition-colors",
                    active
                      ? "border-l-2 border-[var(--brand-bright)] bg-[var(--surface-2)] text-[var(--text)]"
                      : "text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]",
                  ].join(" ")}
                >
                  <Icon className="size-[18px]" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-[var(--border)] p-3">
        <div className="flex items-center gap-3 rounded-[var(--radius-sm)] px-2 py-2">
          <Link
            href="/settings"
            aria-label="Profile settings"
            className="size-9 shrink-0 overflow-hidden rounded-full"
          >
            {avatar ? (
              <Image
                src={avatar}
                alt=""
                width={72}
                height={72}
                unoptimized
                className="size-full object-cover"
              />
            ) : (
              <span className="grid size-full place-items-center rounded-full bg-[var(--brand)] text-sm font-bold text-white">
                {displayName.charAt(0).toUpperCase()}
              </span>
            )}
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{displayName}</p>
            <ApiKeyBadge />
          </div>
        </div>

        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="mt-1 flex w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-[15px] font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
          >
            <LogOut className="size-[18px]" />
            Logout
          </button>
        </form>
      </div>
    </aside>
  );
}
