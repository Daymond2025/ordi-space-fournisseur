"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from "@/components/icons";

/**
 * Visionneuse plein écran des photos d'un produit — copiée telle quelle de
 * Ordi'Space_Livreur_App_mobile/src/components/boutique/VisionneuseImages.tsx
 * ("Infos produit" réutilise le même écran détail produit que le livreur).
 * Glisser (ou flèches / clavier) pour passer à la suivante, toucher la photo
 * pour la zoomer puis la faire défiler du doigt, Échap ou la croix pour fermer.
 */
export function VisionneuseImages({ images, indexInitial, onFermer }: { images: string[]; indexInitial: number; onFermer: () => void }) {
  const [index, setIndex] = useState(indexInitial);
  const [zoom, setZoom] = useState(false);
  const departX = useRef<number | null>(null);
  const total = images.length;

  function aller(delta: number) {
    setZoom(false);
    setIndex((i) => (i + delta + total) % total);
  }

  // Le clavier est un système externe : l'effet s'y abonne, les setState sont dans les gestionnaires.
  useEffect(() => {
    function surTouche(e: KeyboardEvent) {
      if (e.key === "Escape") onFermer();
      if (e.key === "ArrowRight") aller(1);
      if (e.key === "ArrowLeft") aller(-1);
    }
    window.addEventListener("keydown", surTouche);
    return () => window.removeEventListener("keydown", surTouche);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- aller() ne dépend que de `total`, stable pendant l'affichage
  }, [onFermer, total]);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black/95" role="dialog" aria-label="Photo du produit">
      <div className="flex shrink-0 items-center justify-between px-4 py-3 text-white">
        <p className="text-sm font-bold">
          {index + 1} / {total}
        </p>
        <button type="button" onClick={onFermer} aria-label="Fermer" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
          <CloseIcon className="h-5 w-5" />
        </button>
      </div>

      <div
        className="relative min-h-0 flex-1 overflow-auto"
        onTouchStart={(e) => {
          departX.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          if (departX.current === null || zoom || total < 2) return;
          const ecart = e.changedTouches[0].clientX - departX.current;
          departX.current = null;
          if (Math.abs(ecart) > 50) aller(ecart < 0 ? 1 : -1);
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- photo servie par le backend, domaine dynamique */}
        <img
          src={images[index]}
          alt=""
          onClick={() => setZoom((z) => !z)}
          className={zoom ? "max-w-none cursor-zoom-out" : "mx-auto h-full w-full cursor-zoom-in object-contain"}
          style={zoom ? { width: "230%" } : undefined}
        />
      </div>

      {total > 1 ? (
        <>
          <button
            type="button"
            onClick={() => aller(-1)}
            aria-label="Photo précédente"
            className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white"
          >
            <ChevronLeftIcon className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={() => aller(1)}
            aria-label="Photo suivante"
            className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white"
          >
            <ChevronRightIcon className="h-6 w-6" />
          </button>
          <div className="flex shrink-0 justify-center gap-2 py-4">
            {images.map((url, i) => (
              <span key={url} className={`h-2 rounded-full transition-all ${i === index ? "w-5 bg-white" : "w-2 bg-white/40"}`} />
            ))}
          </div>
        </>
      ) : null}

      <p className="shrink-0 pb-4 text-center text-[11px] text-white/60">{zoom ? "Touche pour revenir à la vue d'ensemble" : "Touche la photo pour zoomer"}</p>
    </div>
  );
}
