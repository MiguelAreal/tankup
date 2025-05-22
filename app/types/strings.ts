export interface Strings {
  station: {
    loading: string;
    distance: string;
    notAvailable: string;
    goodPrice: string;
    openInMaps: string;
    openInWaze: string;
    openInAppleMaps: string;
    openInGoogleMaps: string;
    cheapestNearby: string;
    noStationsFound: string;
    locationRequired: string;
    useSearch: string;
    open: string;
    closed: string;
    opensAt: string;
    sortBy: {
      mais_barato: string;
      mais_caro: string;
      mais_perto: string;
      mais_longe: string;
    };
    fuelType: {
      [key: string]: string;
    };
  };
  search: {
    title: string;
    placeholder: string;
    selectDistrict: string;
    district: string;
    municipality: string;
    fuelType: string;
    sortBy: string;
    search: string;
    clear: string;
  };
  settings: {
    title: string;
    darkMode: string;
    mapProvider: string;
    about: string;
    language: string;
    favorites: string;
    save: string;
    cancel: string;
    select: string;
    navigationApp: string;
    searchRadius: string;
    fuelType: string;
    logout: string;
    version: string;
    developer: string;
    provider: string;
    privacy: string;
    terms: string;
    aboutText: string;
  };
  favorites: {
    title: string;
    empty: string;
    addHint: string;
  };
} 