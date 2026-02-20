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
      className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-900/70 p-4 font-mono text-sm leading-relaxed text-slate-100"
    />
  );
}

function Code(props: ComponentPropsWithoutRef<"code">) {
  return <code {...props} className="font-mono text-sm text-slate-100" />;
}

export function Callout({ title, children }: CalloutProps) {
  return (
    <div className="rounded-xl border border-primary-300/25 bg-primary-500/10 p-5 sm:p-6">
      {title ? <p className="text-lg font-semibold text-[#e8944a]">{title}</p> : null}
      <div className="mt-2 text-lg leading-[1.6] text-slate-200">{children}</div>
    </div>
  );
}

export function BlogPostCta() {
  return (
    <div className="max-w-3xl rounded-xl border border-primary-300/25 bg-primary-500/10 p-6 sm:p-8">
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
