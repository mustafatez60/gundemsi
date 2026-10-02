"use client";

import { useState } from "react";
import ShareModal from "./ShareModal";

interface ShareButtonProps {
  title: string;
  description: string;
  category: string;
  categoryColor: string;
  coverImage?: string | null;
  slug: string;
}

export default function ShareButton({
  title,
  description,
  category,
  categoryColor,
  coverImage,
  slug,
}: ShareButtonProps) {
  const [open, setOpen] = useState(false);

  const url =
    typeof window !== "undefined"
      ? window.location.href
      : `/haber/${slug}`;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-black transition hover:opacity-70"
        style={{
          borderColor: "var(--border)",
          background: "var(--surface)",
        }}
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <path d="m8.6 13.5 6.8 4" />
          <path d="m15.4 6.5-6.8 4" />
        </svg>

        Paylaş
      </button>

      <ShareModal
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        description={description}
        category={category}
        categoryColor={categoryColor}
        coverImage={coverImage}
        url={url}
      />
    </>
  );
}