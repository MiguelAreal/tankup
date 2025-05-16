/**
 * Fetch stations by location.
 * @param district District name
 * @param county County name
 * @param fuelType fuel type filter
 * @returns Promise with stations data
 */
export async function fetchStationsByLocation<T>(
    district: string,
    county: string,
    fuelType: string,
    options?: RequestInit
): Promise<T> {
    const url = `/api/stations?district=${encodeURIComponent(district)}&county=${encodeURIComponent(county)}&fuelType=${encodeURIComponent(fuelType)}`;
    const response = await fetch(url, options);
    if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
    }
    return response.json();
}

/**
 * Fetch nearby stations by latitude, longitude, and fuel type.
 * @param lat Latitude
 * @param lng Longitude
 * @param fuelType Selected fuel type
 * @returns Promise with stations data
 */
export async function fetchNearbyStations<T>(
    lat: number,
    lng: number,
    fuelType: string,
    options?: RequestInit
): Promise<T> {
    const url = `/api/stations/nearby?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}&fuelType=${encodeURIComponent(fuelType)}`;
    const response = await fetch(url, options);
    if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
    }
    return response.json();
}
