interface Horario {
  [key: string]: string | {
    abertura: string;
    fecho: string;
  };
}

export const isStationOpen = (horario: Horario): boolean => {
  if (!horario) return false;
  
  // Check if any day has "Aberto 24 horas"
  for (const day in horario) {
    const schedule = horario[day];
    if (typeof schedule === 'string' && schedule === "Aberto 24 horas") {
      return true;
    }
  }
  
  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sunday, 1-5 = Weekdays, 6 = Saturday
  const currentTime = now.getHours() * 60 + now.getMinutes(); // Convert to minutes for easier comparison

  // Get the schedule for the current day
  let dayKey: string;
  if (currentDay === 0) { // Sunday
    dayKey = 'domingo';
  } else if (currentDay === 6) { // Saturday
    dayKey = 'sabado';
  } else { // Weekdays
    dayKey = 'diasUteis';
  }

  const schedule = horario[dayKey];
  if (!schedule) return false;

  // Handle string format (e.g., "07:00-23:00")
  if (typeof schedule === 'string') {
    const [openTime, closeTime] = schedule.split('-');
    if (!openTime || !closeTime) return false;

    const [openHour, openMinute] = openTime.split(':').map(Number);
    const [closeHour, closeMinute] = closeTime.split(':').map(Number);
    
    const openMinutes = openHour * 60 + openMinute;
    const closeMinutes = closeHour * 60 + closeMinute;

    // Handle 24-hour schedules (e.g., 22:00-06:00)
    if (closeMinutes < openMinutes) {
      return currentTime >= openMinutes || currentTime < closeMinutes;
    }

    // Normal schedule (same day)
    return currentTime >= openMinutes && currentTime < closeMinutes;
  }

  // Handle object format (e.g., { abertura: "07:00", fecho: "23:00" })
  if (typeof schedule === 'object' && 'abertura' in schedule && 'fecho' in schedule) {
    const scheduleObj = schedule as { abertura: string; fecho: string };
    const [openHour, openMinute] = scheduleObj.abertura.split(':').map(Number);
    const [closeHour, closeMinute] = scheduleObj.fecho.split(':').map(Number);
    
    const openMinutes = openHour * 60 + openMinute;
    const closeMinutes = closeHour * 60 + closeMinute;

    // Handle 24-hour schedules (e.g., 22:00-06:00)
    if (closeMinutes < openMinutes) {
      return currentTime >= openMinutes || currentTime < closeMinutes;
    }

    // Normal schedule (same day)
    return currentTime >= openMinutes && currentTime < closeMinutes;
  }

  return false;
};

export const getNextOpeningTime = (horario: Horario): string | null => {
  const now = new Date();
  const currentDay = now.getDay();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  // Get today's schedule
  let dayKey: string;
  if (currentDay === 0) {
    dayKey = 'domingo';
  } else if (currentDay === 6) {
    dayKey = 'sabado';
  } else {
    dayKey = 'diasUteis';
  }

  const schedule = horario[dayKey];
  if (!schedule) return null;

  if (typeof schedule === 'string') {
    const [openTime] = schedule.split('-');
    return openTime;
  }

  const scheduleObj = schedule as { abertura: string; fecho: string };
  const openTime = scheduleObj.abertura.split(':').map(Number);
  const closeTime = scheduleObj.fecho.split(':').map(Number);
  const openMinutes = openTime[0] * 60 + openTime[1];
  const closeMinutes = closeTime[0] * 60 + closeTime[1];

  // If we're before opening time today, return today's opening time
  if (currentTime < openMinutes) {
    return scheduleObj.abertura;
  }

  // If we're after closing time, return tomorrow's opening time
  const tomorrowKey = currentDay === 6 ? 'domingo' : 
                     currentDay === 0 ? 'diasUteis' : 
                     currentDay === 5 ? 'sabado' : 
                     'diasUteis';
  
  const tomorrowSchedule = horario[tomorrowKey];
  if (!tomorrowSchedule) return null;

  if (typeof tomorrowSchedule === 'string') {
    const [openTime] = tomorrowSchedule.split('-');
    return openTime;
  }

  return (tomorrowSchedule as { abertura: string; fecho: string }).abertura;
};

const scheduleUtils = {
  isStationOpen,
  getNextOpeningTime,
};

export default scheduleUtils; 