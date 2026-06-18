export function LegalLayout({
  title,
  updated,
  html,
}: {
  title: string;
  updated?: string;
  html: string;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      {updated && (
        <p className="mt-1 text-sm text-muted-foreground">Last updated: {updated}</p>
      )}
      <div
        className="mt-8 text-sm leading-relaxed text-foreground/80 [&_a]:text-brand-700 [&_a]:underline [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-brand-800 [&_h3]:mt-5 [&_h3]:font-semibold [&_h3]:text-brand-700 [&_li]:mt-1 [&_p]:mt-3 [&_table]:mt-3 [&_table]:w-full [&_table]:border-collapse [&_table]:text-xs [&_td]:border [&_td]:border-border [&_td]:p-2 [&_th]:border [&_th]:border-border [&_th]:p-2 [&_th]:text-left [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
