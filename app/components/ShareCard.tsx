"use client";

interface ShareCardProps {
  title: string;
  description: string;
  category: string;
  categoryColor: string;
  coverImage?: string | null;
  url: string;
}

export default function ShareCard({
  title,
  description,
  category,
  categoryColor,
  coverImage,
  url,
}: ShareCardProps) {
  return (
    <div
      id="gundemsi-share-card"
      className="w-full max-w-[540px] overflow-hidden rounded-[28px] border shadow-2xl"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
        color: "var(--text)",
        aspectRatio: "1 / 1",
      }}
    >
      <div className="flex h-full flex-col">
        <div className="relative min-h-0 flex-1 overflow-hidden">
          {coverImage ? (
            <img
              src={coverImage}
              alt={title}
              className="h-full w-full object-cover"
              crossOrigin="anonymous"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center text-7xl font-black text-white"
              style={{
                background: `linear-gradient(135deg, ${categoryColor}, #2563eb)`,
              }}
            >
              G
            </div>
          )}

          <div className="absolute left-5 top-5">
            <span
              className="rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-white shadow-lg"
              style={{ background: categoryColor }}
            >
              {category}
            </span>
          </div>
        </div>

        <div className="shrink-0 p-6 sm:p-7">
          <div
            className="mb-3 h-1 w-12 rounded-full"
            style={{ background: categoryColor }}
          />

          <h2 className="line-clamp-3 text-2xl font-black leading-tight tracking-[-0.035em] sm:text-[28px]">
            {title}
          </h2>

          <p className="mt-3 line-clamp-2 text-sm leading-6 opacity-70 sm:text-base">
            {description}
          </p>

          <div
            className="mt-5 flex items-center justify-between border-t pt-4"
            style={{ borderColor: "var(--border)" }}
          >
            <span className="text-sm font-black tracking-[-0.02em]">
              GÜNDEMSİ
            </span>

            <span className="max-w-[55%] truncate text-right text-[11px] font-semibold opacity-60">
              {url.replace(/^https?:\/\//, "")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
