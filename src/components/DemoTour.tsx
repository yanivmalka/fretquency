import { useEffect, useState } from 'react';
import { useTranslation } from '../i18n/useTranslation';

export interface DemoTourStep {
  /** CSS selector for the real element to spotlight (e.g. a `data-demo="..."` hook). */
  selector: string;
  title: string;
  body: string;
  /** Advance automatically once the player interacts with the spotlighted element,
   *  instead of waiting for the Next button. The tap still reaches the real
   *  control underneath — this component never swallows it. */
  dismissOnInteract?: boolean;
}

interface Props {
  active: boolean;
  steps: DemoTourStep[];
  onFinish: () => void;
}

interface Rect { top: number; left: number; width: number; height: number }

const PAD = 6;

export default function DemoTour({ active, steps, onFinish }: Props) {
  const { t } = useTranslation();
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);

  useEffect(() => {
    if (!active) setStepIndex(0);
  }, [active]);

  const step = active ? steps[stepIndex] : undefined;

  useEffect(() => {
    if (!step) { setRect(null); return; }
    const measure = () => {
      const el = document.querySelector(step.selector);
      if (!el) { setRect(null); return; }
      const r = el.getBoundingClientRect();
      setRect({ top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 });
    };
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [step]);

  useEffect(() => {
    if (!step?.dismissOnInteract || !rect) return;
    const handler = (e: PointerEvent) => {
      const inside = e.clientX >= rect.left && e.clientX <= rect.left + rect.width
        && e.clientY >= rect.top && e.clientY <= rect.top + rect.height;
      if (inside) advance();
    };
    document.addEventListener('pointerdown', handler, true);
    return () => document.removeEventListener('pointerdown', handler, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, rect]);

  function advance() {
    if (stepIndex + 1 < steps.length) setStepIndex(stepIndex + 1);
    else onFinish();
  }

  if (!active || !step || !rect) return null;

  const isLast = stepIndex === steps.length - 1;
  const cardTop = rect.top + rect.height + 12;
  const cardBelow = cardTop + 160 < window.innerHeight;

  return (
    <div className="demo-tour" role="dialog" aria-live="polite">
      <div className="demo-tour-dim" style={{ top: 0, left: 0, right: 0, height: Math.max(rect.top, 0) }} />
      <div className="demo-tour-dim" style={{ top: rect.top + rect.height, left: 0, right: 0, bottom: 0 }} />
      <div className="demo-tour-dim" style={{ top: rect.top, left: 0, width: Math.max(rect.left, 0), height: rect.height }} />
      <div className="demo-tour-dim" style={{ top: rect.top, left: rect.left + rect.width, right: 0, height: rect.height }} />
      <div
        className="demo-tour-ring"
        style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
      />
      <div
        className="demo-tour-card"
        style={cardBelow
          ? { top: cardTop, left: '50%' }
          : { top: Math.max(rect.top - 170, 12), left: '50%' }}
      >
        <div className="demo-tour-title">{t(step.title)}</div>
        <div className="demo-tour-body">{t(step.body)}</div>
        <div className="demo-tour-actions">
          <button type="button" className="demo-tour-skip" onClick={onFinish}>{t('Skip')}</button>
          {!step.dismissOnInteract && (
            <button type="button" className="demo-tour-next" onClick={advance}>
              {isLast ? t('Got it') : t('Next')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
