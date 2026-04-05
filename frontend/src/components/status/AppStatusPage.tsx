import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Home, LifeBuoy, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

type AppStatusPageProps = {
  code: string;
  title: string;
  description: string;
  badge: string;
  accentClass: string;
  icon: ReactNode;
  details?: ReactNode;
  primaryAction?: {
    label: string;
    onClick?: () => void;
    to?: string;
  };
  secondaryAction?: {
    label: string;
    onClick?: () => void;
    to?: string;
  };
};

const StatusAction = ({
  label,
  to,
  onClick,
  variant = 'default',
  icon,
}: {
  label: string;
  to?: string;
  onClick?: () => void;
  variant?: 'default' | 'outline';
  icon: ReactNode;
}) => {
  if (to) {
    return (
      <Button asChild variant={variant} className="min-w-[160px] gap-2 rounded-full px-5">
        <Link to={to}>
          {icon}
          {label}
        </Link>
      </Button>
    );
  }

  return (
    <Button onClick={onClick} variant={variant} className="min-w-[160px] gap-2 rounded-full px-5">
      {icon}
      {label}
    </Button>
  );
};

const AppStatusPage = ({
  code,
  title,
  description,
  badge,
  accentClass,
  icon,
  details,
  primaryAction,
  secondaryAction,
}: AppStatusPageProps) => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_42%,#ffffff_100%)]">
      <div className={`pointer-events-none absolute left-1/2 top-0 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full blur-3xl opacity-60 ${accentClass}`} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.85),transparent_42%),linear-gradient(rgba(15,23,42,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.03)_1px,transparent_1px)] bg-[size:auto,32px_32px,32px_32px]" />

      <main className="relative mx-auto flex min-h-screen max-w-7xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <section className="rounded-[2rem] border border-white/70 bg-white/75 p-8 shadow-[0_30px_100px_-38px_rgba(15,23,42,0.4)] backdrop-blur-xl sm:p-10">
            <div className="inline-flex items-center rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              {badge}
            </div>

            <div className="mt-6 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-[1.75rem] bg-slate-950 text-white shadow-lg">
                {icon}
              </div>
              <div className="text-[clamp(4rem,12vw,7rem)] font-semibold leading-none tracking-[-0.08em] text-slate-200">
                {code}
              </div>
            </div>

            <h1 className="mt-8 max-w-2xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              {title}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              {description}
            </p>

            {details ? (
              <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-600">
                {details}
              </div>
            ) : null}

            <div className="mt-8 flex flex-wrap gap-3">
              {primaryAction ? (
                <StatusAction
                  label={primaryAction.label}
                  to={primaryAction.to}
                  onClick={primaryAction.onClick}
                  icon={<ArrowRight className="h-4 w-4" />}
                />
              ) : null}
              {secondaryAction ? (
                <StatusAction
                  label={secondaryAction.label}
                  to={secondaryAction.to}
                  onClick={secondaryAction.onClick}
                  variant="outline"
                  icon={<RefreshCw className="h-4 w-4" />}
                />
              ) : null}
              {!secondaryAction ? (
                <StatusAction label="Go Home" to="/" variant="outline" icon={<Home className="h-4 w-4" />} />
              ) : null}
            </div>
          </section>

          <aside className="rounded-[2rem] border border-slate-200/80 bg-slate-950 p-7 text-slate-100 shadow-[0_28px_90px_-42px_rgba(15,23,42,0.8)] sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">While You Are Here</p>
            <h2 className="mt-4 text-2xl font-semibold">A dead end should still feel designed.</h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              We turned this fallback into a proper experience so users can recover quickly instead of feeling like the app broke without context.
            </p>

            <div className="mt-8 space-y-4">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                <p className="text-sm font-semibold text-white">Popular next step</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Jump back to the homepage, browse mentors, or return to the last working page without losing your flow.
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-white/10 p-3 text-slate-100">
                    <LifeBuoy className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Need support?</p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      If this keeps happening, use the support flow so the team can check the broken route, account state, or page error.
                    </p>
                    <Link to="/help" className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-sky-300 hover:text-sky-200">
                      Open Help Center
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default AppStatusPage;
