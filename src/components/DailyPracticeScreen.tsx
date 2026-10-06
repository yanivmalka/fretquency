// ── DailyPracticeScreen — the "Daily practice" learning tab (full page) ─
//
// One of the learning-type tabs reachable from the drawer's "Learn" group.
// Used to host every "what should I practise today?" card (notes/intervals/
// staff/tab goal cards) as a full page. Those cards now live on the practice
// screens themselves as floating side bubbles (PracticeSideBubbles in
// App.tsx) instead — this page stays reachable from the menu/search for
// anyone who had it bookmarked, but just points there now. Premium-only: the
// host mounts it behind `can('premiumTeacher', tier)` and it is wrapped in
// <ProGate> as a second line of defence. All copy through `t()`; the layout
// flips for Hebrew via `dir`.

import { ProGate } from './ProGate';
import { Chevron } from './Chevron';
import { useTranslation } from '../i18n/useTranslation';
import { playClickSound, haptic } from '../utils/feedback';

interface Props {
  headerIcon?: string;
  onClose: () => void;
}

export default function DailyPracticeScreen({ headerIcon, onClose }: Props) {
  const { t, lang } = useTranslation();

  return (
    <div className="app settings-page lp-page">
      <div className="sp2 settings-page-inner" dir={lang === 'he' ? 'rtl' : undefined}>
        <div className="sp2-head settings-page-head">
          <button
            className="sp2-back"
            onClick={() => { playClickSound(); haptic.tap(); onClose(); }}
          >
            <Chevron dir="back" /> {t('Back')}
          </button>
        </div>
        <header className="settings-page-hero">
          {headerIcon ? (
            <img src={headerIcon} alt="" className="settings-page-icon-img" />
          ) : (
            <span className="settings-page-emoji" aria-hidden="true">📅</span>
          )}
          <h2 className="settings-page-name">{t('Daily practice')}</h2>
        </header>

        <div className="settings-page-body">
          <ProGate
            feature="premiumTeacher"
            variant="replace"
            pitch={t('Let the Teacher plan your practice')}
          >
            <p className="lp-intro">
              {t('Your daily goals and homework now live on the practice screens — look for the circles on the side.')}
            </p>
          </ProGate>
        </div>
      </div>
    </div>
  );
}
