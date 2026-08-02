import {
  MutationObserver,
  QueryObserver,
  type MutationObserverOptions,
  type QueryKey,
  type QueryObserverOptions,
  type QueryObserverResult,
} from '@tanstack/query-core';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { useSyncExternalStore } from 'preact/compat';
import { queryClient } from './client';

export interface QueryOptions<TData> {
  queryKey: QueryKey;
  queryFn: () => Promise<TData>;
  enabled?: boolean;
  staleTime?: number;
}

/**
 * Hook `useQuery` estilo TanStack para Preact.
 * Usa @tanstack/query-core + useSyncExternalStore (sin necesidad de react).
 */
export function useQuery<TData>(options: QueryOptions<TData>): QueryObserverResult<TData, Error> {
  const optsRef = useRef<QueryObserverOptions<TData, Error, TData, TData>>();
  optsRef.current = options;

  const [observer] = useState(
    () => new QueryObserver<TData, Error, TData, TData>(queryClient, options),
  );

  useEffect(() => {
    observer.setOptions(options);
  }, [observer, options]);

  const subscribe = useCallback(
    (onStoreChange: () => void) => observer.subscribe(onStoreChange),
    [observer],
  );
  const getSnapshot = useCallback(() => observer.getCurrentResult(), [observer]);

  return useSyncExternalStore(subscribe, getSnapshot);
}

export interface MutationOptions<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: unknown, variables: TVariables) => void;
}

export function useMutation<TData = unknown, TVariables = void>(
  options: MutationOptions<TData, TVariables>,
) {
  const [observer] = useState(
    () => new MutationObserver<TData, Error, TVariables, unknown>(queryClient, options),
  );

  useEffect(() => {
    observer.setOptions(options);
  }, [observer, options]);

  const [result, setResult] = useState(() => observer.getCurrentResult());

  useEffect(() => observer.subscribe(setResult), [observer]);

  const mutate = useCallback(
    (variables: TVariables) => {
      observer.mutate(variables);
    },
    [observer],
  );

  const mutateAsync = useCallback(
    (variables: TVariables) =>
      new Promise<TData>((resolve, reject) => {
        observer.mutate(variables, {
          onSuccess: resolve,
          onError: reject,
        });
      }),
    [observer],
  );

  return { ...result, mutate, mutateAsync };
}

export type { MutationObserverOptions, QueryObserverResult };
