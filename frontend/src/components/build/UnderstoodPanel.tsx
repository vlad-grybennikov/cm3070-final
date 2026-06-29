import type { Brief } from "@/data/build-mock";

export function UnderstoodPanel({
  summary,
  brief,
}: {
  summary: string;
  brief: Brief;
}) {
  const rows: [string, string][] = [
    ["Business", brief.business],
    ["Audience", brief.audience],
    ["Goal", brief.goal],
  ];

  return (
    <section className="rounded-2xl border border-black/10 p-5 dark:border-white/10">
      <h2 className="text-lg font-semibold">What I understood</h2>

      <p className="mt-4 rounded-lg bg-zinc-100 p-4 text-sm leading-6 text-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300">
        {summary}
      </p>

      <p className="mt-5 text-xs font-medium tracking-wider text-zinc-400">
        INFERRED BRIEF
      </p>
      <dl className="mt-2 divide-y divide-black/5 dark:divide-white/5">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between gap-4 py-2.5">
            <dt className="text-sm text-zinc-500">{label}</dt>
            <dd className="text-right text-sm font-medium">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
