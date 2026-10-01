"use client";

import { FormEvent, useEffect, useState } from "react";

type Comment = {
  id: string;
  name: string;
  content: string;
  createdAt: string;
};

type CommentsSectionProps = {
  slug: string;
};

export default function CommentsSection({
  slug,
}: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadComments() {
    try {
      setLoading(true);

      const response = await fetch(
        `/api/haber/${encodeURIComponent(slug)}/comments`,
        { cache: "no-store" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Yorumlar alınamadı.");
      }

      setComments(data.comments ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Yorumlar alınırken bir hata oluştu."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadComments();
  }, [slug]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const trimmedName = name.trim();
    const trimmedContent = content.trim();

    if (!trimmedName) {
      setError("İsim veya kullanıcı adı gerekli.");
      return;
    }

    if (!trimmedContent) {
      setError("Yorum boş bırakılamaz.");
      return;
    }

    try {
      setSending(true);

      const response = await fetch(
        `/api/haber/${encodeURIComponent(slug)}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: trimmedName,
            content: trimmedContent,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Yorum gönderilemedi.");
      }

      setComments((current) => [data.comment, ...current]);
      setName("");
      setContent("");
      setSuccess("Yorumun başarıyla gönderildi.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Yorum gönderilirken bir hata oluştu."
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="mt-12 border-t pt-8">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-600">
          Okur yorumları
        </p>

        <h2 className="mt-1 text-2xl font-black tracking-tight">
          Yorumlar
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={40}
          placeholder="İsim veya kullanıcı adı"
          className="w-full rounded-xl border bg-transparent px-4 py-3 text-sm outline-none transition focus:border-violet-500"
        />

        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          maxLength={1000}
          rows={5}
          placeholder="Yorumunu yaz..."
          className="w-full resize-none rounded-xl border bg-transparent px-4 py-3 text-sm outline-none transition focus:border-violet-500"
        />

        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            {error}
          </p>
        )}

        {success && (
          <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-600">
            {success}
          </p>
        )}

        <button
          type="submit"
          disabled={sending}
          className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-black text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {sending ? "Gönderiliyor..." : "Yorum Yap"}
        </button>
      </form>

      <div className="mt-8 space-y-4">
        {loading ? (
          <p className="text-sm text-gray-500">
            Yorumlar yükleniyor...
          </p>
        ) : comments.length === 0 ? (
          <div className="rounded-2xl border p-6 text-center">
            <p className="text-sm font-semibold text-gray-500">
              Henüz yorum yapılmamış.
            </p>
            <p className="mt-1 text-xs text-gray-400">
              İlk yorumu sen yap.
            </p>
          </div>
        ) : (
          comments.map((comment) => (
            <article
              key={comment.id}
              className="rounded-2xl border p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <strong className="text-sm font-black">
                  {comment.name}
                </strong>

                <time
                  dateTime={comment.createdAt}
                  className="text-xs text-gray-500"
                >
                  {new Date(comment.createdAt).toLocaleDateString(
                    "tr-TR"
                  )}
                </time>
              </div>

              <p className="mt-3 whitespace-pre-line text-sm leading-7">
                {comment.content}
              </p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}