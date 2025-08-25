import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import HeartLoader from "./heartloader";
import toast from "react-hot-toast";

const UPLOAD_ENDPOINT = import.meta.env.VITE_WEB_APP_URL as string; // e.g. https://...run.app/upload

type Item = {
  id: string;
  file: File;
  url: string; // Object URL for stable preview
};

function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Smart fetch with JSON parsing & retries
 */
async function fetchJSON(input: RequestInfo | URL, init: RequestInit & { retries?: number } = {}) {
  const { retries = 2, ...opts } = init;
  let lastErr: any;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(input, opts);
      const text = await res.text();
      let data: any;
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(`Invalid JSON response (${res.status})`);
      }
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      return data;
    } catch (err: any) {
      lastErr = err;
      if (attempt < retries) {
        // small backoff
        await new Promise(r => setTimeout(r, 300 * (attempt + 1)));
        continue;
      }
      throw lastErr;
    }
  }
  throw lastErr;
}

export default function UploadForm() {
  const { t, i18n } = useTranslation();
  const [name, setName] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const lang = i18n.resolvedLanguage || i18n.language || "ar";

  // ---------- file selection & previews ----------
  const appendFiles = useCallback(
    (incoming: File[]) => {
      if (!incoming.length) return;

      setItems(prev => {
        const next = [...prev];
        for (const f of incoming) {
          if (!f.type.startsWith("image/")) continue;

          // Guardrails (adjust to your needs)
          const MAX_EACH_MB = 25; // FormData handles large files fine; keep generous but safe for mobile
          if (f.size > MAX_EACH_MB * 1024 * 1024) {
            toast.error(`${f.name}: ${t("fileTooLarge") || "file too large"}`);
            continue;
          }

          const id = `${f.name}-${f.size}-${f.lastModified}-${uuidv4()}`;
          next.push({ id, file: f, url: URL.createObjectURL(f) });
        }
        return next;
      });

      // allow picking the same files again
      if (fileRef.current) fileRef.current.value = "";
    },
    [t]
  );

  const onFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    appendFiles(Array.from(e.target.files ?? []));
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    appendFiles(Array.from(e.dataTransfer.files ?? []));
  };

  function removeOne(id: string) {
    setItems(prev => {
      const it = prev.find(x => x.id === id);
      if (it) URL.revokeObjectURL(it.url);
      return prev.filter(x => x.id !== id);
    });
  }

  function clearAll() {
    setItems(prev => {
      prev.forEach(x => URL.revokeObjectURL(x.url));
      return [];
    });
    if (fileRef.current) fileRef.current.value = "";
  }

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      items.forEach(x => URL.revokeObjectURL(x.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- uploader (FormData, no Base64) ----------
  /**
   * Sends one batch via FormData. No Base64, raw File blobs only.
   */
  async function uploadBatchFormData(batch: Item[], subfolderName: string, signal?: AbortSignal) {
    const fd = new FormData();
    if (subfolderName.trim()) fd.append("subfolderName", subfolderName.trim());

    // Append files
    for (const it of batch) {
      // keep original filename; backend uses field "files"
      fd.append("files", it.file, it.file.name);
    }

    const data = await fetchJSON(UPLOAD_ENDPOINT, {
      method: "POST",
      body: fd,
      signal,
      // NOTE: do NOT set Content-Type; the browser sets proper multipart boundary
      retries: 1, // we already batch; 1 retry is enough
    });

    if (!data?.ok) throw new Error(data?.error || "Upload failed");
    return data;
  }

  /**
   * Batch strategy:
   * - Keep under ~30MB per request to play nice with proxies.
   * - Hard cap on items per batch (e.g., 8–10) to avoid long single calls on mobile.
   */
  async function uploadFormDataBatched(all: Item[], subfolderName: string) {
    // compute batches by total size and count
    const MAX_BATCH_BYTES = 30 * 1024 * 1024; // ~30MB per request
    const MAX_BATCH_COUNT = 8;

    const batches: Item[][] = [];
    let cur: Item[] = [];
    let curSize = 0;

    for (const it of all) {
      const fitsByCount = cur.length < MAX_BATCH_COUNT;
      const fitsBySize = curSize + it.file.size <= MAX_BATCH_BYTES;
      if (fitsByCount && fitsBySize) {
        cur.push(it);
        curSize += it.file.size;
      } else {
        if (cur.length) batches.push(cur);
        cur = [it];
        curSize = it.file.size;
      }
    }
    if (cur.length) batches.push(cur);

    setProgress({ done: 0, total: all.length });
    let uploaded = 0;

    const controller = new AbortController();
    try {
      for (const batch of batches) {
        await uploadBatchFormData(batch, subfolderName, controller.signal);
        uploaded += batch.length;
        setProgress({ done: uploaded, total: all.length });
        // give the UI a tick (prevents jank on low-end phones)
        await new Promise(r => setTimeout(r, 0));
      }
    } finally {
      setProgress(null);
      controller.abort();
    }
  }

  // ---------- submit ----------
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || items.length === 0) {
      toast.error(t("required"));
      return;
    }
    if (!UPLOAD_ENDPOINT) {
      toast.error("Upload endpoint not configured. Check VITE_WEB_APP_URL.");
      return;
    }

    setSubmitting(true);
    try {
      await uploadFormDataBatched(items, name);
      setSuccess(true);
      setName("");
      clearAll();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Upload failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- UI ----------
  return success ? (
    <div className="max-w-xl mx-auto text-center rounded-2xl p-6 sm:p-8">
      <div className="font-heading text-2xl sm:text-3xl text-rose-500 mb-2">{t("thanksTitle")}</div>
      <p className="font-body text-[15px] text-ink/80">{t("thanksBody")}</p>
    </div>
  ) : (
    <>
      <section>
        <div className="max-w-2xl mx-auto text-center rounded-2xl p-5 sm:p-7">
          <div className="font-heading text-2xl sm:text-3xl text-rose-500 mb-2">{t("welcomeTitle")}</div>
          <p className="font-body text-[15px]">{t("welcomeBody")}</p>
        </div>
      </section>

      <form
        onSubmit={submit}
        className="max-w-xl mx-auto rounded-2xl shadow-sm p-6 sm:p-8 flex flex-col gap-6 bg-white border border-rose/20"
      >
        <div>
          <label className="block font-body text-sm mb-2 text-ink/80" htmlFor="guest-name">
            {t("yourName")}
          </label>
          <input
            id="guest-name"
            className="w-full font-body rounded-xl border border-rose/30 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-soft bg-off"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={64}
          />
        </div>

        <div dir={lang.startsWith("ar") ? "rtl" : "ltr"} className="w-full">
          <label
            htmlFor="photos"
            className={`block font-body text-sm mb-2 text-ink/80 ${lang.startsWith("ar") ? "text-right" : "text-left"}`}
          >
            {t("uploadPhotos")} <span className="text-ink/50">({t("multipleAllowed")})</span>
          </label>

          {/* Dropzone */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => fileRef.current?.click()}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            className="group w-full rounded-2xl border border-dashed border-rose/40 bg-off px-5 py-8
                       hover:border-rose/70 hover:bg-rose/5 transition-colors cursor-pointer
                       focus:outline-none focus:ring-2 focus:ring-rose/50"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center justify-start gap-3">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="shrink-0">
                  <path d="M4 7h3l1.2-2.4c.2-.4.6-.6 1-.6h5.6c.4 0 .8.2 1 .6L17 7h3c1.1 0 2 .9 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9c0-1.1.9-2 2-2Z" stroke="var(--rose)" strokeWidth="1.5" />
                  <circle cx="12" cy="13" r="3.5" stroke="var(--rose)" strokeWidth="1.5" />
                </svg>
                <div className="text-start">
                  <div className="font-body text-[15px] text-ink">
                    {t("dragDrop")} <span className="text-rose">{t("browse")}</span>
                  </div>
                  <div className="font-body text-[12px] text-ink/60">
                    {t("imagesHint")}
                  </div>
                </div>
              </div>
            </div>

            {/* Hidden input (native picker) */}
            <input
              ref={fileRef}
              id="photos"
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={onFiles}
            />
          </div>

          {/* Selected count */}
          <div aria-live="polite" className="font-body mt-3 text-xs text-ink/70">
            {!!items.length && (
              <>
                {lang.startsWith("ar")
                  ? `${items.length} ${t("imagesSelected_ar")}`
                  : `${items.length} ${t("imagesSelected_en")}`}
              </>
            )}
          </div>

          {/* Thumbnails */}
          {!!items.length && (
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {items.map((it) => (
                <div key={it.id} className="relative group rounded-xl overflow-hidden bg-off border border-ink/10">
                  <img src={it.url} alt={it.file.name} className="h-28 w-full object-cover" loading="lazy" />
                  <button
                    type="button"
                    onClick={() => removeOne(it.id)}
                    className="absolute top-2 z-[1] rounded-full border border-ink/10
                               bg-white/80 backdrop-blur px-2 py-0.5 text-[11px] font-body
                               text-ink/80 hover:bg-white"
                    style={lang.startsWith("ar") ? { left: 8 } : { right: 8 }}
                  >
                    {t("remove")}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Clear all */}
          {!!items.length && (
            <div className={`mt-2 ${lang.startsWith("ar") ? "text-left" : "text-right"}`}>
              <button
                type="button"
                onClick={clearAll}
                className="font-body text-xs underline underline-offset-2"
              >
                {t("clearAll")}
              </button>
            </div>
          )}
        </div>

        <button
          type="submit"
          className="w-full rounded-xl px-5 py-3 font-heading text-white text-lg shadow-sm active:scale-[.99]"
          style={{ background: "var(--rose)" }}
          disabled={submitting}
        >
          {progress
            ? `${t("uploading") || "Uploading"} ${progress.done}/${progress.total}`
            : t("submit")}
        </button>

        <HeartLoader visible={submitting} />
      </form>
    </>
  );
}
