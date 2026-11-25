import { redirect } from "next/navigation";

// L'ancien onglet « Plus » est remplacé par le menu de l'avatar ; on garde l'adresse pour les anciens liens.
export default function PlusPage() {
  redirect("/reglages");
}
