# Siloé Ministry International — site Netlify (avec administration complète)

## Le code administrateur
C'est le mot de passe que VOUS choisissez dans Netlify (variable ADMIN_PASSWORD). Il n'est écrit nulle part
dans le site : seul le serveur le connaît. Pour entrer : ouvrez  votre-site.com/#admin  (mettez-le en favori),
tapez le code, puis le bouton jaune « Modifier le site » apparaît. Personne d'autre ne voit ce bouton.

## Utilisation au quotidien (sans repasser par Claude)
- Modifier un texte : allez sur la page > « Modifier le site » > « Tous les textes de cette page » : chaque phrase
  affichée (menu compris) est modifiable en FR et EN.
- Photos, événements (description + photos), départements, hiérarchie, ressources, Store (prix, description,
  photos), horaires, contacts, dons, galeries : sections du même panneau. Ajouter / modifier / supprimer.
- Terminez toujours par « Publier les modifications » : visible immédiatement par le public.
- Menu réservé à l'administrateur : « Visiteurs » (liste partagée + impression avec en-tête Siloé),
  « Cartes » (demandes de carte de membre : seul l'administrateur émet et imprime la carte),
  « Commandes » (commandes et dons de Johannesburg : confirmez le paiement, la facture passe à « PAID »).


## Ce que ce site permet
- Vous (administrateur) modifiez TOUT depuis le site : textes, photos, événements, départements,
  hiérarchie, ressources, Store, horaires, contacts, dons, galeries, podcasts. Vous ajoutez, modifiez,
  supprimez, puis cliquez sur « Publier » : le changement est visible tout de suite par tout le monde,
  sans renvoyer de fichiers.
- Les visiteurs ne peuvent rien modifier.
- Les nouveaux visiteurs remplissent la fiche en ligne (page « Nouveau visiteur ») ; vous voyez la liste
  partagée (menu « Visiteurs ») et vous l'imprimez après le culte.

## Mise en ligne (une seule fois)
1. Créez un compte gratuit sur https://github.com puis un dépôt privé « siloe-site ».
   Envoyez-y TOUT le contenu de ce dossier (bouton « Add file » > « Upload files »).
2. Créez un compte sur https://app.netlify.com > « Add new site » > « Import an existing project » > GitHub
   > choisissez « siloe-site ». Laissez les réglages par défaut > « Deploy ».
3. Dans Netlify : Site configuration > Environment variables > « Add a variable » :
   - Clé : ADMIN_PASSWORD
   - Valeur : votre mot de passe (long, secret, que vous seul connaissez)
   Puis Deploys > « Trigger deploy » > « Deploy site ».
4. Ouvrez votre site. En bas de page, cliquez « Admin », entrez le mot de passe.
   Le bouton jaune « Modifier le site » apparaît.
5. Votre propre domaine : Domain management > « Add a domain ».

## Alternative sans GitHub
Avec l'outil Netlify CLI (ordinateur) : `npm i -g netlify-cli`, `netlify login`, puis dans ce dossier
`netlify deploy --prod` (créez le site quand il le propose, puis ajoutez ADMIN_PASSWORD comme ci-dessus).

## Important
- Ne partagez jamais le mot de passe ADMIN_PASSWORD.
- Les photos et le contenu sont gardés dans Netlify Blobs (inclus avec Netlify). Vérifiez les limites de
  votre formule Netlify.
- Paiement par carte en ligne (PayFast, Yoco, Flutterwave…) : possible plus tard, il faut un compte marchand.
