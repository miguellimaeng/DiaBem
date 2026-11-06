/* Ilustrações flat simples — usadas só em educação e receitas, onde agregam valor. */
import type { ReactNode } from 'react';

const BG: Record<string, string> = {
  blue: 'linear-gradient(135deg,#eef3ff,#dfe8ff)',
  amber: 'linear-gradient(135deg,#fff5e3,#ffe3bd)',
  teal: 'linear-gradient(135deg,#eaf7f5,#d5efeb)',
  green: 'linear-gradient(135deg,#edf8f1,#d8f0e1)',
  rose: 'linear-gradient(135deg,#fff0f4,#fbdce4)',
  violet: 'linear-gradient(135deg,#f1efff,#e2ddff)',
};

const ART: Record<string, { bg: keyof typeof BG; svg: ReactNode }> = {
  basics: { bg: 'blue', svg: <><circle cx="40" cy="40" r="22" fill="#fff" /><path d="M40 24s11 11 11 21a11 11 0 0 1-22 0c0-10 11-21 11-21Z" fill="#3f6fe5" /><circle cx="36" cy="44" r="3" fill="#fff" opacity=".7" /></> },
  type1: { bg: 'violet', svg: <><rect x="22" y="34" width="36" height="12" rx="6" fill="#7565d4" /><rect x="52" y="36" width="12" height="8" rx="2" fill="#b9b0ee" /><rect x="14" y="38" width="10" height="4" rx="2" fill="#5747b8" /><circle cx="34" cy="40" r="2" fill="#fff" /></> },
  type2: { bg: 'teal', svg: <><circle cx="32" cy="40" r="13" fill="#3aa8a0" /><circle cx="50" cy="40" r="13" fill="#9ad6cf" opacity=".9" /><path d="M28 40h8M32 36v8" stroke="#fff" strokeWidth="3" strokeLinecap="round" /></> },
  glucose: { bg: 'blue', svg: <><rect x="16" y="22" width="48" height="36" rx="8" fill="#fff" /><path d="M22 48l8-8 7 5 9-12 10 7" fill="none" stroke="#3f6fe5" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /><circle cx="56" cy="40" r="3" fill="#3aa8a0" /></> },
  records: { bg: 'blue', svg: <><rect x="18" y="20" width="44" height="40" rx="8" fill="#fff" /><rect x="25" y="42" width="6" height="11" rx="2" fill="#9db6f3" /><rect x="35" y="34" width="6" height="19" rx="2" fill="#3f6fe5" /><rect x="45" y="38" width="6" height="15" rx="2" fill="#3aa8a0" /></> },
  carbs: { bg: 'amber', svg: <><rect x="20" y="30" width="40" height="26" rx="8" fill="#e5a24b" /><path d="M24 32c0-7 7-10 16-10s16 3 16 10" fill="#efbb6c" /><circle cx="31" cy="42" r="3" fill="#fff2cf" /><circle cx="49" cy="44" r="3" fill="#fff2cf" /><circle cx="40" cy="48" r="2.5" fill="#fff2cf" /></> },
  hypo: { bg: 'rose', svg: <><path d="M40 20s13 13 13 24a13 13 0 0 1-26 0c0-11 13-24 13-24Z" fill="#d9788e" /><path d="M40 38v10M35 43l5 5 5-5" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" /></> },
  hyper: { bg: 'amber', svg: <><path d="M40 20s13 13 13 24a13 13 0 0 1-26 0c0-11 13-24 13-24Z" fill="#e5a24b" /><path d="M40 50V40M35 45l5-5 5 5" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" /></> },
  exercise: { bg: 'teal', svg: <><circle cx="44" cy="20" r="6" fill="#3aa8a0" /><path d="M42 28l-6 12 8 6-4 12M36 40l-10 2M42 30l10 6" stroke="#3aa8a0" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" fill="none" /></> },
  sleep: { bg: 'violet', svg: <><path d="M44 20a18 18 0 1 0 16 24 14 14 0 0 1-16-24Z" fill="#7565d4" /><circle cx="56" cy="24" r="2" fill="#b9b0ee" /><circle cx="62" cy="34" r="1.5" fill="#b9b0ee" /></> },
  food: { bg: 'green', svg: <><circle cx="40" cy="40" r="22" fill="#fff" /><path d="M40 18v22H18a22 22 0 0 1 22-22Z" fill="#4ca873" /><path d="M40 40h22a22 22 0 0 1-22 22Z" fill="#e5a24b" /><path d="M40 40v22a22 22 0 0 1-22-22Z" fill="#d9788e" /></> },
  insulin: { bg: 'violet', svg: <><rect x="20" y="34" width="34" height="12" rx="6" fill="#7565d4" /><rect x="54" y="37" width="10" height="6" rx="2" fill="#5747b8" /><rect x="26" y="37" width="14" height="6" rx="3" fill="#cfc8f5" /></> },
  meds: { bg: 'green', svg: <><rect x="20" y="30" width="40" height="20" rx="10" fill="#4ca873" transform="rotate(-30 40 40)" /><path d="M40 30v20" stroke="#fff" strokeWidth="3" transform="rotate(-30 40 40)" /></> },
  feet: { bg: 'green', svg: <><ellipse cx="34" cy="46" rx="9" ry="14" fill="#4ca873" /><circle cx="28" cy="28" r="3" fill="#4ca873" /><circle cx="34" cy="26" r="3" fill="#4ca873" /><circle cx="40" cy="28" r="2.6" fill="#4ca873" /><ellipse cx="52" cy="42" rx="7" ry="11" fill="#9fd8b6" /></> },
  appointment: { bg: 'blue', svg: <><rect x="20" y="24" width="40" height="34" rx="7" fill="#fff" /><rect x="20" y="24" width="40" height="10" rx="5" fill="#3f6fe5" /><path d="M32 46l5 5 10-10" stroke="#4ca873" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" /></> },
  exams: { bg: 'teal', svg: <><path d="M34 20h12M36 20v14l-10 18a4 4 0 0 0 3.5 6h21a4 4 0 0 0 3.5-6L44 34V20" fill="#fff" stroke="#3aa8a0" strokeWidth="3" strokeLinejoin="round" /><path d="M29 48h22l2 4a2 2 0 0 1-2 3H29a2 2 0 0 1-2-3Z" fill="#3aa8a0" /></> },
  school: { bg: 'amber', svg: <><rect x="20" y="26" width="18" height="30" rx="3" fill="#e5a24b" /><rect x="42" y="26" width="18" height="30" rx="3" fill="#f2c68a" /><path d="M24 34h10M24 40h10M46 34h10M46 40h10" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" /></> },
  travel: { bg: 'teal', svg: <><rect x="24" y="30" width="32" height="26" rx="6" fill="#3aa8a0" /><path d="M34 30v-4a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v4" stroke="#3aa8a0" strokeWidth="3.5" fill="none" /><path d="M24 40h32" stroke="#fff" strokeWidth="2.5" /></> },
  // receitas
  salad: { bg: 'green', svg: <><path d="M16 40h48a24 18 0 0 1-48 0Z" fill="#fff" /><circle cx="30" cy="36" r="8" fill="#4ca873" /><circle cx="44" cy="34" r="8" fill="#7cc79a" /><circle cx="52" cy="38" r="5" fill="#d9788e" /><circle cx="36" cy="40" r="4" fill="#e5a24b" /></> },
  omelet: { bg: 'amber', svg: <><circle cx="40" cy="42" r="22" fill="#fff" /><ellipse cx="40" cy="42" rx="16" ry="11" fill="#f0c65b" /><circle cx="34" cy="40" r="3" fill="#4ca873" /><circle cx="45" cy="45" r="3" fill="#d9788e" /><circle cx="44" cy="37" r="2" fill="#4ca873" /></> },
  oats: { bg: 'amber', svg: <><path d="M18 38h44a22 20 0 0 1-44 0Z" fill="#fff" /><ellipse cx="40" cy="38" rx="22" ry="6" fill="#efd9b0" /><circle cx="34" cy="37" r="3" fill="#d9788e" /><circle cx="44" cy="36" r="3" fill="#7565d4" /></> },
  fish: { bg: 'teal', svg: <><rect x="14" y="26" width="52" height="30" rx="8" fill="#fff" /><path d="M24 41c6-8 18-8 26 0-8 8-20 8-26 0Z" fill="#e5a24b" /><path d="M50 41l8-6v12Z" fill="#e5a24b" /><circle cx="30" cy="40" r="1.6" fill="#fff" /><circle cx="22" cy="50" r="3" fill="#4ca873" /><circle cx="58" cy="50" r="3" fill="#d9788e" /></> },
  soup: { bg: 'amber', svg: <><path d="M16 38h48a24 20 0 0 1-48 0Z" fill="#e5a24b" /><ellipse cx="40" cy="38" rx="24" ry="6" fill="#f2c68a" /><circle cx="32" cy="38" r="3" fill="#4ca873" /><circle cx="46" cy="37" r="3" fill="#d9788e" /><path d="M34 24c2 3-2 4 0 7M44 22c2 3-2 4 0 7" stroke="#e5a24b" strokeWidth="2.5" strokeLinecap="round" fill="none" /></> },
  yogurt: { bg: 'rose', svg: <><path d="M24 30h32l-4 26a4 4 0 0 1-4 3H32a4 4 0 0 1-4-3Z" fill="#fff" /><ellipse cx="40" cy="30" rx="16" ry="5" fill="#fbe7ec" /><circle cx="35" cy="29" r="3.5" fill="#d9788e" /><circle cx="45" cy="29" r="3" fill="#e5a24b" /></> },
  chicken: { bg: 'amber', svg: <><rect x="18" y="32" width="44" height="18" rx="9" fill="#f2c68a" transform="rotate(-12 40 41)" /><path d="M24 44l30-8" stroke="#4ca873" strokeWidth="4" strokeLinecap="round" /><path d="M26 39l26-6" stroke="#d9788e" strokeWidth="3" strokeLinecap="round" /></> },
  fruit: { bg: 'rose', svg: <><circle cx="40" cy="44" r="16" fill="#d9788e" /><path d="M40 28c0-5 3-8 7-8" stroke="#4ca873" strokeWidth="3" strokeLinecap="round" fill="none" /><ellipse cx="34" cy="40" rx="4" ry="3" fill="#fff" opacity=".4" /></> },
};

export function Illustration({ name, size = 64, height, radius }: { name: string; size?: number; height?: number; radius?: number }) {
  const art = ART[name] ?? ART.basics;
  return (
    <div className="illu" aria-hidden="true" style={{ width: height ? '100%' : size, height: height ?? size, background: BG[art.bg], borderRadius: radius }}>
      <svg viewBox="0 0 80 80" width={Math.min(height ?? size, size) * 0.8} height={Math.min(height ?? size, size) * 0.8}>{art.svg}</svg>
    </div>
  );
}
