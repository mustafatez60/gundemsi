"use client";

import { useEffect, useState } from "react";
import ShareCard from "./ShareCard";

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  category: string;
  categoryColor: string;
  coverImage?: string | null;
  url: string;
}

export default function ShareModal({
  open,
  onClose,
  title,
  description,
  category,
  categoryColor,
  coverImage,
  url,
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  /**
   * ShareCard'ı PNG olarak oluşturur.
   * Bu fonksiyon yalnızca gerçekten görsele ihtiyaç duyan
   * işlemler tarafından çağrılır.
   */
  const createShareImage = async () => {
    const { toPng } = await import("html-to-image");

    const element = document.getElementById("gundemsi-share-card");

    if (!element) {
      throw new Error("Paylaşım görseli bulunamadı.");
    }

    return toPng(element, {
      width: 1080,
      height: 1080,
      pixelRatio: 1,
      cacheBust: true,
      backgroundColor: "#ffffff",
    });
  };

  /**
   * Yalnızca görsel indirir.
   * Başka hiçbir paylaşım işlemi çalışmaz.
   */
  const downloadImage = async () => {
    if (sharing) return;

    setSharing(true);

    try {
      const dataUrl = await createShareImage();

      const link = document.createElement("a");
      link.download = "gundemsi-haber.png";
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Görsel oluşturulamadı:", error);
      alert("Görsel oluşturulurken bir hata oluştu.");
    } finally {
      setSharing(false);
    }
  };

  /**
   * WhatsApp:
   * Görsel oluşturmaz, indirme yapmaz.
   * Yalnızca haber bağlantısını paylaşır.
   */
  const shareWhatsApp = () => {
    const text = `${title}\n\n${url}`;

    const shareUrl =
      "https://wa.me/?text=" + encodeURIComponent(text);

    window.open(shareUrl, "_blank", "noopener,noreferrer");
  };

  /**
   * X:
   * Görsel oluşturmaz, indirme yapmaz.
   */
  const shareX = () => {
    const shareUrl =
      "https://twitter.com/intent/tweet?text=" +
      encodeURIComponent(title) +
      "&url=" +
      encodeURIComponent(url);

    window.open(shareUrl, "_blank", "noopener,noreferrer");
  };

  /**
   * Facebook:
   * Kesinlikle ShareCard oluşturmaz.
   * Kesinlikle PNG indirmez.
   */
  const shareFacebook = () => {
    const shareUrl =
      "https://www.facebook.com/sharer/sharer.php?u=" +
      encodeURIComponent(url);

    window.open(shareUrl, "_blank", "noopener,noreferrer");
  };

  /**
   * Instagram:
   *
   * Instagram'ın web tarafında bir web sitesinin yerel PNG
   * dosyasını doğrudan Instagram gönderisine yüklemesini
   * garanti eden bir API yok.
   *
   * Destekleyen mobil tarayıcılarda Web Share API üzerinden
   * görseli sistem paylaşım ekranına veririz.
   *
   * Desteklenmiyorsa otomatik indirme yapmayız.
   */
  const shareInstagram = async () => {
    if (sharing) return;

    setSharing(true);

    try {
      const dataUrl = await createShareImage();

      const response = await fetch(dataUrl);
      const blob = await response.blob();

      const file = new File(
        [blob],
        "gundemsi-haber.png",
        {
          type: "image/png",
        }
      );

      if (
        typeof navigator.share === "function" &&
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          title,
          text: title,
          files: [file],
        });

        return;
      }

      alert(
        "Bu cihaz veya tarayıcı Instagram için görsel paylaşımını desteklemiyor. Görseli indirerek Instagram'dan paylaşabilirsin."
      );
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      console.error("Instagram paylaşımı oluşturulamadı:", error);

      alert(
        "Instagram paylaşımı başlatılamadı. Görseli indirerek Instagram'dan paylaşabilirsin."
      );
    } finally {
      setSharing(false);
    }
  };

  /**
   * Link kopyalama.
   */
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Link kopyalanamadı:", error);

      try {
        const textarea = document.createElement("textarea");
        textarea.value = url;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";

        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();

        document.execCommand("copy");
        textarea.remove();

        setCopied(true);

        window.setTimeout(() => {
          setCopied(false);
        }, 2000);
      } catch {
        alert("Link kopyalanamadı.");
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Haberi paylaş"
      onClick={onClose}
    >
      <div
        className="relative my-auto w-full max-w-2xl overflow-hidden rounded-[1.75rem] border shadow-2xl"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className="flex items-center justify-between border-b px-5 py-4 sm:px-6"
          style={{ borderColor: "var(--border)" }}
        >
          <div>
            <p
              className="text-[10px] font-black uppercase tracking-[0.2em]"
              style={{ color: categoryColor }}
            >
              Gündemsi
            </p>

            <h2 className="mt-1 text-xl font-black tracking-tight">
              Haberi paylaş
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl border text-lg font-bold transition hover:opacity-70"
            style={{ borderColor: "var(--border)" }}
            aria-label="Kapat"
          >
            ×
          </button>
        </div>

        <div className="max-h-[calc(100vh-150px)] overflow-y-auto p-4 sm:p-6">
          <div className="flex justify-center">
            <ShareCard
              title={title}
              description={description}
              category={category}
              categoryColor={categoryColor}
              coverImage={coverImage}
              url={url}
            />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-5">
            <button
              type="button"
              onClick={downloadImage}
              disabled={sharing}
              className="rounded-xl border px-3 py-3 text-xs font-black transition hover:opacity-70 disabled:cursor-wait disabled:opacity-50"
              style={{ borderColor: "var(--border)" }}
            >
              {sharing ? "Hazırlanıyor..." : "Görseli indir"}
            </button>

            <button
              type="button"
              onClick={shareWhatsApp}
              disabled={sharing}
              className="rounded-xl border px-3 py-3 text-xs font-black transition hover:opacity-70 disabled:opacity-50"
              style={{ borderColor: "var(--border)" }}
            >
              WhatsApp
            </button>

            <button
              type="button"
              onClick={shareX}
              disabled={sharing}
              className="rounded-xl border px-3 py-3 text-xs font-black transition hover:opacity-70 disabled:opacity-50"
              style={{ borderColor: "var(--border)" }}
            >
              X
            </button>

            <button
              type="button"
              onClick={shareInstagram}
              disabled={sharing}
              className="rounded-xl border px-3 py-3 text-xs font-black transition hover:opacity-70 disabled:opacity-50"
              style={{ borderColor: "var(--border)" }}
            >
              Instagram
            </button>

            <button
              type="button"
              onClick={shareFacebook}
              disabled={sharing}
              className="rounded-xl border px-3 py-3 text-xs font-black transition hover:opacity-70 disabled:opacity-50"
              style={{ borderColor: "var(--border)" }}
            >
              Facebook
            </button>

            <button
              type="button"
              onClick={copyLink}
              disabled={sharing}
              className="col-span-2 rounded-xl border px-3 py-3 text-xs font-black transition hover:opacity-70 disabled:opacity-50 sm:col-span-1"
              style={{ borderColor: "var(--border)" }}
            >
              {copied ? "Kopyalandı ✓" : "Linki kopyala"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}