import React, { createContext, useCallback, useContext, useState } from 'react';
import { Posto } from '../../types/models';

type SearchState = {
  results: Posto[];
  searchType: 'location' | 'nearby';
  distrito?: string;
  municipio?: string;
  fuelType: string;
  sortBy: 'mais_caro' | 'mais_barato';
  radius?: number;
} | null;

type SearchContextType = {
  searchState: SearchState;
  setSearchState: (state: SearchState) => void;
  clearSearch: () => void;
  isSearchActive: boolean;
};

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const SearchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [searchState, setSearchState] = useState<SearchState>(null);

  const clearSearch = useCallback(() => {
    setSearchState(null);
  }, []);

  const isSearchActive = searchState !== null;

  return (
    <SearchContext.Provider
      value={{
        searchState,
        setSearchState,
        clearSearch,
        isSearchActive,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}; 