import type { ReactNode } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

type LegalPageLayoutProps = {
  eyebrow: string;
  title: string;
  description: string;
  updatedAt: string;
  asideTitle: string;
  asideCopy: string;
  accent: string;
  children: ReactNode;
};

const LegalPageLayout = ({
  eyebrow,
  title,
  description,
  updatedAt,
  asideTitle,
  asideCopy,
  accent,
  children,
}: LegalPageLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 overflow-hidden bg-[linear-gradient(180deg,hsl(var(--surface-warm))_0%,hsl(var(--background))_38%)]">
        <section className="relative px-4 py-14 sm:py-20">
          <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-64 w-[42rem] max-w-full rounded-full blur-3xl opacity-60" style={{ background: accent }} />

          <div className="container relative mx-auto max-w-6xl">
            <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-start">
              <div className="rounded-[2rem] border border-white/50 bg-white/80 p-8 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.35)] backdrop-blur xl:p-10">
                <div className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  {eyebrow}
                </div>
                <h1 className="mt-5 max-w-2xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                  {title}
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                  {description}
                </p>
                <div className="mt-8 inline-flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  <span className="font-medium text-slate-900">Last updated:</span>
                  <span className="ml-2">{updatedAt}</span>
                </div>
              </div>

              <aside className="rounded-[2rem] border border-slate-200/70 bg-slate-950 p-8 text-slate-100 shadow-[0_20px_70px_-32px_rgba(15,23,42,0.7)]">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Quick Note</p>
                <h2 className="mt-4 text-2xl font-semibold">{asideTitle}</h2>
                <p className="mt-4 text-sm leading-7 text-slate-300">{asideCopy}</p>
              </aside>
            </div>

            <div className="mt-10 rounded-[2rem] border border-slate-200/70 bg-white/92 p-5 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.35)] backdrop-blur sm:p-8">
              {children}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default LegalPageLayout;
