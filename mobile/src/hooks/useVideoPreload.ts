import { useVideoPlayer, type VideoSource } from 'expo-video';
import { useEffect, useState } from 'react';

export function useVideoPreload(source: VideoSource) {
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);

  const player = useVideoPlayer(source, (player) => {
    player.loop = false;
    player.muted = true;
  });

  useEffect(() => {
    if (!player) return;

    // Listen for status changes to determine if video is ready or failed
    const subscription = player.addListener('statusChange', (payload) => {
      if (payload.status === 'readyToPlay') {
        setIsReady(true);
      } else if (payload.status === 'error') {
        setHasError(true);
      }
    });

    // Check initial status in case it loaded extremely fast
    if (player.status === 'readyToPlay') {
      setIsReady(true);
    } else if (player.status === 'error') {
      setHasError(true);
    }

    return () => {
      subscription.remove();
    };
  }, [player]);

  return { player, isReady, hasError };
}
