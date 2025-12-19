export const SORT_OPTIONS_LIST = [
  'mais_caro',
  'mais_barato',
  'mais_longe',
  'mais_perto'
] as const;

// 2. O Tipo Principal (Gera 'mais_caro' | 'mais_barato' | ...)
export type PostoSortOption = typeof SORT_OPTIONS_LIST[number];

// O Tipo Apenas Preço (Usa índices 0 e 1)
export type PriceSortOption = typeof SORT_OPTIONS_LIST[0] | typeof SORT_OPTIONS_LIST[1];