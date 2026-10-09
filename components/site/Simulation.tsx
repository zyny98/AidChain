'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/components/providers/LanguageProvider';

type Phase = 'idle' | 'running' | 'paid' | 'frozen';

const AMOUNTS = [25, 100, 500];

function fakeHash(seed: number, offset = 0) {
  const hex = '0123456789abcdef';
  let s = '0x';
  let x = (seed + offset) * 2654435761;
  for (let i = 0; i < 8; i++) {
    x = (x * 1103515245 + 12345) >>> 0;
    s += hex[x % 16];
  }
  return s + '…';
}

interface LogLine {
  t: string;
  hash?: string;
  text: string;
  tone: 'ok' | 'bad' | 'dim' | 'info';
}

export function Simulation() {
  const { language } = useLanguage();
  const [amount, setAmount] = useState(100);
  const [forged, setForged] = useState(false);
  const [phase, setPhase] = useState<Phase>('paid');
  const [step, setStep] = useState(3);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const defaultInitialLog: LogLine[] = language === 'ru' ? [
    { t: '12:04:18', hash: '0x8f2e…', text: 'Депозит 100 USDC принят смарт-контрактом AidChain', tone: 'dim' },
    { t: '12:04:19', hash: '0x3d41…', text: 'Грант разделён: транш #1 (60 USDC), транш #2 (25 USDC), транш #3 (15 USDC)', tone: 'dim' },
    { t: '12:04:21', hash: '0x9a7c…', text: 'AI-оракул: чек поставщика сверен с оптовой базой, наценок не обнаружено', tone: 'info' },
    { t: '12:04:22', hash: '0x1b54…', text: 'Транш #1 (60 USDC) успешно переведён поставщику. Остаток в безопасности.', tone: 'ok' },
  ] : [
    { t: '12:04:18', hash: '0x8f2e…', text: 'Deposit 100 USDC received by AidChain smart contract', tone: 'dim' },
    { t: '12:04:19', hash: '0x3d41…', text: 'Grant staged: Tranche #1 (60 USDC), Tranche #2 (25 USDC), Tranche #3 (15 USDC)', tone: 'dim' },
    { t: '12:04:21', hash: '0x9a7c…', text: 'AI Oracle: Vendor receipt verified against wholesale baseline, 0 markup detected', tone: 'info' },
    { t: '12:04:22', hash: '0x1b54…', text: 'Tranche #1 (60 USDC) settled to supplier. Remaining balance secured.', tone: 'ok' },
  ];

  const [log, setLog] = useState<LogLine[]>(defaultInitialLog);

  const steps = [
    {
      key: 'vault',
      label: language === 'ru' ? 'Взнос в смарт-кошелёк' : 'Smart Vault Deposit',
      desc: language === 'ru' ? 'Защита от прямого вывода третьими лицами' : 'Protected from unauthorized third-party withdrawals',
      ms: 750,
    },
    {
      key: 'escrow',
      label: language === 'ru' ? 'Эскроу разбил сумму на 3 транша' : 'Escrow Milestone Split (3 Tranches)',
      desc: language === 'ru' ? 'Закупка (60%) · Логистика (25%) · Выдача (15%)' : 'Procurement (60%) · Logistics (25%) · Handover (15%)',
      ms: 900,
    },
    {
      key: 'oracle',
      label: language === 'ru' ? 'AI-оракул сверяет чек поставщика' : 'AI Oracle Receipt Verification',
      desc: language === 'ru' ? 'Проверка цен по оптовым базам и крипто-подпись' : 'Wholesale price cross-check and cryptographic signature',
      ms: 1200,
    },
    {
      key: 'payout',
      label: language === 'ru' ? 'Исполнение смарт-контракта' : 'Smart Contract Execution',
      desc: language === 'ru' ? 'Автоматический перевод транша или возврат средств' : 'Automated milestone payout or instant refund',
      ms: 800,
    },
  ];

  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  useEffect(() => clear, []);

  const push = (text: string, tone: LogLine['tone'] = 'dim', hash?: string) => {
    const t = new Date().toLocaleTimeString(language === 'ru' ? 'ru-RU' : 'en-US', { hour12: false });
    setLog((prev) => [...prev, { t, hash, text, tone }]);
  };

  const run = useCallback(() => {
    clear();
    setPhase('running');
    setStep(0);
    setLog([]);

    const t1 = Math.round(amount * 0.6);
    const t2 = Math.round(amount * 0.25);
    const t3 = amount - t1 - t2;

    let at = 0;

    // Step 0: Vault deposit
    timers.current.push(
      setTimeout(() => {
        setStep(0);
        push(
          language === 'ru'
            ? `Депозит ${amount} USDC зафиксирован в кошельке эскроу`
            : `Deposit of ${amount} USDC confirmed in escrow vault`,
          'dim',
          fakeHash(amount, 1)
        );
      }, at)
    );
    at += 750;

    // Step 1: Escrow split
    timers.current.push(
      setTimeout(() => {
        setStep(1);
        push(
          language === 'ru'
            ? `Эскроу сформировал 3 транша: Закупка (${t1} USDC) · Логистика (${t2} USDC) · Раздача (${t3} USDC)`
            : `Escrow allocated 3 tranches: Procurement (${t1} USDC) · Logistics (${t2} USDC) · Handover (${t3} USDC)`,
          'dim',
          fakeHash(amount, 2)
        );
      }, at)
    );
    at += 900;

    // Step 2: Oracle OCR inspection
    timers.current.push(
      setTimeout(() => {
        setStep(2);
        if (forged) {
          push(
            language === 'ru'
              ? 'AI-оракул: ВНИМАНИЕ! Цены в чеке превышают рыночные на 240% (Завышение сметы)'
              : 'AI Oracle: ALERT! Invoice prices exceed wholesale baseline by 240% (Markup detected)',
            'bad',
            fakeHash(amount, 3)
          );
        } else {
          push(
            language === 'ru'
              ? 'AI-оракул: Чек верифицирован. Позиции совпадают со сметой, наценок нет'
              : 'AI Oracle: Receipt verified. Items match budget baseline with 0 markup',
            'info',
            fakeHash(amount, 3)
          );
        }
      }, at)
    );
    at += 1200;

    // Step 3: Final execution
    timers.current.push(
      setTimeout(() => {
        setStep(3);
        if (forged) {
          setPhase('frozen');
          push(
            language === 'ru'
              ? `Транш #1 (${t1} USDC) ЗАМОРОЖЕН. Активирован возврат средств донору.`
              : `Tranche #1 (${t1} USDC) FROZEN. Donor timelock refund initiated.`,
            'bad',
            fakeHash(amount, 4)
          );
        } else {
          setPhase('paid');
          push(
            language === 'ru'
              ? `Транш #1 (${t1} USDC) переведён поставщику. Транши #2 и #3 остаются под защитой.`
              : `Tranche #1 (${t1} USDC) paid to supplier. Tranches #2 & #3 remain locked.`,
            'ok',
            fakeHash(amount, 4)
          );
        }
      }, at)
    );
  }, [amount, forged, language]);

  const reset = () => {
    clear();
    setPhase('idle');
    setStep(-1);
    setLog([]);
  };

  const running = phase === 'running';

  const t1 = Math.round(amount * 0.6);
  const t2 = Math.round(amount * 0.25);
  const t3 = amount - t1 - t2;

  return (
    <div className="space-y-10">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-14 items-start">
        {/* Left Column: Interactive Controls */}
        <div className="space-y-7 lg:col-span-5">
          {/* Amount selector */}
          <div>
            <p className="mb-3 text-[13px] font-medium uppercase tracking-wider text-paper/60 font-sans">
              {language === 'ru' ? 'Сумма пожертвования' : 'Donation Amount'}
            </p>
            <div className="inline-flex rounded-full border border-paper/15 p-1 bg-night/50">
              {AMOUNTS.map((a) => (
                <button
                  key={a}
                  type="button"
                  disabled={running}
                  onClick={() => setAmount(a)}
                  aria-label={`Select amount ${a} USDC`}
                  className={`rounded-full px-5 py-2 font-mono text-[14px] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal ${
                    amount === a
                      ? 'bg-paper text-ink shadow-[0_2px_10px_rgba(255,255,255,0.2)] font-semibold'
                      : 'text-paper/70 hover:text-paper hover:bg-paper/5'
                  }`}
                >
                  {a} USDC
                </button>
              ))}
            </div>
          </div>

          {/* Forged receipt toggle */}
          <div className="rounded-2xl border border-paper/10 bg-night/40 p-4 transition-colors hover:border-paper/20">
            <label className="flex cursor-pointer items-start gap-4 select-none">
              <button
                type="button"
                role="switch"
                aria-checked={forged}
                aria-label={language === 'ru' ? 'Включить симуляцию завышенного чека' : 'Toggle forged invoice simulation'}
                disabled={running}
                onClick={() => setForged((f) => !f)}
                className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal ${
                  forged ? 'border-warn bg-warn/30' : 'border-paper/30 bg-ink'
                }`}
              >
                <span
                  className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full transition-all shadow-sm ${
                    forged ? 'left-[22px] bg-warn' : 'left-1 bg-paper/80'
                  }`}
                />
              </button>
              <div className="space-y-1">
                <span className="text-[15px] font-medium leading-snug text-paper">
                  {language === 'ru' ? 'Поставщик предоставил завышенный чек' : 'Vendor submits inflated / fraudulent invoice'}
                </span>
                <p className="text-[13px] text-paper/55 leading-relaxed font-sans">
                  {language === 'ru'
                    ? 'Смоделируйте попытку фонда или поставщика накрутить накладную в фотошопе.'
                    : 'Simulate an attempt by an NGO or supplier to submit photoshopped or overpriced receipts.'}
                </p>
              </div>
            </label>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-1">
            <button
              type="button"
              onClick={run}
              disabled={running}
              className="rounded-full bg-emerald-500 px-7 py-3.5 text-[15px] font-semibold text-slate-950 shadow-md hover:bg-emerald-400 active:scale-[0.98] transition-all disabled:opacity-50 w-full sm:w-auto text-center"
            >
              {running
                ? (language === 'ru' ? 'Проверка смарт-контрактом…' : 'Validating in Smart Contract…')
                : (language === 'ru' ? `Запустить перевод ${amount} USDC` : `Simulate Transfer of ${amount} USDC`)}
            </button>
            {phase !== 'idle' && !running && (
              <button
                type="button"
                onClick={reset}
                className="text-[14px] text-paper/60 underline underline-offset-4 hover:text-paper transition-colors py-2 px-1"
              >
                {language === 'ru' ? 'Очистить симуляцию' : 'Reset Simulation'}
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Dynamic Pipeline Steps */}
        <div className="lg:col-span-7 space-y-6">
          <ol className="relative space-y-0">
            {steps.map((s, i) => {
              const done = phase === 'paid' || phase === 'frozen' ? true : step > i;
              const current = running && step === i;
              const isOracleFail = phase === 'frozen' && i >= 2;
              const failedHere = phase === 'frozen' && i === 3;

              return (
                <li key={s.key} className="relative flex gap-4 pb-6 last:pb-0">
                  {/* Connecting vertical track */}
                  {i < steps.length - 1 && (
                    <span className="absolute left-[11px] top-7 h-[calc(100%-1.1rem)] w-px bg-paper/15">
                      <span
                        className={`block w-full origin-top transition-transform duration-500 ${
                          done && !isOracleFail ? 'scale-y-100 bg-signal' : 'scale-y-0'
                        } h-full`}
                      />
                    </span>
                  )}

                  {/* Step status node */}
                  <span
                    className={`relative z-10 mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[11px] transition-all duration-300 font-mono ${
                      failedHere
                        ? 'border-warn bg-warn text-ink font-bold shadow-[0_0_12px_rgba(255,92,122,0.6)]'
                        : done
                        ? 'border-signal bg-signal text-ink font-bold shadow-[0_0_12px_rgba(77,139,255,0.5)]'
                        : current
                        ? 'border-signal bg-signal/20 text-signal'
                        : 'border-paper/20 bg-ink text-paper/40'
                    }`}
                  >
                    {failedHere ? '✕' : done ? '✓' : i + 1}
                    {current && (
                      <span className="absolute inset-[-5px] animate-ping rounded-full border border-signal/60" />
                    )}
                  </span>

                  {/* Step copy */}
                  <div className="flex-1 space-y-0.5">
                    <div
                      className={`text-[16px] font-medium leading-snug transition-colors ${
                        failedHere
                          ? 'text-warn'
                          : done || current
                          ? 'text-paper'
                          : 'text-paper/40'
                      }`}
                    >
                      {failedHere
                        ? (language === 'ru' ? 'Выплата заморожена · Возврат средств донору' : 'Payout Frozen · Donor Refund Triggered')
                        : s.label}
                    </div>
                    <div className="text-[13px] text-paper/50 font-sans leading-relaxed">
                      {s.desc}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>

          {/* Visual Tranche Flow Animation */}
          <div className="rounded-xl border border-paper/10 bg-night/50 p-4 space-y-3">
            <div className="flex items-center justify-between text-[12px] font-mono text-paper/60">
              <span>
                {language === 'ru'
                  ? `РАСПРЕДЕЛЕНИЕ ТРАНШЕЙ СУММЫ (${amount} USDC)`
                  : `TRANCHE ALLOCATION (${amount} USDC)`}
              </span>
              <span className={phase === 'frozen' ? 'text-warn font-medium' : 'text-cyan font-medium'}>
                {phase === 'frozen'
                  ? (language === 'ru' ? 'СТАТУС: БЛОКИРОВКА' : 'STATUS: FROZEN')
                  : phase === 'paid'
                  ? (language === 'ru' ? 'СТАТУС: ИСПОЛНЕНО' : 'STATUS: EXECUTED')
                  : (language === 'ru' ? 'СТАТУС: РАСЧЁТ' : 'STATUS: PENDING')}
              </span>
            </div>

            {/* Visual tranche split progress bar */}
            <div className="flex h-3 w-full gap-1 overflow-hidden rounded-full bg-paper/10 p-0.5">
              <div
                className={`h-full rounded-l-full transition-all duration-500 ${
                  phase === 'frozen'
                    ? 'bg-rose-500 shadow-[0_0_8px_rgba(255,92,122,0.8)]'
                    : 'bg-emerald-400'
                }`}
                style={{ width: '60%' }}
                title={language === 'ru' ? `Транш 1: Закупка (${t1} USDC)` : `Tranche 1: Procurement (${t1} USDC)`}
              />
              <div
                className="h-full bg-paper/30 transition-all duration-500"
                style={{ width: '25%' }}
                title={language === 'ru' ? `Транш 2: Логистика (${t2} USDC)` : `Tranche 2: Logistics (${t2} USDC)`}
              />
              <div
                className="h-full rounded-r-full bg-paper/20 transition-all duration-500"
                style={{ width: '15%' }}
                title={language === 'ru' ? `Транш 3: Раздача (${t3} USDC)` : `Tranche 3: Handover (${t3} USDC)`}
              />
            </div>

            <div className="grid grid-cols-3 gap-2 text-[12px] font-mono pt-1">
              <div className="space-y-0.5">
                <span className="text-paper/50 block">
                  {language === 'ru' ? 'Транш #1 (60%)' : 'Tranche #1 (60%)'}
                </span>
                <span className={phase === 'frozen' ? 'text-warn font-semibold' : 'text-paper font-semibold'}>
                  {t1} USDC {phase === 'frozen' ? (language === 'ru' ? '(Заморожен)' : '(Frozen)') : phase === 'paid' ? (language === 'ru' ? '(Выплачен)' : '(Settled)') : ''}
                </span>
              </div>
              <div className="space-y-0.5">
                <span className="text-paper/50 block">
                  {language === 'ru' ? 'Транш #2 (25%)' : 'Tranche #2 (25%)'}
                </span>
                <span className="text-paper/70 font-semibold">{t2} USDC</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-paper/50 block">
                  {language === 'ru' ? 'Транш #3 (15%)' : 'Tranche #3 (15%)'}
                </span>
                <span className="text-paper/70 font-semibold">{t3} USDC</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sequential Monospace Event Log */}
      <div
        aria-live="polite"
        className="rounded-xl border border-paper/10 bg-night/80 p-5 font-mono text-[12px] leading-relaxed shadow-inner"
      >
        <div className="flex items-center justify-between border-b border-paper/10 pb-2.5 mb-3 text-[11px] uppercase tracking-wider text-paper/40">
          <span>{language === 'ru' ? 'Журнал смарт-контракта (Realtime Event Log)' : 'Smart Contract On-Chain Event Log'}</span>
          <span className="text-paper/30">{language === 'ru' ? 'Сеть: Solana Network · Gas: 0.000005 SOL' : 'Network: Solana Network · Gas: 0.000005 SOL'}</span>
        </div>

        <div className="space-y-2 min-h-[110px]">
          {log.map((l, i) => (
            <div key={i} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 text-[12.5px]">
              <span className="shrink-0 text-paper/35 text-[11px]">[{l.t}]</span>
              {l.hash && (
                <span className="shrink-0 text-signal/80 text-[11px] underline underline-offset-2">
                  {l.hash}
                </span>
              )}
              <span
                className={
                  l.tone === 'ok'
                    ? 'text-cyan font-medium'
                    : l.tone === 'bad'
                    ? 'text-warn font-medium'
                    : l.tone === 'info'
                    ? 'text-paper'
                    : 'text-paper/70'
                }
              >
                {l.text}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Finish Summary Card */}
      {(phase === 'paid' || phase === 'frozen') && (
        <div className="rounded-2xl border border-white/[0.08] bg-[#121827] p-6 transition-all shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="font-display text-[15px] font-medium text-paper">
              {language === 'ru' ? 'Итог транзакции смарт-контракта' : 'Smart Contract Settlement Summary'}
            </h4>
            <span
              className={`rounded-full px-3 py-1 text-[11px] font-mono uppercase tracking-wider ${
                phase === 'paid'
                  ? 'border border-cyan/40 bg-cyan/10 text-cyan'
                  : 'border border-warn/40 bg-warn/10 text-warn'
              }`}
            >
              {phase === 'paid'
                ? (language === 'ru' ? 'Проверено и одобрено' : 'Verified & Approved')
                : (language === 'ru' ? 'Мошенничество пресечено' : 'Fraud Averted')}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <div className="rounded-xl border border-paper/10 bg-ink/60 p-4">
              <span className="text-[12px] font-mono text-paper/50 block">
                {language === 'ru' ? 'Отправлено донором' : 'Donated by Donor'}
              </span>
              <span className="font-mono text-[22px] font-bold text-paper mt-1 block">
                {amount} USDC
              </span>
              <span className="text-[11px] text-paper/40 mt-0.5 block">
                {language === 'ru' ? '100% зафиксировано в эскроу' : '100% locked in escrow'}
              </span>
            </div>

            <div className="rounded-xl border border-paper/10 bg-ink/60 p-4">
              <span className="text-[12px] font-mono text-paper/50 block">
                {language === 'ru' ? 'Выплачено поставщику' : 'Paid to Supplier'}
              </span>
              <span
                className={`font-mono text-[22px] font-bold mt-1 block ${
                  phase === 'paid' ? 'text-cyan' : 'text-paper/40'
                }`}
              >
                {phase === 'paid' ? `${t1} USDC` : '0 USDC'}
              </span>
              <span className="text-[11px] text-paper/40 mt-0.5 block">
                {phase === 'paid'
                  ? (language === 'ru' ? 'Транш #1 по проверенному чеку' : 'Tranche #1 via validated receipt')
                  : (language === 'ru' ? 'Платёж заблокирован' : 'Payment blocked')}
              </span>
            </div>

            <div className="rounded-xl border border-paper/10 bg-ink/60 p-4">
              <span className="text-[12px] font-mono text-paper/50 block">
                {phase === 'paid' ? (language === 'ru' ? 'Остаётся в защите' : 'Protected in Escrow') : (language === 'ru' ? 'Возврат донору' : 'Refund to Donor')}
              </span>
              <span
                className={`font-mono text-[22px] font-bold mt-1 block ${
                  phase === 'frozen' ? 'text-warn' : 'text-paper'
                }`}
              >
                {phase === 'frozen' ? `${amount} USDC` : `${amount - t1} USDC`}
              </span>
              <span className="text-[11px] text-paper/40 mt-0.5 block">
                {phase === 'frozen'
                  ? (language === 'ru' ? 'Возврат 100% средств по таймлоку' : '100% timelock donor refund')
                  : (language === 'ru' ? 'Транши #2 и #3 ждут доставки' : 'Tranches #2 & #3 await logistics')}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
