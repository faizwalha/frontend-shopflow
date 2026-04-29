import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';

export interface AddressSuggestion {
  street: string;
  city: string;
  postalCode: string;
  country: string;
  displayName: string;
}

@Injectable({
  providedIn: 'root'
})
export class AddressAutocompleteService {
  private http = inject(HttpClient);
  private apiUrl = 'https://photon.komoot.io/api/';

  private countriesNowUrl = 'https://countriesnow.space/api/v0.1/countries';

  getCountriesList(): Observable<string[]> {
    return this.http.get<any>(this.countriesNowUrl).pipe(
      map(res => res.data.map((c: any) => c.country).sort())
    );
  }

  getCitiesByCountry(country: string): Observable<string[]> {
    if (!country) return of([]);
    return this.http.post<any>(`${this.countriesNowUrl}/cities`, { country }).pipe(
      map(res => res.data.sort()),
      // Fallback if country not found or error
      catchError(() => of([]))
    );
  }

  private overpassUrl = 'https://overpass-api.de/api/interpreter';

  getStreetsByCity(country: string, city: string): Observable<string[]> {
    if (!country || !city) return of([]);
    
    // Overpass QL query to get all street names in a city
    const query = `[out:json][timeout:25];
      area["name"="${country}"]->.country;
      area["name"="${city}"](area.country)->.city;
      way["highway"]["name"](area.city);
      out tags;`;

    return this.http.get<any>(`${this.overpassUrl}?data=${encodeURIComponent(query)}`).pipe(
      map(res => {
        const streets = res.elements
          .map((e: any) => e.tags.name)
          .filter((name: any) => !!name);
        return Array.from(new Set(streets)).sort() as string[];
      }),
      catchError(() => {
        // Fallback to Photon if Overpass fails or is too slow
        return this.searchStreet('', country, city).pipe(
          map(suggestions => suggestions.map(s => s.street).filter(Boolean))
        );
      })
    );
  }

  searchStreet(query: string, country: string, city: string): Observable<AddressSuggestion[]> {
    const fullQuery = `${query ? query + ', ' : ''}${city}, ${country}`;
    return this.http.get<any>(`${this.apiUrl}?q=${encodeURIComponent(fullQuery)}&limit=10`).pipe(
      map(response => {
        return response.features.map((feature: any) => {
          const p = feature.properties;
          return {
            street: [p.housenumber, p.street || p.name].filter(Boolean).join(' '),
            city: p.city || p.town || p.village || city,
            postalCode: p.postcode || '',
            country: p.country || country,
            displayName: p.name || p.street || query
          };
        });
      })
    );
  }
}
