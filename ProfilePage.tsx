/* Perfil e configurações: experiência, acessibilidade, glicose, dados e privacidade (LGPD). */
import { useEffect, useState } from 'react';
import { useApp } from '@/app/AppContext';
import { back } from '@/app/router';
import { clearDemoData, deleteAllData } from '@/database/repositories';
import { loadDemoData } from '@/database/demoSeed';
import { Button, Card, Cat, Notice, Section, Segmented, SelectField, SubHead, Switch, TextField } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { RangeEditor } from '../glucose/RangeEditor';
import { ImportSheet } from './ImportSheet';
import type { SetupFile } from '@/services/importData';
import { APP_CONFIG } from '@/config/app.config';
import { DIABETES_TYPE_LABEL } from '@/config/categories';
import { formatGlucose } from '@/utils/glucose';
import { download, exportAllAsJSON } from '@/services/export';
import { install } from '@/services/pwa';
import { requestNotificationPermission } from '@/services/reminders';
import { PLANNED_SOURCES } from '@/services/integrations/GlucoseSource';
import { SHARE_CATEGORY_LABEL } from '@/services/sharing/caregiver';
import { toLocalDateInput } from '@/utils/date';
import type { DiabetesType, ExperienceMode, FontSize } from '@/types/models';
import { ThemePicker } from '@/components/ThemePicker';

export function ProfilePage() {
  const { settings, profile, updateSettings, saveProfile, toast } = useApp();
  const [name, setName] = useState(profile?.name ?? '');
  const [rangeOpen, setRangeOpen] = useState(false);
  const [canInstall, setCanInstall] = useState(install.canPrompt());
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  useEffect(() => install.subscribe(setCanInstall), []);
  useEffect(() => setName(profile?.name ?? ''), [profile?.name]);

  const r = settings.targetRange;
  const u = settings.glucoseUnit;

  return (
    <div>
      <SubHead title="Perfil" subtitle="Experiência, dados e privacidade" onBack={() => back('/')} />

      <Card title="Você">
        <div className="stack">
          <TextField label="Nome" value={name} onChange={setName} />
          {name !== (profile?.name ?? '') && <Button small onClick={async () => { await saveProfile({ name: name.trim() }); toast('Nome salvo'); }}>Salvar nome</Button>}
          <SelectField label="Tipo de diabetes" value={profile?.diabetesType ?? 'unspecified'} onChange={(v: DiabetesType) => saveProfile({ diabetesType: v })}
            options={(Object.keys(DIABETES_TYPE_LABEL) as DiabetesType[]).map((k) => ({ value: k, label: DIABETES_TYPE_LABEL[k] }))} />
        </div>
      </Card>

      <Card title="Cores do app">
        <ThemePicker value={settings.theme} onChange={(theme) => updateSettings({ theme })} />
        <p className="xsmall muted mt-3">A capa e o ícone mudam junto com as cores. No celular, o ícone da tela de início fica com as cores escolhidas no momento em que o app foi instalado; para trocá-lo, remova o atalho e instale de novo.</p>
      </Card>

      <Card title="Experiência">
        <div className="stack">
          <Segmented label="Modo de experiência" value={settings.mode} onChange={(v: ExperienceMode) => updateSettings({ mode: v })}
            options={[{ value: 'adult', label: 'Adulto' }, { value: 'child', label: 'Criança' }, { value: 'easy', label: 'Fácil' }]} />
          <p className="xsmall muted">{settings.mode === 'adult' ? 'Interface padrão, com detalhes equilibrados.' : settings.mode === 'child' ? 'Linguagem mais simples, missões e conquistas.' : 'Letras e botões maiores e navegação simplificada.'}</p>
          <div className="field">
            <span className="field-label">Tamanho do texto</span>
            <Segmented label="Tamanho do texto" value={settings.fontSize} onChange={(v: FontSize) => updateSettings({ fontSize: v })}
              options={[{ value: 'md', label: 'Padrão' }, { value: 'lg', label: 'Grande' }, { value: 'xl', label: 'Maior' }]} />
          </div>
          <Switch label="Reduzir animações" checked={settings.reduceMotion} onChange={(v) => updateSettings({ reduceMotion: v })} />
          <p className="xsmall muted">Modo escuro: planejado para uma próxima versão.</p>
        </div>
      </Card>

      <Card title="Glicose">
        <div className="stack">
          <div className="field">
            <span className="field-label">Unidade</span>
            <Segmented label="Unidade da glicose" value={u} onChange={(v) => updateSettings({ glucoseUnit: v })} options={[{ value: 'mg/dL', label: 'mg/dL' }, { value: 'mmol/L', label: 'mmol/L' }]} />
          </div>
          <div className="row-between">
            <div>
              <div className="small strong">Minha faixa</div>
              <div className="xsmall muted">{r ? `${formatGlucose(r.lowMgdl, u)}–${formatGlucose(r.highMgdl, u)} ${u} · definida ${r.definedBy === 'professional' ? 'pelo profissional' : 'por você'}` : 'Não definida — o app não usa faixa padrão'}</div>
            </div>
            <Button small variant="soft" onClick={() => setRangeOpen(true)}>{r ? 'Editar' : 'Definir'}</Button>
          </div>
        </div>
      </Card>

      <Card title="Lembretes e app">
        <div className="stack">
          <Switch label="Permitir lembretes" hint="Consultas e medicamentos, enquanto o app estiver aberto." checked={settings.remindersEnabled}
            onChange={async (v) => {
              if (v) {
                const p = await requestNotificationPermission();
                if (p !== 'granted') { toast(p === 'unsupported' ? 'Este navegador não suporta notificações' : 'Permissão não concedida'); return; }
              }
              updateSettings({ remindersEnabled: v });
            }} />
          {install.isStandalone() ? (
            <div className="row small"><Icon name="checkCircle" size={18} style={{ color: 'var(--green)' }} /> App instalado na tela inicial</div>
          ) : canInstall ? (
            <Button variant="soft" icon="smartphone" onClick={() => install.prompt()}>Instalar na tela inicial</Button>
          ) : (
            <Notice tone="neutral" icon="smartphone">
              {install.isIOS() ? <>No iPhone: toque em <b>Compartilhar</b> no Safari e depois em <b>Adicionar à Tela de Início</b>.</> : <>Para instalar, abra o menu do navegador e escolha <b>Instalar app</b> ou <b>Adicionar à tela inicial</b>.</>}
            </Notice>
          )}
        </div>
      </Card>

      <Section title="Meus dados" />
      <Card>
        <div className="stack">
          <Notice tone="info" icon="lock">Seus dados ficam somente neste aparelho, no armazenamento do navegador. Não há conta, servidor nem compartilhamento automático.</Notice>
          <Button variant="soft" icon="download" disabled={busy} onClick={async () => { setBusy(true); try { download(await exportAllAsJSON(true), `diabem-backup-${toLocalDateInput()}.json`); toast('Exportação concluída'); } finally { setBusy(false); } }}>
            Exportar todos os meus dados
          </Button>
          <Button variant="ghost" icon="upload" onClick={() => setImportOpen(true)}>Importar arquivo (configuração ou backup)</Button>
          {settings.demoLoaded
            ? <Button variant="ghost" onClick={async () => { await clearDemoData(); await updateSettings({ demoLoaded: false }); toast('Dados de demonstração removidos'); }}>Remover dados de demonstração</Button>
            : <Button variant="ghost" onClick={async () => { await loadDemoData(); await updateSettings({ demoLoaded: true }); toast('Dados de demonstração carregados'); }}>Carregar dados de demonstração</Button>}
        </div>
      </Card>

      <Section title="Em breve" />
      <Card>
        <div className="list">
          <div className="list-item"><Cat icon="users" tone="violet" size="sm" /><div className="grow"><div className="title small">Compartilhar com cuidador</div><div className="sub">Você escolherá o que compartilhar ({Object.values(SHARE_CATEGORY_LABEL).slice(0, 3).join(', ')}…), com quem e por quanto tempo. Nada é compartilhado por padrão.</div></div></div>
          <div className="list-item"><Cat icon="link" tone="teal" size="sm" /><div className="grow"><div className="title small">Integrações</div><div className="sub">{PLANNED_SOURCES.map((s) => s.label).join(' · ')}</div></div></div>
          <div className="list-item"><Cat icon="shield" tone="blue" size="sm" /><div className="grow"><div className="title small">Conta e sincronização</div><div className="sub">Opcional, com criptografia, para usar em vários aparelhos.</div></div></div>
        </div>
      </Card>

      <Section title="Apagar tudo" />
      <Card>
        <div className="stack-sm">
          <p className="small">Exclui permanentemente todos os registros, exames, fotos e configurações deste aparelho. Esta ação não pode ser desfeita.</p>
          <TextField label='Digite "APAGAR" para confirmar' value={confirm} onChange={setConfirm} />
          <Button variant="danger" icon="trash" disabled={confirm.trim().toUpperCase() !== 'APAGAR'} onClick={async () => { await deleteAllData(); window.location.hash = '#/'; window.location.reload(); }}>Apagar todos os dados</Button>
        </div>
      </Card>

      <p className="disclaimer">{APP_CONFIG.name} {APP_CONFIG.version} · {APP_CONFIG.medicalDisclaimer}</p>
      {rangeOpen && <RangeEditor onClose={() => setRangeOpen(false)} />}
      {importOpen && <ImportSheet onClose={() => setImportOpen(false)} onDone={async (sum, raw) => {
        if (sum.kind === 'setup' && (raw as SetupFile).settings) await updateSettings((raw as SetupFile).settings!);
        setImportOpen(false); toast('Dados importados'); setTimeout(() => window.location.reload(), 600);
      }} />}
    </div>
  );
}
