// Import all brand images
export const brandImages = {
  'galp': require('../assets/brands/galp.webp'),
  'cepsa': require('../assets/brands/cepsa.webp'),
  'bp': require('../assets/brands/bp.webp'),
  'prio': require('../assets/brands/prio.webp'),
  'repsol': require('../assets/brands/repsol.webp'),
  'shell': require('../assets/brands/shell.webp'),
  'q8': require('../assets/brands/q8.webp'),
  'intermarché': require('../assets/brands/intermarché.webp'),
  'lecrerc': require('../assets/brands/lecrerc.webp'),
  'pingodoce': require('../assets/brands/pingodoce.webp'),
  'petroalva': require('../assets/brands/petroalva.webp'),
  'petroibérica': require('../assets/brands/petroibérica.webp'),
  'petrin': require('../assets/brands/petrin.webp'),
  'petrovariante': require('../assets/brands/petrovariante.webp'),
  'petrovaz': require('../assets/brands/petrovaz.webp'),
  'plenergy': require('../assets/brands/plenergy.webp'),
  'pronto': require('../assets/brands/pronto.webp'),
  'redil': require('../assets/brands/redil.webp'),
  'recheio': require('../assets/brands/recheio.webp'),
  'tuacar': require('../assets/brands/tuacar.webp'),
  'valcarce': require('../assets/brands/valcarce.webp'),
  'alves bandeira': require('../assets/brands/alvesbandeira.webp'),
  'azoria': require('../assets/brands/azoria.webp'),
  'beq': require('../assets/brands/beq.webp'),
  'bombagás': require('../assets/brands/bombagás.webp'),
  'bxpress': require('../assets/brands/bxpress.webp'),
  'creixoauto': require('../assets/brands/creixoauto.webp'),
  'gapor': require('../assets/brands/gapor.webp'),
  'ilídio mota': require('../assets/brands/ilídio mota.webp'),
  'moeve': require('../assets/brands/moeve.webp'),
  'oz energia': require('../assets/brands/oz energia.webp'),
} as const;

export const getBrandImage = (brandName: string | undefined) => {
  if (!brandName) return require('../assets/brands/placeholder.webp');
  return brandImages[brandName.toLowerCase() as keyof typeof brandImages] || require('../assets/brands/placeholder.webp');
}; 