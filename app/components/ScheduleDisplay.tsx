import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next'; // <--- Import do hook
import { Text, View } from 'react-native';

interface ScheduleProps {
  horario: {
    diasUteis: string;
    sabado: string;
    domingo: string;
    feriado: string;
    [key: string]: string;
  };
  theme: any;
}

export const ScheduleDisplay: React.FC<ScheduleProps> = ({ horario, theme }) => {
  const { t } = useTranslation();

  // --- HELPERS ---
  const getScheduleLabel = (key: string) => {
    switch (key) {
      case 'diasUteis': return t('schedule.days.weekdays');
      case 'sabado': return t('schedule.days.saturday');
      case 'domingo': return t('schedule.days.sunday');
      case 'feriado': return t('schedule.days.holiday');
      default: return key;
    }
  };

  const getTodayKey = () => {
    const day = new Date().getDay(); // 0 = Domingo, 1-5 = Seg-Sex, 6 = Sábado
    if (day === 0) return 'domingo';
    if (day === 6) return 'sabado';
    return 'diasUteis';
  };

  // Helper para traduzir strings específicas que vêm do backend normalizado
  const translateBackendString = (str: string) => {
    if (str === 'Indisponível') return t('schedule.status.unavailable');
    if (str === 'Fechado') return t('schedule.status.closed');
    if (str === '24 Horas') return t('schedule.status.open24h');
    // Se for um horário "08:00 - 20:00", devolve como está
    return str.replace(/-/g, ' - ');
  };

  // --- LÓGICA DE ESTADO (ABERTO/FECHADO) ---
  const getStatus = (timeString: string) => {
    if (!timeString || timeString === 'Indisponível') return null;
    
    const upperTime = timeString.toUpperCase();

    // Casos estáticos
    if (upperTime === 'FECHADO' || timeString === '00:00-00:00') {
        return { label: t('schedule.status.closed'), color: '#ef4444', icon: 'lock-closed' as const };
    }
    if (upperTime.includes('24 HORAS') || timeString === '00:00-24:00' || timeString === '00:00-23:59') {
        return { label: t('schedule.status.open24h'), color: '#22c55e', icon: 'time' as const };
    }

    // Regex para validar formato HH:MM
    const parts = timeString.split(/\s*-\s*/);
    
    if (parts.length !== 2) return null;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [startH, startM] = parts[0].split(':').map(Number);
    const [endH, endM] = parts[1].split(':').map(Number);

    if (isNaN(startH) || isNaN(endH)) return null;

    const startTotal = startH * 60 + startM;
    let endTotal = endH * 60 + endM;

    // Ajuste para horários pós-meia-noite
    if (endTotal < startTotal) {
      endTotal += 24 * 60;
    }

    const diff = endTotal - currentMinutes;

    // Verificar se está dentro do intervalo
    if (currentMinutes >= startTotal && currentMinutes < endTotal) {
      if (diff <= 60) {
        return { 
          label: t('schedule.status.closingSoon', { count: diff }), // "Fecha em X min"
          color: '#f59e0b', 
          icon: 'hourglass' as const 
        };
      }
      return { 
        label: t('schedule.status.open'), // "Aberto agora"
        color: '#22c55e', 
        icon: 'checkmark-circle' as const 
      };
    }

    return { 
      label: t('schedule.status.closed'), // "Fechado"
      color: '#ef4444', 
      icon: 'close-circle' as const 
    };
  };

  const todayKey = getTodayKey();
  const orderedKeys = ['diasUteis', 'sabado', 'domingo', 'feriado'];

  const currentStatus = useMemo(() => {
    if (!horario) return null;
    const todaySchedule = horario[todayKey];
    return getStatus(todaySchedule);
  }, [horario, todayKey, t]); // Adicionar 't' às dependências

  // --- RENDER ---

  if (!horario) {
    return (
      <View className="flex-row items-center mt-4 pt-4 border-t" style={{ borderColor: theme.border }}>
        <Ionicons name="time-outline" size={18} color={theme.textSecondary} />
        <Text className="ml-2 text-sm" style={{ color: theme.textSecondary }}>
          {t('schedule.status.noInfo')}
        </Text>
      </View>
    );
  }

  // Verifica se todos são indisponíveis para mostrar erro genérico
  const isAllND = orderedKeys.every(key => !horario[key] || horario[key] === 'N/D' || horario[key] === 'Indisponível');

  if (isAllND) {
    return (
      <View className="mt-4 pt-4 border-t" style={{ borderColor: theme.border }}>
        <View className="flex-row items-center">
          <Ionicons name="time-outline" size={18} color={theme.textSecondary} />
          <Text className="ml-2 text-sm" style={{ color: theme.textSecondary }}>
            {t('schedule.status.sourceError')}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="mt-4 pt-4 border-t" style={{ borderColor: theme.border }}>
      
      {/* --- HEADER COM STATUS BADGE --- */}
      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-row items-center">
          <Ionicons name="time" size={18} color={theme.text} />
          <Text className="ml-2 font-bold text-base" style={{ color: theme.text }}>
            {t('schedule.title')}
          </Text>
        </View>

        {/* BADGE VISUAL */}
        {currentStatus && (
          <View 
            className="flex-row items-center px-3 py-1 rounded-full"
            style={{ 
              backgroundColor: `${currentStatus.color}15`, 
              borderWidth: 1,
              borderColor: `${currentStatus.color}40`
            }}
          >
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: currentStatus.color, marginRight: 6 }} />
            <Text style={{ color: currentStatus.color, fontWeight: '700', fontSize: 12 }}>
              {currentStatus.label}
            </Text>
          </View>
        )}
      </View>
      
      {/* --- LISTA DE DIAS --- */}
      <View className="pl-1">
        {orderedKeys.map((key) => {
          const rawTimeString = horario[key] || 'Indisponível';
          const isToday = key === todayKey;

          // Traduz a string do backend para a língua do user (ex: "Fechado" -> "Closed")
          const displayString = translateBackendString(rawTimeString);

          return (
            <View key={key} className="flex-row justify-between mb-2 items-center">
              <Text 
                style={{ 
                  color: isToday ? theme.text : theme.textSecondary, 
                  fontWeight: isToday ? '700' : '400',
                  fontSize: 13
                }}
              >
                {getScheduleLabel(key)}
              </Text>
              <Text 
                style={{ 
                  color: isToday ? theme.text : theme.textSecondary,
                  fontWeight: isToday ? '700' : '400',
                  fontSize: 13,
                  opacity: isToday ? 1 : 0.8
                }}
              >
                {displayString}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};