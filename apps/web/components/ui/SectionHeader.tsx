import Link from 'next/link';

export function SectionHeader({ title, href, linkLabel }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mx-4 mb-2.5 mt-5 flex items-baseline justify-between gap-2 border-b border-line pb-1.5 lg:mx-8">
      <h2 className="font-display text-[13.5px] font-bold uppercase tracking-wider text-dim">{title}</h2>
      {href ? (
        <Link href={href} className="font-display text-[12.5px] font-semibold uppercase tracking-wide text-amber">
          {linkLabel}
        </Link>
      ) : null}
    </div>
  );
}
