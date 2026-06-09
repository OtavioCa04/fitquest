import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  Dumbbell,
  Edit2,
  Eye,
  EyeOff,
  Flame,
  Home,
  Lock,
  LogOut,
  Plus,
  Shield,
  Target,
  Trophy,
  User,
  X,
  Zap,
  Route,
} from "lucide-react";
import { buildDailyMissions } from "./achievements";
import {
  Achievement,
  DashboardData,
  Intensity,
  UserAccount,
  Workout,
} from "./types";

type Screen =
  | "login"
  | "register"
  | "home"
  | "achievements"
  | "missions"
  | "workout"
  | "profile";
type AuthResponse = DashboardData & { token: string };
type WorkoutResponse = DashboardData & { workout: Workout };

const TOKEN_KEY = "fitquest_token";
const UNAUTHORIZED_EVENT = "fitquest:unauthorized";
const defaultAvatar =
  "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=400&q=80";
const logoSrc = "/logo.png";

function token() {
  return localStorage.getItem(TOKEN_KEY);
}

function saveToken(value: string) {
  localStorage.setItem(TOKEN_KEY, value);
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function passwordChecks(password: string) {
  return [
    { label: "8 caracteres", valid: password.length >= 8 },
    { label: "1 maiuscula", valid: /[A-Z]/.test(password) },
    { label: "1 numero", valid: /[0-9]/.test(password) },
    { label: "1 caractere especial", valid: /[^A-Za-z0-9]/.test(password) },
  ];
}

function passwordIsStrong(password: string) {
  return passwordChecks(password).every((check) => check.valid);
}

async function api<T>(url: string, options: RequestInit = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
      ...options.headers,
    },
  });

  if (response.status === 401) {
    clearToken();
    window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Erro na requisicao.");
  }

  if (response.status === 204) return null as T;
  return response.json() as Promise<T>;
}

function Logo({ small = false }: { small?: boolean }) {
  return (
    <div
      className={`relative ${small ? "h-14 w-14" : "h-36 w-36"} flex items-center justify-center`}
    >
      <div className="absolute inset-0 rounded-full bg-[#00e676]/25 blur-2xl" />
      <img
        src={logoSrc}
        alt="FitQuest"
        className="relative h-full w-full object-contain drop-shadow-[0_0_28px_rgba(0,230,118,0.38)]"
      />
    </div>
  );
}

function Avatar({
  user,
  size = "lg",
}: {
  user?: UserAccount | null;
  size?: "sm" | "lg";
}) {
  const src = user?.avatarData || defaultAvatar;
  const classes = size === "sm" ? "h-12 w-12" : "h-32 w-32";
  return (
    <img
      src={src}
      alt="Avatar"
      className={`${classes} rounded-full border-4 border-[#00e676] object-cover shadow-[0_0_25px_rgba(0,230,118,0.35)]`}
    />
  );
}

function Button({
  children,
  onClick,
  disabled = false,
  danger = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`h-16 w-full rounded-2xl font-black tracking-widest flex items-center justify-center gap-3 active:scale-95 transition disabled:opacity-50 ${
        danger
          ? "bg-[#93000a] text-white"
          : "bg-[#00e676] text-[#003318] neon-glow"
      }`}
    >
      {children}
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  compact = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  compact?: boolean;
}) {
  return (
    <label className="block space-y-2">
      <span
        className={`ml-2 font-black uppercase text-[#d7ded2] ${
          compact ? "text-xs tracking-[0.08em]" : "text-sm tracking-[0.14em]"
        }`}
      >
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        placeholder={placeholder}
        className={`w-full rounded-2xl border border-[#3b4740] bg-[#1b1b1d] font-bold text-white outline-none transition placeholder:text-[#77777d] focus:border-[#00e676] ${
          compact ? "h-14 px-3 text-base" : "h-16 px-5 text-lg"
        }`}
      />
    </label>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  visible,
  onToggle,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggle: () => void;
  placeholder?: string;
}) {
  const Icon = visible ? EyeOff : Eye;

  return (
    <label className="block space-y-2">
      <span className="ml-2 text-sm font-black uppercase tracking-[0.14em] text-[#d7ded2]">
        {label}
      </span>
      <div className="relative">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          type={visible ? "text" : "password"}
          placeholder={placeholder}
          className="h-16 w-full rounded-2xl border border-[#3b4740] bg-[#1b1b1d] px-5 pr-14 text-lg font-bold text-white outline-none transition placeholder:text-[#77777d] focus:border-[#00e676]"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-[#d7ded2] transition hover:bg-[#2a2a2c] hover:text-[#00e676]"
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
        >
          <Icon size={22} />
        </button>
      </div>
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="block space-y-2">
      <span className="ml-2 text-sm font-black uppercase tracking-[0.14em] text-[#d7ded2]">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-16 w-full rounded-2xl border border-[#3b4740] bg-[#1b1b1d] px-5 text-lg font-bold text-white outline-none transition focus:border-[#00e676]"
      >
        <option value="">Selecione</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function AuthScreen({
  mode,
  onMode,
  onLogin,
}: {
  mode: "login" | "register";
  onMode: (screen: Screen) => void;
  onLogin: (data: DashboardData) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    try {
      setError("");
      setLoading(true);
      if (mode === "register" && !passwordIsStrong(password))
        throw new Error("A senha ainda nao atende todos os requisitos.");
      if (mode === "register" && password !== confirmPassword)
        throw new Error("As senhas nao conferem.");
      const body =
        mode === "login"
          ? { identifier: username || email, password }
          : { name, email, username, password };
      const data = await api<AuthResponse>(`/api/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      saveToken(data.token);
      onLogin(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Nao foi possivel continuar.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_50%_15%,#073622_0%,#101012_38%,#0d0d0f_100%)] px-8 py-10 text-white">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md flex-col justify-center">
        <div className="mb-10 flex flex-col items-center">
          <Logo />
          <h1 className="mt-6 text-5xl font-black tracking-tight text-[#00e676]">
            FITQUEST
          </h1>
          {mode === "register" && (
            <p className="mt-2 text-lg font-black uppercase tracking-[0.12em] text-[#d7ded2]">
              Inicie sua jornada agora
            </p>
          )}
        </div>

        <div className="space-y-5">
          {mode === "register" && (
            <>
              <Field
                label="Nome completo"
                value={name}
                onChange={setName}
                placeholder="Seu nome"
              />
              <Field
                label="Email"
                value={email}
                onChange={setEmail}
                type="email"
                placeholder="seu@email.com"
              />
            </>
          )}
          <Field
            label={mode === "login" ? "Usuario" : "Nome de usuario"}
            value={username}
            onChange={setUsername}
            placeholder={
              mode === "login" ? "Seu nome de usuario" : "@heroi_da_academia"
            }
          />
          <PasswordField
            label="Senha"
            value={password}
            onChange={setPassword}
            visible={showPassword}
            onToggle={() => setShowPassword((value) => !value)}
            placeholder="********"
          />
          {mode === "register" && (
            <div className="grid grid-cols-2 gap-2 rounded-2xl border border-[#303438] bg-[#151618] p-3">
              {passwordChecks(password).map((check) => (
                <span
                  key={check.label}
                  className={`text-xs font-black uppercase tracking-wider ${check.valid ? "text-[#00e676]" : "text-[#858b88]"}`}
                >
                  {check.valid ? "OK" : "--"} {check.label}
                </span>
              ))}
            </div>
          )}
          {mode === "register" && (
            <PasswordField
              label="Confirmar"
              value={confirmPassword}
              onChange={setConfirmPassword}
              visible={showConfirmPassword}
              onToggle={() => setShowConfirmPassword((value) => !value)}
              placeholder="********"
            />
          )}
          {mode === "login" && (
            <button className="text-sm font-black uppercase tracking-widest text-[#b8c2ba]">
              Esqueci minha senha
            </button>
          )}
          {error && (
            <p className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
              {error}
            </p>
          )}
          <Button onClick={submit} disabled={loading}>
            {loading
              ? "AGUARDE..."
              : mode === "login"
                ? "ENTRAR"
                : "CRIAR CONTA"}{" "}
            <Zap size={26} />
          </Button>
          <button
            className="w-full py-4 text-center text-lg font-black uppercase tracking-[0.16em] text-[#00e676]"
            onClick={() => onMode(mode === "login" ? "register" : "login")}
          >
            {mode === "login"
              ? "Nao possuo uma conta"
              : "Ja possui uma conta? Entre aqui"}
          </button>
        </div>
      </section>
    </main>
  );
}

function Header({ centered = false }: { centered?: boolean }) {
  return (
    <header className="sticky top-0 z-30 h-20 border-b border-[#202125] bg-[#101012]/95 backdrop-blur">
      <div
        className={`mx-auto flex h-full max-w-md items-center px-6 ${centered ? "justify-between" : "justify-between"}`}
      >
        <Logo small />
        {centered && (
          <h1 className="text-4xl font-black tracking-tight text-[#00e676]">
            FITQUEST
          </h1>
        )}
        <Shield className="text-[#75ff9e]" size={32} />
      </div>
    </header>
  );
}

function BottomNav({
  screen,
  setScreen,
}: {
  screen: Screen;
  setScreen: (screen: Screen) => void;
}) {
  const items = [
    { id: "home" as Screen, label: "Home", icon: Home },
    { id: "achievements" as Screen, label: "Conquistas", icon: Trophy },
    { id: "missions" as Screen, label: "Missoes", icon: Target },
    { id: "profile" as Screen, label: "Perfil", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#2a2b2f] bg-[#101012]">
      <div className="mx-auto grid h-20 max-w-md grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon;
          const active = screen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setScreen(item.id)}
              className={`flex flex-col items-center justify-center gap-1 text-xs font-bold ${active ? "text-[#00e676]" : "text-[#d7ded2]"}`}
            >
              <Icon size={26} fill={active ? "currentColor" : "none"} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function Shell({
  screen,
  setScreen,
  children,
  centeredHeader = false,
}: {
  screen: Screen;
  setScreen: (screen: Screen) => void;
  children: React.ReactNode;
  centeredHeader?: boolean;
}) {
  return (
    <main className="min-h-screen bg-[#101012] text-white">
      <Header centered={centeredHeader} />
      <div className="mx-auto max-w-md px-5 pb-28 pt-6">{children}</div>
      <BottomNav screen={screen} setScreen={setScreen} />
    </main>
  );
}

function HomeScreen({
  data,
  setScreen,
}: {
  data: DashboardData;
  setScreen: (screen: Screen) => void;
}) {
  return (
    <Shell screen="home" setScreen={setScreen}>
      <section className="mb-10 rounded-3xl border border-[#353437] bg-[#1c1b1d] p-5">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl bg-[#00e676]/10 p-4 text-[#00e676]">
            <Flame size={34} fill="currentColor" />
          </div>
          <div>
            <p className="text-xl font-black">
              <span className="text-[#00e676]">{data.user.streak}</span> DIAS
              SEGUIDOS
            </p>
            <p className="text-lg font-bold text-[#d7ded2]">
              Mantenha o ritmo!
            </p>
          </div>
        </div>
      </section>

      <h2 className="mb-6 text-4xl font-black uppercase">Ultimos treinos</h2>
      <div className="space-y-5">
        {data.workouts.length === 0 && (
          <p className="rounded-3xl bg-[#1c1b1d] p-8 text-center text-[#bacbb9]">
            Nenhum treino cadastrado ainda.
          </p>
        )}
        {data.workouts.slice(0, 6).map((workout) => (
          <article
            key={workout.id}
            className="flex items-center gap-4 rounded-3xl border-l-4 border-[#00e676] bg-[#1c1b1d] p-5"
          >
            <Avatar user={data.user} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black uppercase text-[#bacbb9]">
                {workout.date}
              </p>
              <p className="text-base font-bold text-white">
                {workout.startTime} - {workout.endTime}
              </p>
              <p className="break-words text-lg font-black uppercase">
                {workout.type} - {workout.detail}
              </p>
            </div>
            <div className="text-center text-[#00e676]">
              <p className="text-xl font-black">+{workout.xp}</p>
              <p className="font-black">XP</p>
              <Zap className="mx-auto mt-1" fill="currentColor" />
            </div>
          </article>
        ))}
      </div>
      <button
        onClick={() => setScreen("workout")}
        className="mx-auto mt-24 flex h-16 w-72 items-center justify-center gap-3 rounded-2xl bg-[#00e676] text-xl font-black uppercase tracking-widest text-[#003318] neon-glow"
      >
        <Plus /> Novo treino
      </button>
    </Shell>
  );
}

function XpChip({ xp }: { xp: number }) {
  return (
    <div className="flex shrink-0 items-center gap-2 rounded-full border border-[#3b3b40] bg-[#242428] px-3 py-2 text-sm font-black text-[#ffdb3c]">
      <Zap size={16} fill="currentColor" />
      <span>{xp.toLocaleString("pt-BR")}</span>
      <span className="text-xs text-[#fff06a]">XP</span>
    </div>
  );
}

function AchievementsScreen({
  data,
  setScreen,
}: {
  data: DashboardData;
  setScreen: (screen: Screen) => void;
}) {
  const [selectedAchievement, setSelectedAchievement] =
    useState<Achievement | null>(null);

  return (
    <Shell screen="achievements" setScreen={setScreen}>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h2 className="min-w-0 text-3xl font-black uppercase leading-none">
          Conquistas
        </h2>
        <XpChip xp={data.user.xp} />
      </div>
      <section className="mb-8 rounded-3xl border border-[#353437] bg-[#1c1b1d] p-6">
        <p className="text-lg font-bold uppercase text-[#d7ded2]">
          Status atual
        </p>
        <h3 className="mt-2 text-3xl font-black text-[#75ff9e]">
          Mestre da Trilha
        </h3>
        <p className="mt-2 text-lg font-bold text-[#d7ded2]">
          {data.user.achievementsCount}/{data.achievements.length} Desafios
          Completos
        </p>
      </section>

      <div className="grid grid-cols-2 gap-5">
        {data.achievements.map((achievement) => (
          <AchievementCard
            key={achievement.id}
            achievement={achievement}
            onSelect={setSelectedAchievement}
          />
        ))}
      </div>
      {selectedAchievement && (
        <AchievementDetail
          achievement={selectedAchievement}
          onClose={() => setSelectedAchievement(null)}
        />
      )}
    </Shell>
  );
}

function MissionsScreen({
  data,
  setScreen,
}: {
  data: DashboardData;
  setScreen: (screen: Screen) => void;
}) {
  const missionIcons = {
    "daily-workout": Dumbbell,
    "time-window": Clock3,
    "daily-km": Route,
    "streak-3": CalendarCheck2,
  };
  const dailyMissions = buildDailyMissions(data.workouts).map((mission) => ({
    ...mission,
    icon: missionIcons[mission.id as keyof typeof missionIcons] || Target,
  }));
  const featuredMissions = [
    {
      icon: Flame,
      title: "Primeiro passo",
      description: "Cadastre seu primeiro treino no FitQuest",
      progress: Math.min(data.workouts.length, 1),
      target: 1,
      reward: 500,
      color: "#00e676",
    },
    {
      icon: Dumbbell,
      title: "Treinamento de heroi",
      description: "Complete 3 treinos de alta intensidade",
      progress: data.workouts.filter(
        (workout) => workout.intensity === "Intenso",
      ).length,
      target: 3,
      reward: 1200,
      color: "#ffdb3c",
    },
  ];

  return (
    <Shell screen="missions" setScreen={setScreen}>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h2 className="min-w-0 text-3xl font-black uppercase leading-none">
          Missoes
        </h2>
        <XpChip xp={data.user.xp} />
      </div>

      <section className="mb-8 space-y-5">
        {featuredMissions.map((mission) => (
          <MissionProgressCard key={mission.title} mission={mission} />
        ))}
      </section>

      <section className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-black uppercase tracking-[0.12em] text-[#d7ded2]">
            Missoes diarias
          </h3>
        </div>
        <div className="space-y-4">
          {dailyMissions.map((mission) => (
            <DailyMissionCard key={mission.title} mission={mission} />
          ))}
        </div>
      </section>
    </Shell>
  );
}

function MissionProgressCard({
  mission,
}: {
  mission: {
    icon: React.ComponentType<{ size?: number; className?: string }>;
    title: string;
    description: string;
    progress: number;
    target: number;
    reward: number;
    color: string;
  };
}) {
  const Icon = mission.icon;
  const cappedProgress = Math.min(mission.progress, mission.target);
  const percent = Math.min(
    100,
    Math.round((cappedProgress / mission.target) * 100),
  );

  return (
    <article className="rounded-3xl border border-[#353437] bg-[#1c1b1d] p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-2xl font-black uppercase leading-tight text-white">
            {mission.title}
          </h3>
          <div className="mt-2 flex items-center gap-2">
            <Icon className="shrink-0 text-[#ffdb3c]" size={24} />
            <p className="text-sm font-bold text-[#d7ded2]">
              {mission.description}
            </p>
          </div>
        </div>
        <div className="shrink-0 rounded-full bg-[#302b17] px-3 py-2 text-center text-xs font-black leading-none text-[#ffdb3c]">
          +{mission.reward}
          <br />
          XP
        </div>
      </div>
      <div className="mb-2 flex items-center justify-between text-xs font-black">
        <span style={{ color: mission.color }}>
          {cappedProgress}/{mission.target}
        </span>
        <span className="text-[#d7ded2]">{percent}%</span>
      </div>
      <div className="h-3 rounded-full bg-[#353437]">
        <div
          className="h-full rounded-full"
          style={{ width: `${percent}%`, backgroundColor: mission.color }}
        />
      </div>
    </article>
  );
}

function DailyMissionCard({
  mission,
}: {
  mission: {
    icon: React.ComponentType<{ size?: number; className?: string }>;
    title: string;
    description: string;
    progress: number;
    target: number;
    reward: number;
    suffix?: string;
  };
}) {
  const Icon = mission.icon;
  const percent = Math.min(
    100,
    Math.round((mission.progress / mission.target) * 100),
  );
  const done = mission.progress >= mission.target;
  const progressLabel = `${Math.min(mission.progress, mission.target).toLocaleString("pt-BR")}/${mission.target.toLocaleString("pt-BR")}${mission.suffix ? ` ${mission.suffix}` : ""}`;

  return (
    <article className="rounded-3xl border border-[#353437] bg-[#1c1b1d] p-4">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#00e676]/10 text-[#00e676]">
          <Icon size={24} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h4 className="truncate text-base font-black uppercase text-white">
                {mission.title}
              </h4>
              <p className="mt-1 text-xs font-bold text-[#d7ded2]">
                {mission.description}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-black text-white">{progressLabel}</p>
              <p className="text-xs font-black text-[#00e676]">
                +{mission.reward} XP
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <div className="h-2 flex-1 rounded-full bg-[#353437]">
              <div
                className="h-full rounded-full bg-[#00e676]"
                style={{ width: `${percent}%` }}
              />
            </div>
            <CheckCircle2
              size={20}
              className={done ? "text-[#00e676]" : "text-[#4c4d52]"}
            />
          </div>
        </div>
      </div>
    </article>
  );
}

function AchievementCard({
  achievement,
  onSelect,
}: {
  achievement: Achievement;
  onSelect: (achievement: Achievement) => void;
}) {
  const percent = Math.min(
    100,
    Math.round((achievement.progress / achievement.target) * 100),
  );
  return (
    <button
      type="button"
      onClick={() => onSelect(achievement)}
      className={`rounded-3xl border border-[#353437] bg-[#1c1b1d] p-5 text-center transition active:scale-[0.98] ${achievement.unlocked ? "" : "opacity-70"}`}
    >
      <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#2a2a2c]">
        {achievement.unlocked ? (
          <Trophy className="text-[#ffdb3c]" size={36} fill="currentColor" />
        ) : (
          <Lock className="text-[#bacbb9]" size={34} />
        )}
      </div>
      <h3 className="mb-5 min-h-12 text-lg font-black uppercase">
        {achievement.title}
      </h3>
      <div className="mb-2 h-2 rounded-full bg-[#353437]">
        <div
          className="h-full rounded-full bg-[#00e676]"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p
        className={
          achievement.unlocked
            ? "text-lg font-black text-[#75ff9e]"
            : "text-lg font-bold text-[#d7ded2]"
        }
      >
        {achievement.label}
      </p>
    </button>
  );
}

function AchievementDetail({
  achievement,
  onClose,
}: {
  achievement: Achievement;
  onClose: () => void;
}) {
  const percent = Math.min(
    100,
    Math.round((achievement.progress / achievement.target) * 100),
  );
  const progress = Math.min(achievement.progress, achievement.target);

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/70 px-4 pb-4">
      <section className="mx-auto w-full max-w-md rounded-3xl border border-[#353437] bg-[#1c1b1d] p-5 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#00e676]">
              Detalhe da conquista
            </p>
            <h3 className="mt-2 text-2xl font-black uppercase leading-tight">
              {achievement.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2a2a2c] text-[#d7ded2]"
            aria-label="Fechar"
          >
            <X size={22} />
          </button>
        </div>
        <p className="text-base font-bold leading-relaxed text-[#d7ded2]">
          {achievement.description}
        </p>
        <div className="mt-5 rounded-2xl bg-[#141416] p-4">
          <div className="mb-2 flex items-center justify-between text-sm font-black">
            <span className="text-[#75ff9e]">
              {progress}/{achievement.target}
            </span>
            <span className="text-[#d7ded2]">{percent}%</span>
          </div>
          <div className="h-3 rounded-full bg-[#353437]">
            <div
              className="h-full rounded-full bg-[#00e676]"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="mt-3 text-sm font-black uppercase text-[#ffdb3c]">
            {achievement.unlocked ? "Conquista completa" : achievement.label}
          </p>
        </div>
      </section>
    </div>
  );
}

function WorkoutScreen({
  data,
  applyData,
  setScreen,
}: {
  data: DashboardData;
  applyData: (data: DashboardData) => void;
  setScreen: (screen: Screen) => void;
}) {
  const [type, setType] = useState("");
  const [detail, setDetail] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [intensity, setIntensity] = useState<Intensity>("Moderado");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const workoutTypes = [
    "Corrida",
    "Caminhada",
    "Musculacao",
    "Luta",
    "Bike",
    "Natacao",
    "Yoga",
    "HIIT",
    "Crossfit",
    "Outro",
  ];
  const detailByType: Record<
    string,
    { label: string; placeholder: string; inputType?: string }
  > = {
    Corrida: {
      label: "Quantos km correu?",
      placeholder: "Ex: 5",
      inputType: "number",
    },
    Caminhada: {
      label: "Quantos km caminhou?",
      placeholder: "Ex: 3",
      inputType: "number",
    },
    Musculacao: { label: "Grupo muscular", placeholder: "Ex: Peito/triceps" },
    Luta: {
      label: "Arte marcial",
      placeholder: "Ex: Jiu-jitsu, Muay Thai, Boxe",
    },
    Bike: {
      label: "Quantos km pedalou?",
      placeholder: "Ex: 12",
      inputType: "number",
    },
    Natacao: { label: "Distancia nadada", placeholder: "Ex: 800 metros" },
    Yoga: { label: "Tipo de pratica", placeholder: "Ex: Hatha, Vinyasa" },
    HIIT: { label: "Foco do treino", placeholder: "Ex: Cardio, corpo inteiro" },
    Crossfit: { label: "WOD/treino", placeholder: "Ex: Fran, Metcon" },
    Outro: { label: "Detalhe do treino", placeholder: "Descreva o treino" },
  };
  const detailConfig = detailByType[type] || {
    label: "Detalhe",
    placeholder: "Escolha um tipo de treino primeiro",
  };

  const updateType = (value: string) => {
    setType(value);
    setDetail("");
  };

  const save = async () => {
    try {
      setError("");
      setLoading(true);
      const result = await api<WorkoutResponse>("/api/workouts", {
        method: "POST",
        body: JSON.stringify({
          type,
          detail,
          date,
          startTime,
          endTime,
          intensity,
        }),
      });
      applyData(result);
      setType("");
      setDetail("");
      setStartTime("");
      setEndTime("");
      setScreen("home");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao cadastrar treino.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Shell screen="workout" setScreen={setScreen}>
      <div className="mb-6 flex items-start gap-4">
        <Logo small />
        <h2 className="text-4xl font-black uppercase text-[#75ff9e]">
          Cadastrar novo treino
        </h2>
      </div>
      <section className="rounded-3xl bg-[#19191c] p-6 shadow-2xl">
        <div className="mb-8 flex justify-center">
          <Avatar user={data.user} />
        </div>
        <div className="space-y-5">
          <SelectField
            label="Tipo de treino"
            value={type}
            onChange={updateType}
            options={workoutTypes}
          />
          <Field
            label={detailConfig.label}
            value={detail}
            onChange={setDetail}
            type={detailConfig.inputType || "text"}
            placeholder={detailConfig.placeholder}
          />
          <Field
            label="Data do treino"
            value={date}
            onChange={setDate}
            type="date"
          />
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Inicio"
              value={startTime}
              onChange={setStartTime}
              type="time"
              compact
            />
            <Field
              label="Termino"
              value={endTime}
              onChange={setEndTime}
              type="time"
              compact
            />
          </div>
          <div>
            <p className="mb-3 ml-2 text-sm font-black uppercase tracking-[0.14em] text-[#d7ded2]">
              Nivel de intensidade
            </p>
            <div className="grid grid-cols-3 gap-3">
              {(["Leve", "Moderado", "Intenso"] as const).map((item) => (
                <button
                  key={item}
                  onClick={() => setIntensity(item)}
                  className={`h-16 rounded-2xl text-lg font-black ${intensity === item ? "border border-[#00e676] bg-[#1f2222] text-[#00e676]" : "bg-[#2a2a2c] text-white"}`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          {error && (
            <p className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
              {error}
            </p>
          )}
          <Button onClick={save} disabled={loading}>
            {loading ? "SALVANDO..." : "CADASTRAR TREINO"}
          </Button>
        </div>
      </section>
    </Shell>
  );
}

function ProfileScreen({
  data,
  applyData,
  logout,
  setScreen,
}: {
  data: DashboardData;
  applyData: (data: DashboardData) => void;
  logout: () => void;
  setScreen: (screen: Screen) => void;
}) {
  const [name, setName] = useState(data.user.name);
  const [phone, setPhone] = useState(data.user.phone);
  const [bio, setBio] = useState(data.user.bio);
  const [avatarData, setAvatarData] = useState(data.user.avatarData);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const percent = Math.min(
    100,
    Math.round((data.user.xp / data.user.maxXp) * 100),
  );

  const onFile = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatarData(String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  const save = async () => {
    try {
      setError("");
      setSaved(false);
      const updated = await api<DashboardData>("/api/me", {
        method: "PATCH",
        body: JSON.stringify({ name, phone, bio, avatarData }),
      });
      applyData(updated);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar perfil.");
    }
  };

  return (
    <Shell screen="profile" setScreen={setScreen} centeredHeader>
      <section className="text-center">
        <label className="relative mx-auto block w-36 cursor-pointer">
          <Avatar user={{ ...data.user, avatarData }} />
          <input
            className="hidden"
            type="file"
            accept="image/*"
            onChange={(event) => onFile(event.target.files?.[0])}
          />
          <span className="absolute bottom-2 right-0 flex h-12 w-12 items-center justify-center rounded-full bg-[#00e676] text-[#003318]">
            <Edit2 size={22} />
          </span>
        </label>
        <h2 className="mt-6 text-4xl font-black uppercase text-[#75ff9e]">
          {data.user.name}
        </h2>
        <p className="text-lg font-black text-[#00e676]">
          {data.user.username}
        </p>
      </section>

      <section className="my-8">
        <div className="mb-2 flex justify-between text-sm font-black uppercase tracking-widest text-[#d7ded2]">
          <span>Level {data.user.level}</span>
          <span>
            {data.user.xp.toLocaleString("pt-BR")} /{" "}
            {data.user.maxXp.toLocaleString("pt-BR")} XP
          </span>
        </div>
        <div className="h-3 rounded-full bg-[#353437]">
          <div
            className="h-full rounded-full bg-[#00e676]"
            style={{ width: `${percent}%` }}
          />
        </div>
      </section>

      <div className="space-y-5">
        <Field label="Nome" value={name} onChange={setName} />
        <Field
          label="Phone"
          value={phone}
          onChange={setPhone}
          placeholder="+55..."
        />
        <label className="block space-y-2">
          <span className="ml-2 text-sm font-black uppercase tracking-[0.14em] text-[#d7ded2]">
            Bio
          </span>
          <textarea
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            className="min-h-32 w-full rounded-2xl border border-[#3b4740] bg-[#1b1b1d] p-5 text-lg font-bold text-white outline-none focus:border-[#00e676]"
          />
        </label>
        {error && (
          <p className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
            {error}
          </p>
        )}
        {saved && (
          <p className="rounded-2xl border border-[#00e676]/30 bg-[#00e676]/10 p-4 text-sm text-[#75ff9e]">
            Perfil salvo no banco.
          </p>
        )}
        <Button onClick={save}>SALVAR PERFIL</Button>
        <Button onClick={logout} danger>
          <LogOut /> SAIR
        </Button>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-5">
        <div className="rounded-3xl border-l-4 border-[#00e676] bg-[#1c1b1d] p-6">
          <p className="font-black uppercase tracking-widest text-[#d7ded2]">
            Conquistas
          </p>
          <p className="mt-5 text-5xl font-black">
            {data.user.achievementsCount}
          </p>
        </div>
        <div className="rounded-3xl border-l-4 border-[#00e676] bg-[#1c1b1d] p-6">
          <p className="font-black uppercase tracking-widest text-[#d7ded2]">
            Dias de treino
          </p>
          <p className="mt-5 text-4xl font-black">{data.user.totalWorkouts}</p>
          <p className="mt-2 text-[#00e676]">{data.user.streak} em sequencia</p>
        </div>
      </div>
    </Shell>
  );
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("login");
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token()) {
      setLoading(false);
      return;
    }

    api<DashboardData>("/api/me")
      .then((next) => {
        setData(next);
        setScreen("home");
      })
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const onUnauthorized = () => {
      setData(null);
      setScreen("login");
    };
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  const logout = async () => {
    await api("/api/auth/logout", { method: "POST" }).catch(() => null);
    clearToken();
    setData(null);
    setScreen("login");
  };

  const totalXp = useMemo(
    () => data?.workouts.reduce((sum, workout) => sum + workout.xp, 0) || 0,
    [data],
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#101012] text-[#00e676]">
        <Zap className="animate-pulse" size={52} fill="currentColor" />
      </div>
    );
  }

  if (!data) {
    return (
      <AuthScreen
        mode={screen === "register" ? "register" : "login"}
        onMode={setScreen}
        onLogin={(next) => {
          setData(next);
          setScreen("home");
        }}
      />
    );
  }

  const syncedData = {
    ...data,
    user: { ...data.user, xp: Math.max(data.user.xp, totalXp) },
  };

  if (screen === "achievements")
    return <AchievementsScreen data={syncedData} setScreen={setScreen} />;
  if (screen === "missions")
    return <MissionsScreen data={syncedData} setScreen={setScreen} />;
  if (screen === "workout")
    return (
      <WorkoutScreen
        data={syncedData}
        applyData={setData}
        setScreen={setScreen}
      />
    );
  if (screen === "profile")
    return (
      <ProfileScreen
        data={syncedData}
        applyData={setData}
        logout={logout}
        setScreen={setScreen}
      />
    );
  return <HomeScreen data={syncedData} setScreen={setScreen} />;
}
