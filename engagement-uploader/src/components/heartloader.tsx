import { useTranslation } from "react-i18next";

// ——— Loader ———
export default function HeartLoader({ visible }: { visible: boolean }) {
    const { t } = useTranslation();
  
  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      style={{ background: "rgba(255,255,255,.85)" }}
    >
      <div className="flex flex-col items-center gap-5">
        <svg width="120" height="110" viewBox="0 0 120 110" fill="none">
          <path
            d="M60 98 C20 72 6 56 6 36 C6 21 19 12 32 12 c10 0 18 5 28 18 C70 17 78 12 88 12 c13 0 26 9 26 24 0 20-14 36-54 62z"
            stroke="var(--rose)"
            strokeWidth="3.5"
            fill="none"
            strokeLinecap="round"
            className="animate-heart"
            pathLength="100"
          />
        </svg>
        <span className="font-body text-[15px] text-rose">{t("loading")}</span>
      </div>

      <style>{`
        .animate-heart {
          stroke-dasharray: 100;   /* equals full path length */
          stroke-dashoffset: 100;  /* start hidden */
          animation: draw 1.6s ease-in-out infinite alternate;
        }
        @keyframes draw {
          to { stroke-dashoffset: 0; } /* fully drawn */
        }
      `}</style>
    </div>
  );
}
