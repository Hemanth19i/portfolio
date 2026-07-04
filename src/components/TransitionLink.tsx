"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentProps, MouseEvent } from "react";

/**
 * Infrastructure for future /projects/[slug] routes (Phase 2.6 §3). Wraps
 * next/link and, where the View Transitions API is supported, runs the
 * client navigation inside document.startViewTransition. Feature-detected
 * with zero polyfill weight — unsupported browsers navigate normally.
 */
type Props = ComponentProps<typeof Link>;

type DocumentWithVT = Document & {
  startViewTransition?: (cb: () => void) => unknown;
};

export function TransitionLink({ href, onClick, ...rest }: Props) {
  const router = useRouter();

  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    const doc = document as DocumentWithVT;
    // only intercept plain left-clicks to same-origin internal hrefs
    if (
      e.defaultPrevented ||
      e.button !== 0 ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey ||
      typeof href !== "string" ||
      !href.startsWith("/") ||
      !doc.startViewTransition
    ) {
      return;
    }
    e.preventDefault();
    doc.startViewTransition(() => router.push(href));
  };

  return <Link href={href} onClick={handle} {...rest} />;
}
