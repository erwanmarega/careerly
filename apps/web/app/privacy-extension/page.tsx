export const metadata = {
  title: 'Politique de confidentialité — Extension Careerly',
}

export default function PrivacyExtensionPage() {
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 720, margin: '60px auto', padding: '0 24px', lineHeight: 1.7, color: '#1a1a1a' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.25rem' }}>Politique de confidentialité</h1>
      <p style={{ color: '#444' }}>Dernière mise à jour : mars 2026</p>

      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '2rem' }}>1. Données collectées</h2>
      <p style={{ color: '#444' }}>L&apos;extension Careerly collecte uniquement les données nécessaires à son fonctionnement :</p>
      <ul style={{ color: '#444' }}>
        <li>Votre adresse email et token d&apos;authentification (stockés localement via <code>chrome.storage.local</code>)</li>
        <li>Les informations de l&apos;offre d&apos;emploi affichée (titre du poste, nom de l&apos;entreprise, localisation, URL) — uniquement sur les sites autorisés et uniquement lorsque vous utilisez activement l&apos;extension</li>
      </ul>

      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '2rem' }}>2. Utilisation des données</h2>
      <p style={{ color: '#444' }}>Les données extraites de la page sont utilisées exclusivement pour pré-remplir le formulaire d&apos;ajout de candidature dans Careerly. Elles sont transmises à l&apos;API Careerly uniquement lorsque vous soumettez le formulaire.</p>

      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '2rem' }}>3. Stockage</h2>
      <p style={{ color: '#444' }}>Votre token d&apos;accès est stocké localement dans le navigateur via <code>chrome.storage.local</code>. Il n&apos;est jamais partagé avec des tiers.</p>

      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '2rem' }}>4. Données non collectées</h2>
      <p style={{ color: '#444' }}>Careerly ne collecte pas :</p>
      <ul style={{ color: '#444' }}>
        <li>Votre historique de navigation</li>
        <li>Des données sur des pages autres que les sites d&apos;offres d&apos;emploi listés</li>
        <li>Des données à des fins publicitaires ou analytiques</li>
      </ul>

      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '2rem' }}>5. Sites concernés</h2>
      <p style={{ color: '#444' }}>L&apos;extension est active uniquement sur : LinkedIn, Indeed, Welcome to the Jungle, JobTeaser, HelloWork.</p>

      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '2rem' }}>6. Contact</h2>
      <p style={{ color: '#444' }}>Pour toute question : <a href="mailto:contact@careerly.app" style={{ color: '#8b5cf6' }}>contact@careerly.app</a></p>
    </main>
  )
}
