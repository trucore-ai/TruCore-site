import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { Button } from "@/components/ui/button";

type CalloutProps = {
  title?: string;
  children: ReactNode;
};

function Pre(props: ComponentPropsWithoutRef<"pre">) {
  return (
    <pre
      {...props}
      className="overflow-x-auto rounded-xl border border-white/[0.08] bg-neutral-950/70 p-5 font-mono text-[0.8125rem] leading-relaxed text-slate-200"
      style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02), 0 1px 3px rgba(0,0,0,0.3)' }}
    />
  );
}

function Code(props: ComponentPropsWithoutRef<"code">) {
  return <code {...props} className="font-mono text-[0.8125rem] text-slate-200" />;
}

export function Callout({ title, children }: CalloutProps) {
  return (
    <div className="glass-panel rounded-xl p-5 sm:p-6">
      {title ? <p className="text-lg font-semibold text-[#e8944a]">{title}</p> : null}
      <div className="mt-2 text-lg leading-[1.6] text-slate-200">{children}</div>
    </div>
  );
}

export function BlogPostCta() {
  return (
    <div className="glass-panel max-w-3xl rounded-xl p-6 sm:p-8">
      <h2 className="text-3xl font-bold tracking-tight text-[#e8944a]">Build with TruCore</h2>
      <p className="mt-4 text-xl leading-[1.5] text-slate-200">
        If you are building autonomous finance workflows and need policy-bound execution from day one,
        apply to the design partner program.
      </p>
      <div className="mt-6">
        <Button href="/atf/apply">Apply as Design Partner</Button>
      </div>
    </div>
  );
}

export const mdxComponents = {
  pre: Pre,
  code: Code,
  Callout,
};
