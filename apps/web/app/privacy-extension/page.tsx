export const metadata = {
  title: 'Politique de confidentialité — Extension Postulo',
}

export default function PrivacyExtensionPage() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-16 text-foreground leading-relaxed">
      <h1 className="text-3xl font-black mb-1">Politique de confidentialité</h1>
      <p className="text-muted-foreground text-sm mb-10">Dernière mise à jour : mars 2026</p>

      <h2 className="text-base font-bold mt-8 mb-2">1. Données collectées</h2>
      <p className="text-muted-foreground text-sm mb-2">L&apos;extension Postulo collecte uniquement les données nécessaires à son fonctionnement :</p>
      <ul className="text-muted-foreground text-sm list-disc pl-5 space-y-1">
        <li>Votre adresse email et token d&apos;authentification (stockés localement via <code>chrome.storage.local</code>)</li>
        <li>Les informations de l&apos;offre d&apos;emploi affichée (titre du poste, nom de l&apos;entreprise, localisation, URL) — uniquement sur les sites autorisés et uniquement lorsque vous utilisez activement l&apos;extension</li>
      </ul>

      <h2 className="text-base font-bold mt-8 mb-2">2. Utilisation des données</h2>
      <p className="text-muted-foreground text-sm">Les données extraites de la page sont utilisées exclusivement pour pré-remplir le formulaire d&apos;ajout de candidature dans Postulo. Elles sont transmises à l&apos;API Postulo uniquement lorsque vous soumettez le formulaire.</p>

      <h2 className="text-base font-bold mt-8 mb-2">3. Stockage</h2>
      <p className="text-muted-foreground text-sm">Votre token d&apos;accès est stocké localement dans le navigateur via <code>chrome.storage.local</code>. Il n&apos;est jamais partagé avec des tiers.</p>

      <h2 className="text-base font-bold mt-8 mb-2">4. Données non collectées</h2>
      <p className="text-muted-foreground text-sm mb-2">Postulo ne collecte pas :</p>
      <ul className="text-muted-foreground text-sm list-disc pl-5 space-y-1">
        <li>Votre historique de navigation</li>
        <li>Des données sur des pages autres que les sites d&apos;offres d&apos;emploi listés</li>
        <li>Des données à des fins publicitaires ou analytiques</li>
      </ul>

      <h2 className="text-base font-bold mt-8 mb-2">5. Sites concernés</h2>
      <p className="text-muted-foreground text-sm">L&apos;extension est active uniquement sur : LinkedIn, Indeed, Welcome to the Jungle, JobTeaser, HelloWork.</p>

      <h2 className="text-base font-bold mt-8 mb-2">6. Contact</h2>
      <p className="text-muted-foreground text-sm">Pour toute question : <a href="mailto:maregaerwan@gmail.com" className="text-primary hover:underline">maregaerwan@gmail.com</a></p>
    </main>
  )
}
