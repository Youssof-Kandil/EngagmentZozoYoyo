import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import HeartLoader from "./components/heartloader";
import Hero from "./components/heroImage";
import UploadForm from "./components/mainForm";
import { Toaster } from "react-hot-toast";

export default function App() {
  const { t, i18n } = useTranslation();
  const [boot, setBoot] = useState(true);

  // initial loader
  useEffect(() => {
    const id = setTimeout(() => setBoot(false), 900);
    return () => clearTimeout(id);
  }, []);

  // keep dir/lang in <html> in sync for RTL correctness
  const lang = i18n.resolvedLanguage || i18n.language || "ar";
  const isAr = lang.startsWith("ar");
  useEffect(() => {
    const lang = i18n.resolvedLanguage || i18n.language || "ar";
    document.documentElement.lang = isAr ? "ar" : "en";
    document.documentElement.dir = lang.startsWith("ar") ? "rtl" : "ltr";
  }, [i18n.resolvedLanguage, i18n.language]);

  return (
    <div className="min-h-screen text-ink">
      <HeartLoader visible={boot} />

      {/* Language Toggle */}
      <div className="fixed top-3 sm:top-5 z-40 w-full flex justify-end px-4">
        <button
          onClick={() =>
            i18n.changeLanguage(i18n.language.startsWith("ar") ? "en" : "ar")
          }
          className="rounded-full px-4 py-2 text-xs sm:text-sm bg-white/80 backdrop-blur border border-rose/30 hover:border-rose/60 transition"
        >
          {t("switchTo")}
        </button>
      </div>

      {/* Hero */}
      <Hero couple={t("couple")} date={t("date")} />

      <div className=" flex flex-col gap-4 px-4 sm:px-6 md:px-8 pb-6">


        {/* Form */}
        <section >
          <UploadForm />
        </section>

        <footer className="text-center font-body text-xs text-rose-500">
          {t("footer")}
        </footer>
      </div>
      <Toaster />
    </div>
  );
}
