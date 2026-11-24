"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// En dessous de cette distance (px) du bas, on considère être « en bas ».
const SEUIL_BAS = 80;

/**
 * Fil de discussion façon WhatsApp : les messages les plus récents sont en
 * bas et l'écran s'y place tout seul à l'ouverture et à chaque nouveau
 * message (`cle` change). Si l'utilisateur est remonté lire l'historique,
 * on ne le ramène pas de force en bas — sauf quand c'est lui qui vient
 * d'envoyer (`allerEnBas()` explicite).
 */
export function useDefilementBas<T>(cle: T) {
  const ref = useRef<HTMLDivElement | null>(null);
  const suivreRef = useRef(true);
  const [enBas, setEnBas] = useState(true);

  const allerEnBas = useCallback((doux = false) => {
    const el = ref.current;
    if (!el) return;
    suivreRef.current = true;
    el.scrollTo({ top: el.scrollHeight, behavior: doux ? "smooth" : "auto" });
  }, []);

  const onScroll = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const proche = el.scrollHeight - el.scrollTop - el.clientHeight < SEUIL_BAS;
    suivreRef.current = proche;
    setEnBas(proche);
  }, []);

  useEffect(() => {
    if (!suivreRef.current) return;
    // Après le rendu (images de cartes qui chargent ensuite : 2e passage).
    const el = ref.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    const t = setTimeout(() => {
      if (suivreRef.current && ref.current) ref.current.scrollTop = ref.current.scrollHeight;
    }, 300);
    return () => clearTimeout(t);
  }, [cle]);

  return { ref, onScroll, enBas, allerEnBas };
}
