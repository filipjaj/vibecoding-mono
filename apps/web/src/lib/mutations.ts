import {
  useMutation,
  useQueryClient,
  type QueryKey,
  type MutationFunction,
} from "@tanstack/react-query";

/** Options for `useOptimisticMutation` — consumer only needs `onMutate`. */
type OptimisticOptions<TData, TVariables> = {
  /** The query key(s) to cancel / snapshot / invalidate. */
  queryKey: QueryKey;
  /** The actual API call. */
  mutationFn: MutationFunction<TData, TVariables>;
  /** Write the optimistic value into the cache. Return nothing — rollback is automatic. */
  onMutate: (variables: TVariables, queryClient: ReturnType<typeof useQueryClient>) => void;
  /** Extra keys to invalidate on settle (e.g. a list + a detail). */
  extraInvalidate?: QueryKey[];
  /** Called after successful mutation with server response. */
  onSuccess?: (data: TData) => void;
};

/**
 * Generic optimistic‑update wrapper around `useMutation`.
 * Handles cancel → snapshot → optimistic write → rollback → invalidate.
 */
export function useOptimisticMutation<TData = unknown, TVariables = void>({
  queryKey,
  mutationFn,
  onMutate,
  extraInvalidate,
  onSuccess,
}: OptimisticOptions<TData, TVariables>) {
  const queryClient = useQueryClient();

  return useMutation<TData, Error, TVariables, { previous: unknown }>({
    mutationFn,
    async onMutate(variables) {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);
      onMutate(variables, queryClient);
      return { previous };
    },
    onError(_err, _vars, context) {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled() {
      queryClient.invalidateQueries({ queryKey });
      extraInvalidate?.forEach((key) =>
        queryClient.invalidateQueries({ queryKey: key }),
      );
    },
    onSuccess: onSuccess ? (data) => onSuccess(data) : undefined,
  });
}
