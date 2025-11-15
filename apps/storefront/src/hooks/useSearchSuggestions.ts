import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export interface SearchSuggestion {
  id: string;
  name: string;
  slug: string;
  thumbnail?: string;
  price: number;
  category?: string;
}

export function useSearchSuggestions(query: string, categoryId?: string, enabled: boolean = true) {
  return useQuery<SearchSuggestion[]>({
    queryKey: ['search-suggestions', query, categoryId],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      
      const response = await api.get('/products', {
        params: {
          search: query,
          categoryId: categoryId || undefined,
          limit: 5,
          isActive: true,
        },
      });
      
      return response.data.data.data.map((product: any) => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        thumbnail: product.thumbnail || product.images?.[0],
        price: product.price,
        category: product.categories?.name,
      }));
    },
    enabled: enabled && query.length >= 2,
    staleTime: 30000, // Cache for 30 seconds
  });
}

