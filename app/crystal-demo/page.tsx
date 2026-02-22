import { Card } from "@/components/ui/card";

export const metadata = {
  title: "Glass Card Demo | TruCore",
  robots: "noindex",
};

export default function GlassDemoPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-12 bg-gray-950 p-8">
      <h1 className="text-2xl font-bold text-white">Glass Card Demo</h1>

      <div className="grid max-w-4xl grid-cols-1 gap-8 sm:grid-cols-3">
        <Card>
          <h2 className="text-lg font-semibold text-white">Default Card</h2>
          <p className="mt-1 text-sm text-white/60">
            Simple glass panel with subtle sheen
          </p>
          <button className="mt-3 rounded-md bg-white/10 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/20">
            Action
          </button>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-white">Feature Card</h2>
          <p className="mt-1 text-sm text-white/60">
            Same glass treatment, consistent style
          </p>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-white">Info Card</h2>
          <p className="mt-1 text-sm text-white/60">
            Clean glass pane with edge highlight
          </p>
        </Card>
      </div>

      <p className="max-w-md text-center text-sm text-white/40">
        Simple glass cards with a subtle animated sheen sweep. No WebGL, no 3D,
        just clean CSS glass panels.
      </p>
    </main>
  );
}
