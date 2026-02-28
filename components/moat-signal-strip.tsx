const moatSignals = [
  "Deterministic policy evaluation",
  "Cryptographic receipt hashing",
  "Public demo policy transparency",
  "Structured release discipline",
];

export function MoatSignalStrip() {
  return (
    <section className="border-y border-white/10 py-4">
      <div className="grid gap-2 text-sm text-slate-300 sm:grid-cols-2 lg:grid-cols-4">
        {moatSignals.map((signal) => (
          <p key={signal} className="font-medium">
            {signal}
          </p>
        ))}
      </div>
    </section>
  );
}
