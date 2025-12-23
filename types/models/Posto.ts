/**
 * Posto interface defining the structure of a gas station object.
 */
export interface Posto {
  id: string;
  nome: string;
  marca: string;
  morada: {
    morada: string;
    localidade: string;
  };
  localizacao: {
    coordinates: [number, number];
  };
  horario: {
    diasUteis: string;
    sabado: string;
    domingo: string;
    feriado: string;
    [key: string]: string; 
  };
  combustiveis: Array<{
    tipo: string;
    preco: number;
  }>;
  ultimaAtualizacao: string;
  distancia?: number;
}

export default Posto; 