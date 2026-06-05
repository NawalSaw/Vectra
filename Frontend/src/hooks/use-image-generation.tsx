import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL, API_ENDPOINTS } from '@/lib/api-config';
import type {
  ImageGenerationRequest,
  ImageGenerationResponse,
  SVGConversionResponse,
  HealthCheckResponse,
  ApiError,
} from '@/lib/api-types';
import { VectorizeOptions } from '@/lib/vectorize';

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

export function makePayload(request: ImageGenerationRequest) {
  console.log(request.model);
  if (request.model === 'flux') {
    console.log('Using flux model');
    return {
      "prompt": request.prompt,
      "model": request.model,
      "steps": request.steps,
      "clerk_user_id": request.clerk_user_id
    };
  } else {
    return {
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
    "clerk_user_id": request.clerk_user_id,
  };
  }
}

/**
 * Hook for generating images
 */
export function useImageGeneration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: ImageGenerationRequest): Promise<ImageGenerationResponse> => {
      console.log(request);
      return apiRequest<ImageGenerationResponse>(
        API_ENDPOINTS.GENERATE_IMAGE,
        {
          method: 'POST',
          body: JSON.stringify(request),
        }
      );
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

// helper fn
function makeSVGConversionPayload(options: VectorizeOptions) {
  const formData = new FormData();
  formData.append("clerk_user_id", options.clerk_user_id);
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

export function useSVGConversion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (options: VectorizeOptions): Promise<SVGConversionResponse> => {
      const url = `${API_BASE_URL}${API_ENDPOINTS.CONVERT_TO_SVG}`;
      const payload = makeSVGConversionPayload(options);
      const response = await fetch(url, {
        method: 'POST',
        body: payload,
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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (url: string) => {
      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.CLEANUP_FILE}?cloudinary_url=${encodeURIComponent(url)}`,
        {
          method: "DELETE",
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

/**
 * Combined hook for all image generation operations
 * Provides a single hook with all methods for convenience
 */
export function useImageGenerationAPI() {
  const generateImage = useImageGeneration();
  const convertToSVG = useSVGConversion();
  const healthCheck = useHealthCheck();
  const cleanupFile = useFileCleanup();

  return {
    // Methods
    generateImage: generateImage.mutateAsync,
    convertToSVG: convertToSVG.mutateAsync,
    cleanupFile: cleanupFile.mutateAsync,
    
    // States
    isGenerating: generateImage.isPending,
    isConverting: convertToSVG.isPending,
    isCleaning: cleanupFile.isPending,
    
    // Errors
    generationError: generateImage.error,
    conversionError: convertToSVG.error,
    cleanupError: cleanupFile.error,
    
    // Reset functions
    resetGeneration: generateImage.reset,
    resetConversion: convertToSVG.reset,
    resetCleanup: cleanupFile.reset,
  };
}

export function useGetSVGConversions(
  userId: string,
  PAGE: number,
  LIMIT: number,
  filters: SVGConversionsQuery = {}
) {
  return useQuery({
  queryKey: [
    "svg_conversions",
    userId,
    PAGE,
    LIMIT,
    filters,
  ],

  enabled: !!userId,

  queryFn: async () => {
    const params = new URLSearchParams({
      clerk_user_id: userId!,

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
      `${API_BASE_URL}${API_ENDPOINTS.GET_SVG_CONVERSIONS}?${params.toString()}`
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
  userId: string,
  PAGE: number,
  LIMIT: number,
  filters: GeneratedImagesQuery = {}
) {
  return useQuery({
    queryKey: [
      "image_generations",
      userId,
      PAGE,
      LIMIT,
      filters,
    ],
  
    enabled: !!userId,
  
    queryFn: async () => {
      const params = new URLSearchParams({
        clerk_user_id: userId!,
  
        page: PAGE.toString(),
        limit: LIMIT.toString(),
  
        sort_by: filters.sort_by || "created_at",
        sort_order: filters.sort_order || "desc",
      });

      if (filters.search) params.set("search", filters.search);
      if (filters.model) params.set("model", filters.model);
  
      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.GET_GENERATED_IMAGES}?${params.toString()}`
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

export function useCleanup(cleanupFile: (cloudinaryUrl: string) => Promise<{ success: boolean }>, userId: string, PAGE: number, LIMIT: number) {
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
            userId,
            PAGE,
            LIMIT,
          ]);

      const previousConversions =
        queryClient.getQueryData<any>([
          "svg_conversions",
          userId,
          PAGE,
          LIMIT,
        ]);

      // GENERATED IMAGES

      queryClient.setQueryData(
        [
          "generated_images",
          userId,
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
          userId,
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
          userId,
          PAGE,
          LIMIT,
        ],
        context?.previousImages
      );

      queryClient.setQueryData(
        [
          "svg_conversions",
          userId,
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
          userId,
          PAGE,
          LIMIT,
        ],
      });

      queryClient.invalidateQueries({
        queryKey: [
          "svg_conversions",
          userId,
          PAGE,
          LIMIT,
        ],
      });
    },
  });
}
