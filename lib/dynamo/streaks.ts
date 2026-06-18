import { getProofsByHandle } from "./proofs";

// Допоміжна функція для безпечного отримання дати в форматі YYYY-MM-DD
function getLocalDateString(date: Date): string {
  return date.toISOString().substring(0, 10);
}

export async function getCurrentStreak(handle: string): Promise<number> {
  const proofs = await getProofsByHandle(handle);
  if (proofs.length === 0) return 0;

  // Отримуємо унікальні дати з сортуванням від найновішої до найстарішої (дедуплікація)
  const dates = proofs
    .map((p) => p.sk.split("#")[1])
    .filter((value, index, self) => value && self.indexOf(value) === index);

  if (dates.length === 0) return 0;

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const todayStr = getLocalDateString(today);
  const yesterdayStr = getLocalDateString(yesterday);

  // Стрік активний, тільки якщо останній звіт був надісланий СЬОГОДНІ або ВЧОРА.
  // Якщо останній звіт старіший за вчора — стрік перервано (broken).
  const newestDateStr = dates[0];
  if (newestDateStr !== todayStr && newestDateStr !== yesterdayStr) {
    return 0;
  }

  let streak = 0;
  // Ініціалізуємо очікувану дату як дату найновішого звіту
  let currentDate = new Date(newestDateStr);

  for (let i = 0; i < dates.length; i++) {
    const checkDateStr = dates[i];

    // Якщо це перший елемент або дата збігається з очікуваною (currentDate)
    if (i === 0 || getLocalDateString(currentDate) === checkDateStr) {
      streak++;
      // Зсуваємо очікувану дату на 1 день назад
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      // Виявлено розрив більше ніж в 1 день — зупиняємо підрахунок стріку
      break;
    }
  }

  return streak;
}

export async function getTotalProofScore(handle: string): Promise<number> {
  const proofs = await getProofsByHandle(handle);
  // Сумуємо ai_score всіх валідних звітів
  return proofs.reduce((sum, p) => sum + (p.ai_score || 0), 0);
}
