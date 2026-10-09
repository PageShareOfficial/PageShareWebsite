const FOUNDER_VIDEO_ID = 'nwEv6SKyN3M';
/** Privacy-enhanced embed: YouTube sets no cookies until the visitor presses play. */
const FOUNDER_VIDEO_EMBED_URL = `https://www.youtube-nocookie.com/embed/${FOUNDER_VIDEO_ID}?rel=0`;

export default function FounderVideoSection() {
  return (
    <section
      id="founders-video"
      className="relative z-10 pt-6 pb-10 sm:pt-8 sm:pb-12 md:pt-10 md:pb-14"
      aria-labelledby="founders-video-heading"
    >
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
        <header className="text-center mb-8 sm:mb-10 max-w-2xl mx-auto">
          <p className="text-sm sm:text-base tracking-[0.2em] uppercase text-gray-400 mb-3">
            From the founders
          </p>
          <h2
            id="founders-video-heading"
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight"
          >
            Why we built <span className="text-cyan-400">PageShare</span>
          </h2>
          <p className="mt-4 text-sm sm:text-base text-gray-400 leading-relaxed">
            Market calls are everywhere, but proof is rare. Hear why we set out to put every
            prediction on the record - so trust is earned by results, not hype.
          </p>
        </header>

        <div className="mx-auto max-w-3xl rounded-2xl border border-cyan-500/20 bg-linear-to-b from-cyan-500/10 to-transparent p-2 sm:p-3 shadow-[0_0_40px_rgba(34,211,238,0.12)]">
          <div className="relative w-full aspect-video overflow-hidden rounded-xl bg-black">
            <iframe
              src={FOUNDER_VIDEO_EMBED_URL}
              title="Why we built PageShare - a message from the founders"
              className="absolute inset-0 h-full w-full"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        </div>
      </div>
    </section>
  );
}
