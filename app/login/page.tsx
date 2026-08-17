import { doLogin } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="grid min-h-screen grid-cols-1">
      <div className="grid min-h-screen grid-cols-1 md:grid-cols-2">
        {/* Panel de marca */}
        <div className="relative flex flex-col justify-between gap-10 overflow-hidden bg-navy p-6 py-10 sm:p-10 md:gap-0 md:p-16">
          <div className="absolute -right-[60px] -top-[60px] h-[280px] w-[280px] rounded-full bg-accent opacity-60" />
          <div className="absolute -bottom-[100px] -left-10 h-[220px] w-[220px] rounded-full border-2 border-slate opacity-40" />
          <div className="absolute bottom-[120px] left-[40%] h-[260px] w-[260px] rounded-full bg-[radial-gradient(circle,var(--color-amber)_0%,transparent_70%)] opacity-20 blur-2xl" />

          <div className="relative z-10">
            <div className="font-mono text-[13px] uppercase tracking-[0.12em] text-border">
              Speakfluently
            </div>
            <div className="mt-0.5 text-[15px] text-bg">Academia de inglés online</div>
          </div>

          <div className="relative z-10 max-w-[420px]">
            <div className="text-[28px] font-bold leading-[1.15] text-white sm:text-[34px] md:text-[40px]">
              Todo tu material de práctica, en un solo lugar.
            </div>
            <div className="mt-4 text-[15px] leading-[1.5] text-border sm:text-[17px]">
              Cartillas, guías, vocabulario y ejercicios de tus profesores, organizados por
              nivel para que avances a tu ritmo.
            </div>
          </div>

          <div className="relative z-10 font-mono text-xs text-slate">Portal de estudiantes</div>
        </div>

        {/* Formulario */}
        <div className="flex items-center justify-center bg-bg p-6 py-10 sm:p-10 md:p-16">
          <div className="w-full max-w-[380px]">
            <div className="mb-1.5 text-[26px] font-bold">Bienvenido de nuevo</div>
            <div className="mb-9 text-[15px] text-accent">
              Ingresa con los datos que te dio tu profesor.
            </div>

            <form action={doLogin} className="flex flex-col gap-[18px]">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="email"
                  className="font-mono text-xs uppercase tracking-[0.04em] text-accent"
                >
                  Usuario
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  placeholder="tu.nombre@correo.com"
                  required
                  className="rounded-md border border-border bg-white px-3.5 py-[13px] text-[15px] text-navy outline-none transition-shadow duration-[var(--transition-hover)] focus:border-accent focus:shadow-[var(--shadow-card)]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="password"
                  className="font-mono text-xs uppercase tracking-[0.04em] text-accent"
                >
                  Contraseña
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  required
                  className="rounded-md border border-border bg-white px-3.5 py-[13px] text-[15px] text-navy outline-none transition-shadow duration-[var(--transition-hover)] focus:border-accent focus:shadow-[var(--shadow-card)]"
                />
              </div>

              {error && (
                <div className="text-[13px] text-[#c1121f]">
                  Usuario o contraseña incorrectos. Intenta de nuevo.
                </div>
              )}

              <button
                type="submit"
                className="mt-2 rounded-md bg-amber p-3.5 text-[15px] font-semibold text-navy transition-[background-color,box-shadow] duration-[var(--transition-standard)] ease-[var(--ease-standard)] hover:bg-amber-strong hover:text-white hover:shadow-[var(--glow-amber)]"
              >
                Entrar a mis recursos
              </button>

              <div className="mt-1 text-center">
                <span className="text-[13px] text-slate">
                  ¿Olvidaste tu contraseña? Contacta a tu profesor
                </span>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
