/* =========================================================
   Identidade configurável — troque nome, cores e textos aqui.
   As cores também precisam ser ajustadas em styles/tokens.css
   e em public/manifest.webmanifest (theme_color).
   ========================================================= */
export const APP_CONFIG = {
  name: 'DiaBem',
  tagline: 'Seu dia a dia com diabetes, organizado.',
  version: '0.2.0',
  supportEmail: '',
  colors: {
    primary: '#3F6FE5',
    background: '#F6F8FB',
  },
  /** Texto exibido em telas com números e no relatório. */
  medicalDisclaimer:
    'O DiaBem organiza seus registros e oferece conteúdo educativo. Ele não faz diagnóstico, não prescreve, não calcula doses de insulina e não substitui a orientação da sua equipe de saúde.',
  emergencyNumbers: [
    { label: 'SAMU', number: '192' },
    { label: 'Bombeiros', number: '193' },
  ],
} as const;
