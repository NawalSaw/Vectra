import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL, API_ENDPOINTS } from '@/lib/api-config';
import type {
  ImageGenerationRequest,
  ImageGenerationResponse,
  SVGConversionResponse,
  HealthCheckResponse,
  ApiError,
} from '@/lib/api-types';
import type { VectorizeOptions } from '@/lib/vectorize';
import { useAuth } from '@clerk/tanstack-react-start';

export type SortOrder = "asc" | "desc";

export type GeneratedImagesQuery = {
  search?: string;
  model?: string;
  sort_by?: "created_at" | "width" | "height" | "size_bytes" | "model";
  sort_order?: SortOrder;
};

export type SVGConversionsQuery = {
  search?: string;
  colormode?: string;
  mode?: string;
  hierarchical?: string;
  sort_by?:
    | "created_at"
    | "original_filename"
    | "original_size_bytes"
    | "svg_size_bytes"
    | "color_precision"
    | "path_precision";
  sort_order?: SortOrder;
};

/**
 * Custom hook for image generation API operations
 * Provides methods for generating images, converting to SVG, and file management
 */

// Base API client
async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorData: ApiError = await response.json().catch(() => ({
      message: 'An error occurred',
      status: response.status,
    }));
    throw new Error(errorData.message || 'API request failed');
  }

  return response.json();
}

// helper fn
export function makePayload(request: ImageGenerationRequest) {
  console.log(request.model);
  if (request.model === 'flux') {
    console.log('Using flux model');
    return {
      "prompt": request.prompt,
      "model": request.model,
      "steps": request.steps,
      "request_id": Math.random().toString(36).slice(2),
    };
  } else {
    return {
    "request_id": Math.random().toString(36).slice(2),
    "prompt": request.prompt,
    "model": request.model,
    "negative_prompt": request.negative_prompt,
    "width": request.width,
    "height": request.height,
    "num_steps": request.num_steps,
    "guidance": request.guidance,
    "strength": request.strength,
    "seed": request.seed,
    "image_b64": request.image_b64,
  };
  }
}
export function makeSVGConversionPayload(options: VectorizeOptions) {
  const formData = new FormData();
  formData.append("file", options.file);
  formData.append("colormode", options.colormode);
  formData.append("hierarchical", options.hierarchical);
  formData.append("mode", options.mode);

  formData.append(
    "filter_speckle",
    options.filter_speckle.toString()
  );

  formData.append(
    "color_precision",
    options.color_precision.toString()
  );

  formData.append(
    "layer_difference",
    options.layer_difference.toString()
  );

  formData.append(
    "corner_threshold",
    options.corner_threshold.toString()
  );

  formData.append(
    "length_threshold",
    options.length_threshold.toString()
  );

  formData.append(
    "max_iterations",
    options.max_iterations.toString()
  );

  formData.append(
    "splice_threshold",
    options.splice_threshold.toString()
  );

  formData.append(
    "path_precision",
    options.path_precision.toString()
  );

  return formData;
}

/**
 * Hook for generating images
 */
export function useImageGeneration() {
  const { getToken } = useAuth();

  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (request: ImageGenerationRequest): Promise<ImageGenerationResponse> => {
      const token = await getToken();
      const payload = makePayload(request)
      const url = `${API_BASE_URL}${API_ENDPOINTS.GENERATE_IMAGE}`
      console.log(JSON.stringify(payload))
      const response = await fetch(
        url,
        {
          method: 'POST',
          body: JSON.stringify(payload),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      return response.json();
    },
    onSuccess: () => {
      // Invalidate related queries if needed
      queryClient.invalidateQueries({ queryKey: ['image-generation'] });
    },
  });
}

/**
 * Hook for converting images to SVG
 */

export function useSVGConversion() {
  const { getToken } = useAuth();
  
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (options: VectorizeOptions): Promise<SVGConversionResponse> => {
      const url = `${API_BASE_URL}${API_ENDPOINTS.CONVERT_TO_SVG}`;
      const token = await getToken();
      const payload = makeSVGConversionPayload(options);
      const response = await fetch(url, {
        method: 'POST',
        body: payload,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json().catch(() => ({
          message: 'SVG conversion failed',
          status: response.status,
        }));
        throw new Error(errorData.message || 'SVG conversion failed');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['svg-conversion'] });
    },
  });
}

/**
 * Hook for checking API health
 */
export function useHealthCheck(enabled = true) {
  return useQuery({
    queryKey: ['health-check'],
    queryFn: async (): Promise<HealthCheckResponse> => {
      return apiRequest<HealthCheckResponse>(API_ENDPOINTS.HEALTH_CHECK);
    },
    enabled,
  });
}

/**
 * Hook for cleaning up files
 */
export function useFileCleanup() {
  const { getToken } = useAuth();
  
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (url: string) => {
      const token = await getToken();
      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.CLEANUP_FILE}?cloudinary_url=${encodeURIComponent(url)}`,
        {
          method: "DELETE",
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      
      if (!response.ok) {
        throw new Error('File cleanup failed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['file-cleanup'] });
    },
  });
}

export function useGetSVGConversions(
  PAGE: number,
  LIMIT: number,
  filters: SVGConversionsQuery = {}
) {
  const { getToken } = useAuth();
  
  return useQuery({
  queryKey: [
    "svg_conversions",
    PAGE,
    LIMIT,
    filters,
  ],

  enabled: true,

  queryFn: async () => {
    const params = new URLSearchParams({
      page: PAGE.toString(),
      limit: LIMIT.toString(),

      sort_by: filters.sort_by || "created_at",
      sort_order: filters.sort_order || "desc",
    });

    if (filters.search) params.set("search", filters.search);
    if (filters.colormode) params.set("colormode", filters.colormode);
    if (filters.mode) params.set("mode", filters.mode);
    if (filters.hierarchical) params.set("hierarchical", filters.hierarchical);

    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.GET_SVG_CONVERSIONS}?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${await getToken()}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        "Failed to fetch conversions"
      );
    }

    return response.json();
  },

  staleTime: 1000 * 60 * 5,
});

}

export function useGetImageGenerations(
  PAGE: number,
  LIMIT: number,
  filters: GeneratedImagesQuery = {}
) {
  const { getToken } = useAuth();
  
  return useQuery({
    queryKey: [
      "image_generations",
      PAGE,
      LIMIT,
      filters,
    ],
  
    enabled: true,
  
    queryFn: async () => {
      const params = new URLSearchParams({
        page: PAGE.toString(),
        limit: LIMIT.toString(),
  
        sort_by: filters.sort_by || "created_at",
        sort_order: filters.sort_order || "desc",
      });

      if (filters.search) params.set("search", filters.search);
      if (filters.model) params.set("model", filters.model);
  
      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.GET_GENERATED_IMAGES}?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${await getToken()}`,
          },
        }
      );
  
      if (!response.ok) {
        throw new Error(
          "Failed to fetch generations"
        );
      }
  
      return response.json();
    },
  
    staleTime: 1000 * 60 * 5,
  });
}

export function useCleanup(cleanupFile: (cloudinaryUrl: string) => Promise<{ success: boolean }>, PAGE: number, LIMIT: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      cloudinaryUrl: string
    ) => {
      // Backend already deletes:
      // - Cloudinary
      // - generated_images
      // - svg_conversions

      const result =
        await cleanupFile(cloudinaryUrl);

      if (!result.success) {
        throw new Error(
          "Cleanup failed"
        );
      }

      return cloudinaryUrl;
    },

    /* -----------------------------------------
    * OPTIMISTIC UPDATE
    * ---------------------------------------*/

    onMutate: async (
      cloudinaryUrl
    ) => {
      await Promise.all([
        queryClient.cancelQueries({
          queryKey: [
            "generated_images",
          ],
        }),

        queryClient.cancelQueries({
          queryKey: [
            "svg_conversions",
          ],
        }),
      ]);

      const previousImages =
        queryClient.getQueryData<any>([
            "generated_images",
            PAGE,
            LIMIT,
          ]);

      const previousConversions =
        queryClient.getQueryData<any>([
          "svg_conversions",
          PAGE,
          LIMIT,
        ]);

      // GENERATED IMAGES

      queryClient.setQueryData(
        [
          "generated_images",
          PAGE,
          LIMIT,
        ],

        (old: any) => ({
          ...old,

          data:
            old?.data?.filter(
              (img: any) =>
                img.cloudinary_url !==
                cloudinaryUrl
            ) || [],

          pagination: {
            ...old?.pagination,

            total: Math.max(
              0,
              (old?.pagination?.total ||
                1) - 1
            ),
          },
        })
      );

      // SVG CONVERSIONS

      queryClient.setQueryData(
        [
          "svg_conversions",
          PAGE,
          LIMIT,
        ],

        (old: any) => ({
          ...old,

          data:
            old?.data?.filter(
              (conv: any) =>
                conv.cloudinary_url !==
                cloudinaryUrl
            ) || [],

          pagination: {
            ...old?.pagination,

            total: Math.max(
              0,
              (old?.pagination?.total ||
                1) - 1
            ),
          },
        })
      );

      return {
        previousImages,
        previousConversions,
      };
    },

    /* -----------------------------------------
    * ROLLBACK
    * ---------------------------------------*/

    onError: (
      _err,
      _url,
      context
    ) => {
      queryClient.setQueryData(
        [
          "generated_images",
          PAGE,
          LIMIT,
        ],
        context?.previousImages
      );

      queryClient.setQueryData(
        [
          "svg_conversions",
          PAGE,
          LIMIT,
        ],
        context?.previousConversions
      );
    },

    /* -----------------------------------------
    * REVALIDATE
    * ---------------------------------------*/

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: [
          "generated_images",
          PAGE,
          LIMIT,
        ],
      });

      queryClient.invalidateQueries({
        queryKey: [
          "svg_conversions",
          PAGE,
          LIMIT,
        ],
      });
    },
  });
}
