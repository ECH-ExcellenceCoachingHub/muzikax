'use client';

import Link from 'next/link';
import { useLanguage } from '../../contexts/LanguageContext';

/** Shared typography for section titles — use these everywhere a section is labelled. */
export const SECTION_TITLE_CLASS = 'text-lg sm:text-xl font-bold tracking-tight text-text-primary';
export const SECTION_LINK_CLASS =
  'text-xs font-semibold uppercase tracking-widest text-text-secondary hover:text-text-primary transition-colors duration-200';

/**
 * The one section header used across the app, so every section title reads identically.
 * Pass `href` for a link or `onSeeAll` for a button; omit both for a title only.
 */
export default function SectionHeader({
  title,
  href,
  onSeeAll,
  actionLabel,
  className = '',
}: {
  title: string;
  href?: string;
  onSeeAll?: () => void;
  actionLabel?: string;
  className?: string;
}) {
  const { t } = useLanguage();
  const label = actionLabel ?? t('seeAll');

  return (
    <div className={`flex items-center justify-between gap-4 mb-4 ${className}`}>
      <h2 className={`${SECTION_TITLE_CLASS} truncate`}>{title}</h2>
      {href ? (
        <Link href={href} className={`${SECTION_LINK_CLASS} shrink-0`}>
          {label}
        </Link>
      ) : onSeeAll ? (
        <button type="button" onClick={onSeeAll} className={`${SECTION_LINK_CLASS} shrink-0`}>
          {label}
        </button>
      ) : null}
    </div>
  );
}
