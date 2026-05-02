const PLACES_API_BASE = 'https://places.googleapis.com/v1';
const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

interface PlacePhoto {
  name: string;            // bijv. "places/ChIJ.../photos/AXCi..."
  widthPx: number;
  heightPx: number;
}

interface PlaceDetailsResult {
  photos?: PlacePhoto[];
  displayName?: { text: string };
  formattedAddress?: string;
}

/**
 * Haal place details op via Places API (New).
 * Vraagt alleen de 'photos' field op — geen onnodige data.
 */
export async function fetchPlaceDetails(placeId: string): Promise<PlaceDetailsResult | null> {
  if (!API_KEY || !placeId) return null;
  try {
    const res = await fetch(
      `${PLACES_API_BASE}/places/${placeId}?fields=photos,displayName,formattedAddress`,
      {
        headers: {
          'X-Goog-Api-Key': API_KEY,
          'X-Goog-FieldMask': 'photos,displayName,formattedAddress'
        }
      }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Bouw de foto-URL op vanuit een photo resource name.
 * maxWidthPx=800 is voldoende voor spot cards (w-64 à w-72).
 */
export function buildPhotoUrl(photoName: string, maxWidthPx = 800): string {
  if (!API_KEY || !photoName) return '';
  return `${PLACES_API_BASE}/${photoName}/media?maxWidthPx=${maxWidthPx}&key=${API_KEY}`;
}

/**
 * Haal de eerste foto-URL op voor een place_id.
 * Geeft null terug als er geen foto beschikbaar is.
 */
export async function fetchFirstPlacePhoto(placeId: string): Promise<string | null> {
  const details = await fetchPlaceDetails(placeId);
  const firstPhoto = details?.photos?.[0];
  if (!firstPhoto?.name) return null;
  return buildPhotoUrl(firstPhoto.name, 400);
}
