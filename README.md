# LifeOS — Organise ta vie, avance sur l’essentiel

LifeOS est un espace personnel pour organiser ses objectifs, ses tâches, ses habitudes, ses projets et son temps. La version candidate 6.4.5 corrige les thèmes et compacte le volet Android, avec deux rubriques visibles : **Données & sauvegardes** et **Paramètres & sécurité**. Sur téléphone : barre du bas → **Plus**. Les anciennes rubriques et le format de données V4 sont conservés.

## Essayer immédiatement

Ouvrir `dist/LifeOS_Premium_V6.html` dans Chrome ou Edge. Aucune installation, aucune connexion requise pour la gestion quotidienne.

Pour reprendre les données : dans la V3/V4, exporter le JSON ; dans la V6, ouvrir Données & sauvegardes → Restaurer. Le fichier HTML, la PWA et l’APK peuvent avoir des stockages distincts : le JSON permet le transfert.

## Nouveautés V6.4.5

- **Tâches** : sous-tâches, échéance et heure, récurrences quotidienne, jours ouvrés, hebdomadaire ou mensuelle, tri/priorité/recherche, report à demain. L’occurrence suivante est créée à la fin de l’actuelle, sans générer de rattrapage massif.
- **Objectifs** : progression manuelle ou calculée selon les tâches, les habitudes ou le temps de concentration, avec historique daté et choix d’icône. Depuis le formulaire ou la fiche, création directe d’un projet, de ses jalons et de tâches issues du plan/action.
- **Projets** : tableau par statut, jalons et liaisons cohérentes projet → objectif.
- **Habitudes** : quotidien, jours choisis, jours ouvrés, objectif hebdomadaire ou dates mensuelles ; icônes, pauses, historique et statistiques de régularité. Écrans objectifs, tâches, habitudes et jalons avec recherche, filtres et tri.
- **Calendrier** jour/semaine/mois/trimestre/année, glisser-déposer des tâches sur ordinateur et agenda du jour.
- **Focus** : sessions écourtées enregistrables, cycles personnalisés, enchaînement optionnel au premier plan, ambiances synthétiques et fichier audio personnel. Le fichier audio doit être rechoisi après fermeture.
- **Recul** : statistiques comparatives, journal daté/recherchable, revue hebdomadaire sauvegardée et coach local fondé sur des règles explicites (aucun service IA externe). Un **Guide pratique** explique le parcours de l’application avec des exemples et des principes de planification inspirés de Brian Tracy.
- **Corbeille** avec restauration et suppression définitive ; préférences d’interface, densité, domaines personnalisés et trois raccourcis mobiles.

## Fonctionnalités livrées

| Fonction | HTML / PWA | Android |
|---|---|---|
| Objectifs, projets, habitudes, focus, journal, statistiques et corbeille | Oui | Oui |
| Rubriques Données et Paramètres visibles | Oui | Oui |
| Enregistrement local et 7 points de récupération | Oui | Oui |
| Export/import JSON, confirmation avant remplacement | Téléchargement navigateur | Sélecteur de fichiers Android |
| Export protégé par mot de passe | AES-GCM, Web Crypto disponible | AES-GCM |
| Verrouillage à l’ouverture et au retour au premier plan | Non | Biométrie forte ou code du téléphone |
| Rappels des tâches/habitudes et fin du focus | Non | Notifications locales après autorisation Android |
| Google Drive : synchronisation à la demande, sauvegarde/restauration et envoi périodique | Non | Oui, après configuration OAuth Google |
| Bouton retour Android, icône, écran de lancement | Sans objet | Intégrés |

**Aucun APK compilé n’est fourni dans cette archive.** La compilation locale de contrôle a été bloquée lors du téléchargement de Gradle par l’environnement réseau. Les fonctionnalités natives doivent être vérifiées sur un téléphone après compilation.

## Projet unique, maintenable

- `src/index.html`, `src/styles.css`, `src/app.js` : application existante.
- `src/features.js` : rubriques Données/Sécurité, sauvegardes, chiffrement et appels natifs.
- `scripts/build.mjs` : génère `www/` et le HTML autonome `dist/`.
- `android/` : projet Android complet, wrapper Gradle inclus, plugin natif en Java.
- `.github/workflows/android.yml` : compilation APK debug, release et AAB.
- `tests/core.test.mjs` : tests de calculs, sauvegardes, chiffrement et pont natif.
- `tests/browser-check.cjs` : parcours réels dans Chromium.

**Toujours modifier `src/`, puis reconstruire.** Ne pas modifier uniquement `www/`, `dist/` ou les assets Android générés.

## Compiler avec Android Studio

Prérequis : Node.js 22+, JDK 21, Android Studio avec SDK 35 et Build Tools 35.0.0. Le téléphone doit être sous **Android 11 ou ultérieur**. Cette base vise SDK 35 ; vérifier les exigences Play Store avant une publication future.

À la racine du projet :

```bash
npm ci
npm test
npm run android:sync
npm run android:open
```

Dans Android Studio, sélectionner **Gradle JDK 21**, laisser la synchronisation se terminer, puis Build → Generate App Bundles or APKs → Generate APKs. APK debug : `android/app/build/outputs/apk/debug/app-debug.apk`.

En ligne de commande :

```bash
cd android
./gradlew assembleDebug
```

Sous Windows : `gradlew.bat assembleDebug`.

## Compiler avec GitHub

1. Décompresser et mettre le **contenu** de ce dossier à la racine du dépôt : `package.json`, `src`, `android`, `.github`, etc. Ne pas inclure `node_modules`.
2. Vérifier que `.github/workflows/android.yml` existe bien dans le dépôt.
3. Onglet Actions → Android APK et AAB → Run workflow.
4. Ouvrir l’exécution terminée → Artifacts → **LifeOS-V6.4.5-Android**.
5. Télécharger/décompresser l’archive ; installer l’APK debug pour l’essai.

Le fichier `signing-report.txt` dans les artifacts fournit les empreintes SHA-1 des signatures. Sans clé de production, le release APK et l’AAB ne sont pas signés pour distribution ; le debug APK reste installable.

Pour une signature de production stable, créer ces secrets GitHub : `LIFEOS_KEYSTORE_BASE64`, `LIFEOS_STORE_PASSWORD`, `LIFEOS_KEY_ALIAS`, `LIFEOS_KEY_PASSWORD`. Ne jamais déposer la clé privée dans le dépôt. Le workflow utilise alors cette clé pour les builds release.

**La signature debug peut changer entre deux machines/exécutions GitHub.** Cela affecte les mises à jour et OAuth. Pour un usage durable, utiliser la même clé de production ; exporter les données avant de désinstaller une ancienne version.

## Activer le verrouillage

Dans l’APK : Paramètres & sécurité → Activer la biométrie / le PIN. Une confirmation du système est obligatoire à l’activation et à la désactivation. LifeOS accepte l’empreinte/biométrie forte disponible, ou le code/PIN/mot de passe du téléphone. Aucun PIN spécifique à LifeOS n’est conservé.

Les rappels utilisent les notifications locales Android. Les occurrences quotidiennes/hebdomadaires se répètent ; les dates mensuelles sont programmées pour les 12 prochains mois puis recalculées à l’ouverture. Les rappels nécessitent l’autorisation et Android peut décaler les alarmes exactes.

Le verrouillage est natif : le WebView est masqué derrière un écran Android au passage en arrière-plan. Le bouton retour ne permet pas de contourner ce verrou. Les captures d’écran sont bloquées avec `FLAG_SECURE`.

**Limite précise :** cela protège l’accès à l’interface, pas le contenu du stockage web par un chiffrement applicatif. La copie utilisée par le service de sauvegarde Android est, elle, chiffrée au repos avec Android Keystore. Elle reste déchiffrable par le service autorisé pour les sauvegardes en arrière-plan. Ne pas présenter cela comme un coffre biométrique intégral.

## Configurer Google Drive (obligatoire avant la connexion)

1. Créer un projet Google Cloud et activer **Google Drive API**.
2. Configurer Google Auth Platform : nom, audience, coordonnées et écran de consentement. En mode test, ajouter le compte utilisé comme utilisateur de test.
3. Ajouter la portée `https://www.googleapis.com/auth/drive.appdata`.
4. Créer un **client OAuth Android**, package `app.lifeos.premium`, avec le **SHA-1 du certificat de l’APK effectivement installé**. Pour Google Play, utiliser le certificat de signature de l’application fourni par Play.
5. Compiler/installer l’APK correspondant, puis Données & sauvegardes → Connecter Google Drive.

Ce parcours natif utilise `AuthorizationClient`. Aucun secret client ni clé API ne doit être collé dans le HTML. Le client OAuth Android est reconnu par le package et le certificat ; aucun `google-services.json` n’est requis pour cette intégration. Ne pas changer le package sans mettre à jour le projet Android et OAuth.

- **Connecter** demande l’autorisation, sans envoyer de sauvegarde.
- **Sauvegarder maintenant** envoie toutes les données métier, journal inclus, après confirmation.
- **Automatique** programme un travail Android d’environ 12 h, avec réseau disponible et batterie non faible. Android peut le différer ; ce n’est pas une heure fixe garantie. Une autorisation expirée peut nécessiter de reconnecter le compte.
- **Restaurer** télécharge la copie, valide son contenu, puis demande confirmation avant remplacement local.
- **Déconnecter** arrête le travail automatique et révoque l’autorisation. La sauvegarde cloud existante est conservée.

La copie `lifeos-backup-v5.json` est placée dans **appDataFolder**, l’espace caché privé de l’application, inaccessible directement depuis l’interface Drive. « Synchroniser maintenant » compare les dates de dernière modification des données : si Drive contient une copie plus récente, LifeOS demande confirmation avant de la restaurer ; si la copie locale est plus récente, elle remplace le fichier Drive. Les modifications concurrentes ne sont pas fusionnées et il n’y a pas d’historique cloud. L’envoi automatique périodique ne télécharge pas les changements ; pour récupérer ceux d’un autre appareil, lance une synchronisation manuelle. Les copies Drive sont en JSON, sans mot de passe supplémentaire. Pour un fichier chiffré transportable, utiliser Exporter avec mot de passe et le conserver séparément.

## Sauvegardes et récupération

Le schéma de données reste `version: 4` pour compatibilité ; `productVersion: 6.4.5` identifie l’export V6. Les JSON V3/V4 sont validés avant restauration.

Une copie locale automatique est créée à la première modification du jour, dans la limite de 7 points avec les copies manuelles. Elles partagent le même stockage : vider les données du navigateur les supprime aussi. Ce n’est pas un remplacement d’une sauvegarde externe.

L’export protégé utilise AES-GCM 256 bits, sel et IV aléatoires et PBKDF2-SHA256 à 310 000 itérations. Mot de passe : au moins 12 caractères, jamais conservé. Sans ce mot de passe, le fichier n’est pas récupérable. Taille maximale : 20 Mo à l’import ; 14 Mo de contenu brut pour l’export protégé afin de respecter cette limite après encodage.

## Tests

```bash
npm test
npx playwright install chromium
npm run test:browser
```

Pour utiliser un Chromium déjà installé : définir `CHROMIUM_EXECUTABLE` avec son chemin. Le test navigateur vérifie les parcours sur 360, 390, 768 et 1440 pixels. Les captures restent dans `test-results/`.

Vérifications réalisées dans cet environnement : 26 tests automatisés passent (migration V4→V6, liaisons, récurrence mensuelle et année bissextile, pauses d’habitudes, chiffrement, restauration et pont natif) ; génération HTML autonome et synchronisation Capacitor réussies. Le navigateur de test ne peut pas télécharger son binaire ici : le parcours complet dans un navigateur reste à exécuter après installation locale de Chromium. La compilation APK est bloquée ici car Gradle ne peut pas télécharger sa distribution (réseau indisponible) ; aucun APK n’est fourni.

À vérifier sur le téléphone après compilation : activation/désactivation biométrique, code système de secours, retour du fond, annulation du sélecteur de fichiers, connexion Google avec le bon SHA-1, sauvegarde/restauration Drive, reprise d’une autorisation expirée et envoi automatique différé. Aucun compte Google ni appareil biométrique n’était disponible dans cet environnement de développement.

## PWA

Servir `www/` sur HTTPS ou localhost. Le manifeste et le service worker permettent une utilisation hors ligne après chargement. Une nouvelle version du cache s’active une fois les anciens onglets fermés. Pour distribuer une mise à jour, modifier le nom de cache dans `src/sw.js`, reconstruire puis redéployer. Les fonctions natives ne sont pas proposées comme actives dans la PWA.

## Références techniques

- https://developer.android.com/identity/authorization
- https://developer.android.com/identity/sign-in/biometric-auth
- https://developers.google.com/workspace/drive/api/guides/appdata
- https://capacitorjs.com/docs/v7/plugins/android

## Historique de livraison 6.2.0
- Vue Projets et vue globale de tous les jalons : recherche, objectif, statut, retard et tri.
- Fiche objectif : gestion des projets/jalons existants, création de tâches détaillées liées à un jalon ; échéance et priorité lors de la conversion du plan.
- Focus : fin d'une pause possible sans ajouter de temps productif ; réinitialisation avec confirmation.
- Guide enrichi : exemple de clôture, priorisation, sauvegarde/restauration, réglages, limites HTML/Android et statistiques.
- 26 tests automatisés de logique. Le test navigateur est fourni mais n'a pas pu être exécuté dans l'environnement de livraison (téléchargement Chromium indisponible). Aucune validation visuelle ni validation sur appareil Android n'est revendiquée.
- Le ZIP contient les sources Android, Gradle, Capacitor, HTML et tests. Aucun APK compilé n'est fourni.
- Le workflow GitHub Actions est fourni dans `.github/workflows/android.yml`.


## V6.4.2 — synchronisation et finitions

- Synchronisation Drive à la demande avec comparaison des dates d’export. Une copie distante plus récente ouvre le parcours de restauration avec validation et confirmation ; une copie locale plus récente remplace la sauvegarde Drive. Il n’y a pas de fusion des modifications.
- Sauvegarde et restauration Drive restent accessibles séparément. L’envoi automatique Android est une sauvegarde périodique, pas une synchronisation continue.
- Les listes d’objectifs, tâches, habitudes, projets et jalons proposent recherche, filtres et tri ; le choix d’icônes reste discret dans l’interface, avec 18 options pour chaque type d’élément.
- GitHub Actions : workflow Android fourni dans `.github/workflows/android.yml`.


## Correctif 6.4.2 — démarrage Android

- Incrément de version Android (60402) pour permettre l’installation de cette mise à jour par-dessus la version 6.4.0.
- Ajout d’un écran de diagnostic si JavaScript échoue ou si l’application ne termine pas son initialisation ; les données personnelles ne sont pas affichées.


## Correctif 6.4.2 — pont Android

- Renommage du wrapper JavaScript natif pour éviter la collision avec le pont Capacitor Android (`nativeBridge`).
- Incrément du versionCode à 60402 pour installer la correction par-dessus les versions précédentes, sous réserve de la même clé de signature.


## Correctif 6.4.3 — volet mobile

- La barre de navigation inférieure ne recouvre plus le volet latéral.
- Ajout d’un fond assombri, d’une fermeture en touchant hors du volet ou avec Échap, et d’un défilement complet du menu sur les petits écrans.
- Version Android portée à 60403.


## Correctif 6.4.4 — navigation, triage et apparence

- Le volet latéral est forcé au-dessus de la barre mobile et du contenu ; le fond, l’état de défilement et l’accessibilité sont réinitialisés aussi par le bouton Retour Android.
- Le triage des tâches permet de sélectionner les résultats filtrés puis de modifier en lot le statut, la priorité, l’échéance ou de reporter à demain. Les tâches récurrentes conservent leur logique de prochaine occurrence.
- Les thèmes sont réappliqués au chargement et après sélection, enregistrés dans les données et accompagnés d’un retour visuel.
- Version Android portée à 60404 ; 26 tests automatisés passent.


## Candidate 6.4.5 — thèmes et volet Android

- Les sélecteurs de palette utilisent `:root[data-theme=…]` : ils ont désormais une priorité supérieure à la palette claire définie sur `:root`, ce qui permet aux couleurs de chaque thème de remplacer effectivement les couleurs de base.
- Le volet Android reprend la hiérarchie de la capture (marque, rubrique, icône et libellé) avec des lignes tactiles de 44 px et des espaces verticaux resserrés.
- Incrément Android : `versionCode 60405`. Les 26 tests automatisés passent, la construction HTML passe et `npx cap sync android` termine avec succès.
- Le test navigateur est préparé pour vérifier les couleurs calculées et le volet mobile, mais n’a pas pu démarrer ici : le binaire Chromium Playwright est absent. Le rendu final reste à valider sur ton Android.
