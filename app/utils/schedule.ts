interface Horario {
  [key: string]: {
    abertura: string;
    fecho: string;
  };
}

export const isStationOpen = (horario: Horario): boolean => {
  if (!horario) return false;
  
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
  if (!schedule || !schedule.abertura || !schedule.fecho) return false;

  // Parse the schedule
  const openTime = schedule.abertura.split(':').map(Number);
  const closeTime = schedule.fecho.split(':').map(Number);
  const openMinutes = openTime[0] * 60 + openTime[1];
  const closeMinutes = closeTime[0] * 60 + closeTime[1];

  // Check if current time is within opening hours
  return currentTime >= openMinutes && currentTime < closeMinutes;
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

  const openTime = schedule.abertura.split(':').map(Number);
  const closeTime = schedule.fecho.split(':').map(Number);
  const openMinutes = openTime[0] * 60 + openTime[1];
  const closeMinutes = closeTime[0] * 60 + closeTime[1];

  // If we're before opening time today, return today's opening time
  if (currentTime < openMinutes) {
    return schedule.abertura;
  }

  // If we're after closing time, return tomorrow's opening time
  const tomorrowKey = currentDay === 6 ? 'domingo' : 
                     currentDay === 0 ? 'diasUteis' : 
                     currentDay === 5 ? 'sabado' : 
                     'diasUteis';
  
  const tomorrowSchedule = horario[tomorrowKey];
  return tomorrowSchedule?.abertura || null;
}; 