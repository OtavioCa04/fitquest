import type { Achievement, WorkoutRow } from "./server-types";

type WorkoutLike = Pick<
  WorkoutRow,
  "date" | "type" | "detail" | "intensity"
> & {
  start_time?: string;
  startTime?: string;
};

export type DailyMission = {
  id: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  reward: number;
  suffix?: string;
  completed: boolean;
};

export function formatDate(value: string | Date) {
  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  return String(value).slice(0, 10);
}

export function formatTime(value: string) {
  return String(value).slice(0, 5);
}

function workoutStartTime(workout: WorkoutLike) {
  return formatTime(workout.start_time || workout.startTime || "");
}

export function workoutKm(workout: Pick<WorkoutLike, "type" | "detail">) {
  if (!/corrida|caminh|bike|cicl/i.test(workout.type)) return 0;
  const match = workout.detail.match(/\d+(?:[.,]\d+)?/);
  return match ? Number(match[0].replace(",", ".")) : 0;
}

export function totalWorkoutKm(
  workouts: Pick<WorkoutLike, "type" | "detail">[],
) {
  return workouts.reduce((sum, workout) => sum + workoutKm(workout), 0);
}

export function calculateStreak(workouts: WorkoutRow[]) {
  const dates = new Set(workouts.map((workout) => formatDate(workout.date)));
  let cursor = new Date();
  let streak = 0;

  for (let i = 0; i < 365; i += 1) {
    const key = cursor.toISOString().slice(0, 10);
    if (!dates.has(key)) {
      if (streak === 0) {
        cursor.setDate(cursor.getDate() - 1);
        continue;
      }
      break;
    }
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export function countTrainingDays(workouts: WorkoutRow[]) {
  return new Set(workouts.map((workout) => formatDate(workout.date))).size;
}

export function buildDailyMissions(
  workouts: WorkoutLike[],
  date = formatDate(new Date()),
): DailyMission[] {
  const todayWorkouts = workouts.filter(
    (workout) => formatDate(workout.date) === date,
  );
  const totalKm = totalWorkoutKm(todayWorkouts);
  const trainedEarlyToday = todayWorkouts.some(
    (workout) => Number(workoutStartTime(workout).slice(0, 2)) < 8,
  );
  const trainedAfter18Today = todayWorkouts.some(
    (workout) => Number(workoutStartTime(workout).slice(0, 2)) >= 18,
  );
  const streak = calculateStreak(workouts as WorkoutRow[]);

  const missions = [
    {
      id: "daily-workout",
      title: "Treino do dia",
      description: "Cadastre 1 treino hoje",
      progress: todayWorkouts.length,
      target: 1,
      reward: 120,
    },
    {
      id: "time-window",
      title: "Horario marcado",
      description: "Treine antes das 08:00 ou depois das 18:00",
      progress: trainedEarlyToday || trainedAfter18Today ? 1 : 0,
      target: 1,
      reward: 90,
    },
    {
      id: "daily-km",
      title: "Km acumulado",
      description: "Some 5 km em corrida, caminhada ou bike",
      progress: Math.min(totalKm, 5),
      target: 5,
      reward: 150,
      suffix: "km",
    },
    {
      id: "streak-3",
      title: "Ritmo constante",
      description: "Mantenha 3 dias em sequencia",
      progress: streak,
      target: 3,
      reward: 180,
    },
  ];

  return missions.map((mission) => ({
    ...mission,
    completed: mission.progress >= mission.target,
  }));
}

export function buildAchievements(
  workouts: WorkoutRow[],
  xp: number,
): Achievement[] {
  const total = workouts.length;
  const intense = workouts.filter(
    (workout) => workout.intensity === "Intenso",
  ).length;
  const morning = new Set(
    workouts
      .filter(
        (workout) => Number(formatTime(workout.start_time).slice(0, 2)) < 8,
      )
      .map((workout) => formatDate(workout.date)),
  ).size;
  const streak = calculateStreak(workouts);
  const uniqueTypes = new Set(
    workouts.map((workout) => workout.type.toLowerCase().trim()),
  ).size;
  const totalKm = totalWorkoutKm(workouts);

  const items = [
    {
      id: "kms",
      title: "KMS ANDADOS",
      progress: totalKm,
      target: 100,
      unit: "KM",
      description: "Some quilometros em treinos de corrida, caminhada ou bike.",
    },
    {
      id: "morning",
      title: "MADRUGADOR",
      progress: morning,
      target: 20,
      unit: "Dias",
      description: "Treine antes das 08:00 para contar progresso.",
    },
    {
      id: "streak",
      title: "INABALAVEL",
      progress: streak,
      target: 7,
      unit: "Dias",
      description: "Mantenha uma sequencia de dias com treinos.",
    },
    {
      id: "cycle",
      title: "CICLO COMPLETO",
      progress: uniqueTypes,
      target: 7,
      unit: "Tipos",
      description: "Cadastre treinos de modalidades diferentes.",
    },
    {
      id: "power",
      title: "FORCA BRUTA",
      progress: intense,
      target: 10,
      unit: "Treinos",
      description: "Complete treinos intensos.",
    },
    {
      id: "xp",
      title: "EXPLORADOR",
      progress: xp,
      target: 1000,
      unit: "XP",
      description: "Ganhe XP registrando atividades.",
    },
    {
      id: "first",
      title: "PRIMEIRO TREINO",
      progress: total,
      target: 1,
      unit: "Treino",
      description: "Cadastre seu primeiro treino.",
    },
  ];

  return items.map((item) => {
    const progress = Math.min(item.progress, item.target);
    const unlocked = progress >= item.target;
    return {
      id: item.id,
      title: item.title,
      progress,
      target: item.target,
      label: unlocked ? "COMPLETO!" : `${progress}/${item.target} ${item.unit}`,
      description: item.description,
      unlocked,
    };
  });
}
