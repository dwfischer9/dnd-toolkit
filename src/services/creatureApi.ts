import Creature, { DetailedCreature, ApiCreature } from '../types/creature'

// API response types
export interface CreatureSearchResult {
  index: string
  name: string
  url: string
}

export interface CreatureSearchResponse {
  count: number
  results: CreatureSearchResult[]
}

export const creatureApi = {
  async searchCreatures(query: string): Promise<CreatureSearchResponse> {
    try {
      console.log('Searching creatures with query:', query);
      // Use our local API route to avoid CORS issues
      const response = await fetch(`/api/creatures?q=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Search response:', data);

      return data;
    } catch (error) {
      console.error('Error in searchCreatures:', error);
      throw error;
    }
  },

  async getCreatureDetails(index: string): Promise<ApiCreature> {
    try {
      console.log('Fetching creature details for:', index);
      const response = await fetch(`/api/creatures/${index}`);
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      console.log('Creature details:', data);
      return data;
    } catch (error) {
      console.error('Error fetching creature details:', error);
      throw error;
    }
  },

  convertApiCreatureToCreature(apiCreature: ApiCreature): Creature {
    // Validate required fields
    if (!apiCreature.name) {
      throw new Error('Creature name is required');
    }

    // Extract AC value - handle both array and number formats
    let acValue = 10; // default
    if (Array.isArray(apiCreature.armor_class)) {
      acValue = apiCreature.armor_class[0]?.value || 10;
    } else if (typeof apiCreature.armor_class === 'number') {
      acValue = apiCreature.armor_class;
    }

    return {
      id: apiCreature.index || Math.random().toString(36).substr(2, 9),
      name: apiCreature.name,
      ac: acValue,
      maxHp: apiCreature.hit_points || 1,
      currentHp: apiCreature.hit_points || 1,
      initiative: 0, // Will be rolled when added
      isPlayer: false,
      image: apiCreature.image
    }
  }
};
