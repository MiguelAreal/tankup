import { PostoSortOption, PriceSortOption } from "@/types/models/PostoSortOption";

/**
 * Parameters for searching stations by user location
 */
export interface NearbySearchParams {
  lat: number;
  lng: number;
  radius: number;
  fuelType: string;
  sortBy: PostoSortOption;
}

/**
 * Parameters for searching stations by specific location
 */
export interface LocationSearchParams {
  distrito?: string;
  municipio?: string;
  fuelType?: string;
  sortBy?: PriceSortOption;
  radius?: number;
}
