import { useEffect, useState } from 'preact/hooks';
import { authSession } from '../store/app';

export function useAuthUserId(): string | null {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const session = authSession.value;
    setUserId(session?.user?.id ?? null);

    authSession.subscribe(() => {
      const session = authSession.value;
      setUserId(session?.user?.id ?? null);
    });

    return () => {};
  }, []);

  // Also read current value for initial render
  const currentUserId = authSession.value?.user?.id ?? null;

  return userId ?? currentUserId;
}

export function useAuthAccessToken(): string | null {
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    const session = authSession.value;
    setAccessToken(session?.access_token ?? null);

    authSession.subscribe(() => {
      const session = authSession.value;
      setAccessToken(session?.access_token ?? null);
    });

    return () => {};
  }, []);

  const currentAccessToken = authSession.value?.access_token ?? null;

  return accessToken ?? currentAccessToken;
}