import { Ionicons } from '@expo/vector-icons';
import { format, parseISO, subDays } from 'date-fns';
// Importar os locales para formatar a data do gráfico (pt e en)
import { enUS, pt } from 'date-fns/locale';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Dimensions, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { SafeAreaView } from 'react-native-safe-area-context';

// --- Imports Internos ---
import { StationHistoryResponse } from '@/types/models/PostoHistory';
import { Posto } from '../../types/models/Posto';
import { ScheduleDisplay } from '../components/ScheduleDisplay';
import { useAppContext } from '../context/AppContext';
import { StationService } from '../network/postoService';
import { getBrandImage } from '../utils/brandImages';

const { width } = Dimensions.get('window');

type TimeRange = 7 | 30 | 90;

export default function StationDetailScreen() {
  const router = useRouter();
  const { id, stationData } = useLocalSearchParams();
  const { theme, language } = useAppContext();
  const { t } = useTranslation();

  // Parse seguro do objeto posto
  const station: Posto | null = useMemo(() => {
    try {
      return stationData ? JSON.parse(stationData as string) : null;
    } catch (e) {
      return null;
    }
  }, [stationData]);

  const [history, setHistory] = useState<StationHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState<TimeRange>(30);
  const [chartFuel, setChartFuel] = useState<string>('');

  // Define o combustível inicial quando a estação carrega
  useEffect(() => {
    if (station?.combustiveis?.[0]?.tipo) {
      setChartFuel(station.combustiveis[0].tipo);
    }
  }, [station]);

  // Define o Locale do date-fns com base na língua da app
  const dateLocale = useMemo(() => {
    return language === 'en' ? enUS : pt;
  }, [language]);

  // Busca o histórico
  useEffect(() => {
    const fetchHistory = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const data = await StationService.getHistory(Number(id), 90);
        setHistory(data);
      } catch (error) {
        console.error("Erro ao carregar histórico", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [id]);

  // Lógica do Gráfico
  const chartData = useMemo(() => {
    if (!history || !chartFuel || !history[chartFuel]) return [];

    const cutoffDate = subDays(new Date(), selectedRange);
    
    // Ordenar cronologicamente
    const sortedHistory = [...history[chartFuel]].sort((a, b) => 
      new Date(a.data).getTime() - new Date(b.data).getTime()
    );

    return sortedHistory
      .filter(entry => new Date(entry.data) >= cutoffDate)
      .map(entry => {
        // Formato da data no eixo X:
        // 7 dias: "Seg", "Ter" (usa o locale pt ou en)
        // >7 dias: "23/12"
        const dateFormat = selectedRange === 7 ? 'EEE' : 'dd/MM';

        return {
          value: entry.preco,
          label: format(parseISO(entry.data), dateFormat, { locale: dateLocale }),
          dataPointText: entry.preco.toString(),
          showDataPoint: true,
          dataPointColor: theme.primary,
          dataPointRadius: 4,
        };
      });
  }, [history, chartFuel, selectedRange, theme, dateLocale]);

  const { minY, maxY } = useMemo(() => {
    if (chartData.length === 0) return { minY: 0, maxY: 2 };
    const prices = chartData.map(d => d.value);
    return {
      minY: Math.min(...prices) - 0.05,
      maxY: Math.max(...prices) + 0.05
    };
  }, [chartData]);

  // Helper para obter label dos botões de tempo traduzida
  const getTimeRangeLabel = (days: number) => {
    if (days === 7) return t('time.days', { count: 7, defaultValue: '7 Dias' });
    if (days === 30) return t('time.days', { count: 30, defaultValue: '30 Dias' });
    if (days === 90) return t('time.months', { count: 3, defaultValue: '3 Meses' });
    return `${days}`;
  };

  if (!station) {
    return (
      <View style={{flex:1, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-2 mb-2">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text className="text-lg font-bold ml-2 flex-1" style={{ color: theme.text }}>
          {t('station.detailsTitle')}
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* --- INFO CARD --- */}
        <View className="mx-4 p-5 rounded-3xl mb-6 shadow-sm" style={{ backgroundColor: theme.card }}>
          
          {/* Marca e Nome */}
          <View className="flex-row items-center">
            <Image 
              source={getBrandImage(station.marca)} 
              style={{ width: 50, height: 50 }} 
              resizeMode="contain" 
            />
            <View className="ml-4 flex-1">
              <Text className="text-xl font-bold" style={{ color: theme.text }}>{station.nome}</Text>
              <Text style={{ color: theme.textSecondary, fontWeight: '500' }}>{station.marca}</Text>
            </View>
          </View>

          {/* Morada */}
          <View className="mt-5 mb-1">
            <View className="flex-row items-start">
              <Ionicons name="location" size={18} color={theme.primary} style={{ marginTop: 2 }} />
              <Text className="ml-2 flex-1 text-sm leading-5" style={{ color: theme.text }}>
                {station.morada.morada}, {station.morada.localidade}
              </Text>
            </View>
          </View>

          {/* COMPONENTE DE HORÁRIO (Já trata das traduções internamente se necessário, ou passamos props) */}
          <ScheduleDisplay horario={station.horario} theme={theme} />
          
        </View>

        {/* --- GRÁFICO --- */}
        <View className="mx-4 mb-6">
          <Text className="text-lg font-bold mb-4 ml-1" style={{ color: theme.text }}>
            {t('station.priceHistory')}
          </Text>

          {/* Filtro de Combustível */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4 pl-1">
            {station.combustiveis.map((c) => (
              <TouchableOpacity
                key={c.tipo}
                onPress={() => setChartFuel(c.tipo)}
                className="mr-2 px-4 py-2 rounded-full border"
                style={{
                  backgroundColor: chartFuel === c.tipo ? theme.primary : 'transparent',
                  borderColor: chartFuel === c.tipo ? theme.primary : theme.border,
                }}
              >
                {/* Nota: O nome do combustível vem da API (ex: "Gasóleo Simples"). 
                   Se quiseres traduzir isto, terás de criar um mapper de chaves. 
                   Por enquanto, mostramos o que vem da API.
                */}
                <Text style={{ 
                  color: chartFuel === c.tipo ? '#fff' : theme.text,
                  fontWeight: chartFuel === c.tipo ? 'bold' : 'normal' 
                }}>
                  {c.tipo}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Área do Gráfico */}
          <View 
            className="p-4 rounded-3xl items-center justify-center min-h-[250px] shadow-sm" 
            style={{ backgroundColor: theme.card }}
          >
            {loading ? (
              <ActivityIndicator color={theme.primary} />
            ) : chartData.length > 0 ? (
              <LineChart
                data={chartData}
                height={200}
                width={width - 80}
                color={theme.primary}
                thickness={3}
                dataPointsColor={theme.primary}
                textColor={theme.textSecondary}
                yAxisTextStyle={{ color: theme.textSecondary, fontSize: 10 }}
                xAxisLabelTextStyle={{ color: theme.textSecondary, fontSize: 10 }}
                hideRules
                yAxisOffset={minY}
                maxValue={maxY}
                noOfSections={4}
                isAnimated
                curved
                startFillColor={theme.primary}
                endFillColor={theme.primary}
                startOpacity={0.2}
                endOpacity={0.0}
                areaChart
              />
            ) : (
              <Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 10 }}>
                {t('station.noHistoryData')}
              </Text>
            )}
          </View>

          {/* Seletor de Tempo */}
          <View className="flex-row justify-between mt-4 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 shadow-sm" style={{ backgroundColor: theme.card }}>
            {[7, 30, 90].map((days) => {
              const isActive = selectedRange === days;
              
              return (
                <TouchableOpacity
                  key={days}
                  onPress={() => setSelectedRange(days as TimeRange)}
                  className="flex-1 items-center py-2.5 rounded-lg"
                  style={{ backgroundColor: isActive ? theme.primary : 'transparent' }}
                >
                  <Text style={{ 
                    color: isActive ? '#fff' : theme.textSecondary,
                    fontWeight: isActive ? 'bold' : '500',
                    fontSize: 13
                  }}>
                    {getTimeRangeLabel(days)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}