import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import HeartLoader from "./heartloader";

const WEB_APP_URL = import.meta.env.VITE_WEB_APP_URL as string;

export default function UploadForm() {
  const { t, i18n } = useTranslation();
  const [name, setName] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const lang = i18n.resolvedLanguage || i18n.language || "ar";


  function fileToDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result)); // data:<mime>;base64,...
      fr.onerror = reject;
      fr.readAsDataURL(file);
    });
  }

  async function uploadManyBase64(allFiles: File[], subfolderName: string) {
    // Convert all files to base64 data URLs in parallel
    const dataUrls = await Promise.all(allFiles.map(fileToDataURL));
    const payload = {
      subfolderName: subfolderName.trim(),
      files: dataUrls.map((du, i) => ({
        base64: du.split(",")[1],                   // strip prefix
        filename: allFiles[i].name,
        mimeType: allFiles[i].type || "application/octet-stream",
      })),
    };

    const url = WEB_APP_URL
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });
    const raw = await res.text();
    let json: any;
    try { json = JSON.parse(raw); } catch { throw new Error("Invalid server response"); }
    if (!json?.ok) throw new Error(json?.error || "Upload failed");
    return json; // { ok:true, count, results:[...] }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || files.length === 0) {
      alert(t("required"));
      return;
    }
    if (!WEB_APP_URL) {
      alert("Upload endpoint not configured. Check VITE_WEB_APP_URL and VITE_UPLOAD_SECRET.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await uploadManyBase64(files, name);
      console.log("uploaded:", res);
      setSuccess(true);
      setName("");
      setFiles([]);
      if (fileRef.current) fileRef.current.value = "";
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Upload failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };





  const appendFiles = useCallback((incoming: File[]) => {
    setFiles(prev => {
      const merged = [...prev, ...incoming];
      const unique = Array.from(
        new Map(merged.map(f => [`${f.name}-${f.size}-${f.lastModified}`, f])).values()
      );
      if (fileRef.current) {
        const dt = new DataTransfer();
        unique.forEach(f => dt.items.add(f));
        fileRef.current.files = dt.files;
      }
      return unique;
    });
  }, []);

  const onFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    appendFiles(Array.from(e.target.files ?? []));
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    appendFiles(Array.from(e.dataTransfer.files ?? []));
  };

  const removeFile = (idx: number) => {
    setFiles(prev => {
      const next = prev.filter((_, i) => i !== idx);
      if (fileRef.current) {
        const dt = new DataTransfer();
        next.forEach(f => dt.items.add(f));
        fileRef.current.files = dt.files;
      }
      return next;
    });
  };

  const clearAll = () => {
    setFiles([]);
    if (fileRef.current) fileRef.current.value = "";
  };
  return (
    success ? (
      <div className="max-w-xl mx-auto text-center rounded-2xl p-6 sm:p-8">
        <div className="font-heading text-2xl sm:text-3xl text-rose-500 mb-2">
          {t("thanksTitle")}
        </div>
        <p className="font-body text-[15px] text-ink/80">{t("thanksBody")}</p>
      </div>
    ) : (
      <>
        <section>
          <div className="max-w-2xl mx-auto text-center rounded-2xl p-5 sm:p-7">
            <div className="font-heading text-2xl sm:text-3xl text-rose-500 mb-2">
              {t("welcomeTitle")}
            </div>
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
              className={`block font-body text-sm mb-2 text-ink/80 ${lang.startsWith("ar") ? "text-right" : "text-left"
                }`}
            >
              {t("uploadPhotos")}{" "}
              <span className="text-ink/50">({t("multipleAllowed")})</span>
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
              <div
                className={`flex items-center justify-between gap-4 `}
              >
                <div className="flex items-center justify-start gap-3">
                  {/* Camera/Image icon */}
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="shrink-0">
                    <path d="M4 7h3l1.2-2.4c.2-.4.6-.6 1-.6h5.6c.4 0 .8.2 1 .6L17 7h3c1.1 0 2 .9 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9c0-1.1.9-2 2-2Z" stroke="var(--rose)" strokeWidth="1.5" />
                    <circle cx="12" cy="13" r="3.5" stroke="var(--rose)" strokeWidth="1.5" />
                  </svg>

                  <div className="text-start">
                    <div className="font-body text-[15px] text-ink">
                      {t("dragDrop")} <span className="text-rose">{t("browse")}</span>
                    </div>
                    <div className="font-body text-[12px] text-ink/60">
                      {t("imagesHint")} {/* e.g., “PNG, JPG, HEIC — up to 10MB each” */}
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
              {!!files.length && (
                <>
                  {lang.startsWith("ar")
                    ? `${files.length} ${t("imagesSelected_ar")}` // e.g., "صورة محددة"
                    : `${files.length} ${t("imagesSelected_en")}`} {/* e.g., "image(s) selected" */}
                </>
              )}
            </div>

            {/* Thumbnails */}
            {!!files.length && (
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {files.map((f: File, i: number) => {
                  const url = URL.createObjectURL(f);
                  return (
                    <div key={i} className="relative group rounded-xl overflow-hidden bg-off border border-ink/10">
                      <img
                        src={url}
                        alt={f.name}
                        className="h-28 w-full object-cover"
                        onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
                      />
                      <button
                        type="button"
                        onClick={() => removeFile(i)}

                        className="absolute top-2 z-[1] rounded-full border border-ink/10
                             bg-white/80 backdrop-blur px-2 py-0.5 text-[11px] font-body
                             text-ink/80 hover:bg-white"
                        style={lang.startsWith("ar") ? { left: 8 } : { right: 8 }}
                      >
                        {t("remove")}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Clear all */}
            {!!files.length && (
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
            {t("submit")}
          </button>

          <HeartLoader visible={submitting} />
        </form>
      </>
    )
  );
}
