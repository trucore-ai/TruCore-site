const moatSignals = [
  "Deterministic policy evaluation",
  "Cryptographic receipt hashing",
  "Public demo policy transparency",
  "Structured release discipline",
];

export function MoatSignalStrip() {
  return (
    <section className="relative py-6">
      <div className="gradient-divider absolute inset-x-0 top-0" aria-hidden="true" />
      <div className="gradient-divider absolute inset-x-0 bottom-0" aria-hidden="true" />
      <div className="grid gap-3 text-sm text-slate-400 sm:grid-cols-2 lg:grid-cols-4">
        {moatSignals.map((signal) => (
          <p key={signal} className="flex items-center gap-2 font-medium">
            <span className="h-1 w-1 shrink-0 rounded-full bg-primary-400/50" aria-hidden="true" />
            {signal}
          </p>
        ))}
      </div>
    </section>
  );
}
