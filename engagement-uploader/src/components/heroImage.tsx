const HERO_IMAGE =
  "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1600&auto=format&fit=crop";

// ——— Hero ———
export default function Hero({
  couple,
  date,
}: {
  couple: string;
  date: string;
}) {
  return (
    <section className="">
      <div
        className="w-full  min-h-[250px] sm:h-[40vh] md:h-[50vh] bg-center bg-cover"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,.35),rgba(0,0,0,.35)), url(${HERO_IMAGE})`,
        }}
      >
        <div className=" w-full min-h-[250px] h-full flex items-center justify-center">
          <div className="text-center text-white px-6">
            <div className="font-heading text-4xl sm:text-5xl md:text-6xl font-semibold tracking-wide mb-3">
              {couple}
            </div>
            <div className="font-body text-base sm:text-lg opacity-95">
              {date}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
