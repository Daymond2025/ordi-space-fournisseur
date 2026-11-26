"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { ChevronLeftIcon, ChevronRightIcon, PhoneFilledIcon, WhatsappIcon } from "@/components/icons";
import { useRetour } from "@/lib/navigation";

type ContactService = { nom: string; appel: string | null; whatsapp: string | null; whatsapp_url: string | null };

/** "+2250700000000" → "07 00 00 00 00" (affichage seulement). */
function formaterNumero(numero: string): string {
  const local = numero.replace(/\D/g, "").replace(/^225(?=\d{10}$)/, "");
  return local.length === 10 ? local.replace(/(\d{2})(?=\d)/g, "$1 ") : numero;
}

function CarteContact({
  href,
  titre,
  numero,
  icone,
  fond,
  externe,
}: {
  href: string;
  titre: string;
  numero: string;
  icone: React.ReactNode;
  fond: string;
  externe?: boolean;
}) {
  return (
    <a
      href={href}
      target={externe ? "_blank" : undefined}
      rel={externe ? "noopener noreferrer" : undefined}
      className="flex items-center gap-4 rounded-[22px] bg-white p-4"
      style={{ boxShadow: "0px 4px 14px 0px rgba(15, 23, 42, 0.08)" }}
    >
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white" style={{ background: fond }}>
        {icone}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-semibold uppercase tracking-wide text-brand-muted">{titre}</span>
        <span className="mt-0.5 block text-lg font-extrabold text-brand-ink">{formaterNumero(numero)}</span>
      </span>
      <ChevronRightIcon className="h-5 w-5 shrink-0 text-brand-muted" />
    </a>
  );
}

/**
 * "Contactez le service" (Profil) — numéros d'appel et WhatsApp du service
 * Ordi'Space pour les fournisseurs, fixés par l'Admin (GET /contact-fournisseur,
 * ParametreController::contactFournisseur()). Écran plein, sans barre du bas.
 */
export function EcranContact() {
  const { token } = useAuth();
  const retour = useRetour("/profil");
  const [contact, setContact] = useState<ContactService | null>(null);
  const [erreur, setErreur] = useState(false);

  useEffect(() => {
    if (!token) return;
    apiFetch<ContactService>("/contact-fournisseur", { token })
      .then(setContact)
      .catch(() => setErreur(true));
  }, [token]);

  const aucunNumero = contact && !contact.appel && !contact.whatsapp;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col bg-[#f2f5fa] md:my-6 md:min-h-[calc(100dvh-3rem)] md:rounded-[2rem] md:shadow-2xl md:shadow-slate-900/15 md:ring-1 md:ring-black/5">
      <div className="bg-gradient-espace relative shrink-0 overflow-hidden rounded-b-[32px] px-4 pb-10 pt-4 text-white">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={retour}
            aria-label="Retour"
            className="flex h-[31px] w-8 shrink-0 items-center justify-center rounded-[7px]"
            style={{ background: "rgba(255, 255, 255, 0.23)" }}
          >
            <ChevronLeftIcon className="h-[19px] w-[19px]" />
          </button>
          <p className="text-lg font-extrabold">Contactez le service</p>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-2xl font-extrabold leading-tight">Besoin d&apos;aide ?</p>
            <p className="mt-1.5 text-sm text-white/90">
              L&apos;équipe Ordi&apos;Space est là pour toi : une question sur une commande, un produit ou un paiement.
            </p>
          </div>
          <Image src="/images/mascotte.png" alt="" width={275} height={274} className="h-[110px] w-[110px] shrink-0 object-contain" priority />
        </div>
      </div>

      <div className="mt-6 flex flex-1 flex-col gap-3 px-4 pb-8">
        {erreur ? (
          <p className="rounded-[22px] bg-white p-6 text-center text-sm text-rose-600">Impossible de charger les contacts. Vérifie ta connexion.</p>
        ) : contact === null ? (
          <p className="rounded-[22px] bg-white p-6 text-center text-sm text-brand-muted">Chargement…</p>
        ) : aucunNumero ? (
          <p className="rounded-[22px] bg-white p-6 text-center text-sm text-brand-muted">Les contacts du service ne sont pas encore renseignés.</p>
        ) : (
          <>
            {contact.appel ? (
              <CarteContact
                href={`tel:${contact.appel}`}
                titre="Appel"
                numero={contact.appel}
                icone={<PhoneFilledIcon className="h-6 w-6" />}
                fond="linear-gradient(135deg, #0077FF 0%, #00BFFF 100%)"
              />
            ) : null}
            {contact.whatsapp && contact.whatsapp_url ? (
              <CarteContact
                href={contact.whatsapp_url}
                titre="WhatsApp"
                numero={contact.whatsapp}
                icone={<WhatsappIcon className="h-7 w-7" />}
                fond="linear-gradient(135deg, #25D366 0%, #128C7E 100%)"
                externe
              />
            ) : null}
            <p className="mt-2 px-2 text-center text-xs text-brand-muted">Touche un numéro pour appeler ou ouvrir la discussion WhatsApp.</p>
          </>
        )}
      </div>
    </main>
  );
}
