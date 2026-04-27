import { collection, doc, writeBatch, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { CityProfile, Spot } from '../types';

const BATCH_SIZE = 400;

export const seedCollection = async (collectionName: string, items: any[], onProgress?: (msg: string) => void) => {
  if (!items || items.length === 0) {
    onProgress?.(`Geen items voor ${collectionName}`);
    return;
  }

  onProgress?.(`Seeding ${items.length} items naar ${collectionName}...`);
  
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const chunk = items.slice(i, i + BATCH_SIZE);
    onProgress?.(`Verwerken chunk ${Math.floor(i / BATCH_SIZE) + 1} (${chunk.length} items)...`);
    const batch = writeBatch(db);
    
    chunk.forEach(item => {
      const id = item.id || item.slug || (item.name ? item.name.toLowerCase().replace(/ /g, '-') : Math.random().toString(36).substring(7));
      const ref = doc(db, collectionName, id);
      batch.set(ref, {
        ...item,
        id,
        isPublished: true,
        updatedAt: new Date().toISOString(),
        createdAt: item.createdAt || new Date().toISOString()
      }, { merge: true });
    });
    
    await batch.commit();
  }
};

export const runFullSeed = async (onProgress?: (msg: string) => void) => {
  try {
    onProgress?.('Starting full seed...');
    
    onProgress?.('Chunks laden (Cities)...');
    const cities1 = (await import('../data/cities/cities_chunk_1.json')).default;
    const cities2 = (await import('../data/cities/cities_chunk_2.json')).default;
    const cities3 = (await import('../data/cities/cities_chunk_3.json')).default;
    const cities4 = (await import('../data/cities/cities_chunk_4.json')).default;
    
    const allCities = [...cities1, ...cities2, ...cities3, ...cities4];
    await seedCollection('cities', allCities, onProgress);
    
    onProgress?.('Chunks laden (Spots)...');
    let allSpots: any[] = [];
    try {
      const spots1 = (await import('../data/spots/spots_chunk_1.json')).default;
      const spots2 = (await import('../data/spots/spots_chunk_2.json')).default;
      const spots3 = (await import('../data/spots/spots_chunk_3.json')).default;
      const spots4 = (await import('../data/spots/spots_chunk_4.json')).default;
      allSpots = [...spots1, ...spots2, ...spots3, ...spots4];
      await seedCollection('spots', allSpots, onProgress);
    } catch (e) {
      console.warn('Error loading spots chunks:', e);
      onProgress?.('Waarschuwing: Spots chunks niet gevonden of leeg.');
    }
    
    return { success: true, citiesSeeded: allCities.length, spotsSeeded: allSpots.length };
  } catch (error) {
    console.error('Seed failed:', error);
    throw error;
  }
};
