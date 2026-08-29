import { useVideoPlayer } from "expo-video";
import { useEffect, useState } from "react";

export function useVideoPreload(source) {
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);

  const player = useVideoPlayer(source, (p) => {
    try {
      if (p) {
        p.loop = false;
        p.muted = true;
        p.pause();
      }
    } catch (e) {
      console.log("Video player setup error:", e);
    }
  });

  useEffect(() => {
    if (!player) {
      setHasError(true);
      return;
    }

    try {
      const subscription = player.addListener?.("statusChange", (payload) => {
        if (payload?.status === "readyToPlay") {
          setIsReady(true);
        } else if (payload?.status === "error") {
          setHasError(true);
        }
      });

      if (player.status === "readyToPlay") {
        setIsReady(true);
      } else if (player.status === "error") {
        setHasError(true);
      }

      return () => {
        try {
          subscription?.remove?.();
        } catch (e) {}
      };
    } catch (e) {
      console.log("Error attaching video status listener:", e);
      setHasError(true);
    }
  }, [player]);

  return { player, isReady, hasError: hasError || !player };
}
