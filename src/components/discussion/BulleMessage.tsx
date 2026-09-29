import Image from "next/image";
import { CarteNouvelleCommande } from "@/components/discussion/CarteNouvelleCommande";
import { CarteRapportJour } from "@/components/discussion/CarteRapportJour";
import { CartePropositionPrix } from "@/components/discussion/CartePropositionPrix";
import { formaterTempsRelatif } from "@/lib/temps";
import type { DonneesCommandeCreee, DonneesPropositionPrix, DonneesRapport, MessageConversation } from "@/lib/types";

function formaterHeure(iso: string): string {
  const date = new Date(iso.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function Avatar({ taille = 28 }: { taille?: number }) {
  return (
    <div className="relative shrink-0 overflow-hidden rounded-full bg-[#EEF1F6]" style={{ height: taille, width: taille }}>
      <Image src="/images/profil-default.png" alt="" fill className="object-cover" sizes={`${taille}px`} />
    </div>
  );
}

/**
 * Bulle de message façon WhatsApp — copiée de
 * Cordinateur_App_Web/src/components/discussion/BulleMessage.tsx (même écran
 * d'origine). Les messages système enrichis ("commande_creee", "rapport",
 * "proposition_prix") s'affichent en pleine largeur, sans le chrome de bulle.
 */
export function BulleMessage({ message, estMoi }: { message: MessageConversation; estMoi: boolean }) {
  const nomAuteur = `${message.auteur.prenom ? message.auteur.prenom + " " : ""}${message.auteur.nom}`.trim();

  if (message.type === "commande_creee" || message.type === "rapport" || message.type === "proposition_prix") {
    const donnees = message.donnees;

    return (
      <div>
        {message.type === "commande_creee" && donnees ? (
          <CarteNouvelleCommande donnees={donnees as DonneesCommandeCreee} />
        ) : message.type === "rapport" && donnees ? (
          <CarteRapportJour donnees={donnees as DonneesRapport} />
        ) : message.type === "proposition_prix" && donnees ? (
          <CartePropositionPrix donnees={donnees as DonneesPropositionPrix} />
        ) : (
          <p className="mx-4 rounded-[9px] bg-white px-3.5 py-2 text-sm text-brand-ink shadow-sm shadow-slate-900/5">
            {message.contenu}
          </p>
        )}

        <div className="mx-4 mt-1.5 flex items-center gap-1.5">
          <Avatar taille={20} />
          <span className="text-xs font-bold text-brand-ink">{nomAuteur}</span>
          <span className="ml-auto text-[11px] text-brand-muted">{formaterTempsRelatif(message.date_envoi)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-end gap-2 ${estMoi ? "justify-end" : "justify-start"}`}>
      {!estMoi ? <Avatar /> : null}

      <div
        className={`max-w-[75%] rounded-2xl px-3.5 py-2 shadow-sm shadow-slate-900/5 ${
          estMoi ? "bg-gradient-espace text-white" : "bg-white text-brand-ink"
        }`}
      >
        {!estMoi ? (
          <p className="mb-0.5 text-xs font-bold text-[color:var(--brand-blue-end)]">{nomAuteur}</p>
        ) : null}

        {message.type === "texte" ? (
          <p className="whitespace-pre-wrap text-sm">{message.contenu}</p>
        ) : message.type === "image" && message.fichier ? (
          <div className="relative h-48 w-56 overflow-hidden rounded-xl">
            <Image src={message.fichier} alt="" fill className="object-cover" sizes="224px" />
          </div>
        ) : (message.type === "audio" || message.type === "note_vocale") && message.fichier ? (
          <audio controls src={message.fichier} className="h-10 w-56" />
        ) : (
          <p className="text-sm italic opacity-80">{message.type === "video" ? "Vidéo" : "Document"} envoyé</p>
        )}

        <p className={`mt-1 text-right text-[10px] ${estMoi ? "text-white/70" : "text-brand-muted"}`}>
          {formaterHeure(message.date_envoi)}
        </p>
      </div>
    </div>
  );
}
