import React from 'react';
import { Linking, Platform, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Props {
  type: 'maintenance' | 'update';
  message?: string;
}

// URLs das lojas (Preenche com os teus links reais)
const STORE_URLS = {
  ios: 'https://apps.apple.com/pt/app/teu-id',
  android: 'https://play.google.com/store/apps/details?id=teu.id',
  web: '/' // Na web apenas recarregamos
};

export const AppBlockingScreen: React.FC<Props> = ({ type, message }) => {
  const title = type === 'maintenance' ? 'Em Manutenção' : 'Atualização Necessária';
  
  const defaultMsg = type === 'maintenance' 
    ? 'Estamos a realizar melhorias. Voltamos em breve!' 
    : Platform.OS === 'web' 
      ? 'É necessário recarregar a página para obter a versão mais recente.'
      : 'Existe uma nova versão disponível que é necessária para continuar.';

  const handleUpdatePress = () => {
    if (Platform.OS === 'web') {
      // Força o reload da página na Web
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    } else {
      // Abre a loja no Mobile
      const url = Platform.OS === 'ios' ? STORE_URLS.ios : STORE_URLS.android;
      Linking.openURL(url);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <View style={{ maxWidth: 500, alignItems: 'center' }}>
        <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' }}>
          {title}
        </Text>
        
        <Text style={{ color: '#ccc', fontSize: 16, textAlign: 'center', marginBottom: 32 }}>
          {message || defaultMsg}
        </Text>

        {type === 'update' && (
          <TouchableOpacity 
            onPress={handleUpdatePress}
            style={{ backgroundColor: '#EF4444', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 }}
          >
            <Text style={{ color: 'white', fontWeight: 'bold' }}>
              {Platform.OS === 'web' ? 'Recarregar Página' : 'Atualizar Agora'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};