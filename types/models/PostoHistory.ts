export interface HistoryEntry {
  preco: number;
  data: string; // ISO Date string vinda do backend
}

// Representa a resposta agrupada: { "Gasóleo Simples": [...], "Gasolina 95": [...] }
export interface StationHistoryResponse {
  [fuelType: string]: HistoryEntry[];
}