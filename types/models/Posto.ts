export interface Posto {
  id: string;
  nome: string;
  marca: string;
  morada: {
    morada: string;
    localidade: string;
  };
  localizacao: {
    coordinates: [number, number]; // [longitude, latitude]
  };
  horario: {
    [key: string]: {
      abertura: string;
      fecho: string;
    };
  };
  combustiveis: Array<{
    tipo: string;
    preco: number;
  }>;
  ultimaAtualizacao: string;
  distancia?: number;
}

export default Posto; 