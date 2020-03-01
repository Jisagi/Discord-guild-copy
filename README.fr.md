# Copie de serveur Discord

## Informations
Vous avez toujours rêvé de copier votre serveur Discord ? Maintenant vous pouvez ! Pas besoin de recréer manuellement les rôles, salons et permissions. Cela prendra du temps en fonction de la taille de l'ancien serveur. Ce script fait tout pour vous. Il sauvegarde le serveur dans un fichier et vous pourrez en créer un nouveau. Vous pouvez également partager le fichier du serveur avec des amis.

### Ce qui sera copié
- Catégories
- Salons textuels et vocaux
- Rôles (aussi gérés)
- Permissions des rôles pour les catégories et salons (pas un utilisateur spécifique)
- Emoticônes & Emojis
- Banissements

### Ce qui ne sera pas copié
- Historique du chat
- Invitations
- Webhooks
- Logs du serveur
- Intégrations (youtube/twitch)

## De quoi ai-je besoin ?
- [Node.js](https://nodejs.org/) Toute version >= 12.0.0 peut fonctionner
- Un compte Discord avec un bot (utilisateur)
  - Voir la page Discord Développeur [link](https://discordapp.com/developers/applications/me) pour créer un bot
- Un serveur vide ou déjà utilisé (données actuelles écrasées)

## Avertissement
Le script doit être lancé avec un token de bot (utilisateur)

## Installation
1. Téléchargez le repository depuis GitHub
2. Dézippez-le
3. Allez dans le dossier extrait
4. Editez le settings.json et complétez les paramètres (voir la section Paramètres juste en bas)
5. Ouvrez la console et exécutez `npm install` (sur Windows, vous devez cliquer sur Shift + Clic droit dans le dossier et cliquez sur "Ouvrir l'invite de commande ici").
6. Exécutez `node copy.js` dans la console.

## Paramètres
Pour obtenir l'ID d'un serveur, ouvrez les paramètres Discord -> Apparence, puis activez le mode développeur. Si vous cliquez maintenant avec le bouton droit sur un serveur, vous pouvez sélectionner «Copier l'ID».

| Variable | Explications |
| --- | --- |
| originalGuildId | L'identifiant du serveur que vous voulez copier. Peut être laissé vide si un guildData.json existe déjà. |
| newGuildId | L'identifiant du nouveau serveur sur lequel vous allez copier des données. |
| newGuildAdminRoleId | L'ID d'un rôle avec des autorisations d'administrateur. Le bot doit avoir ce rôle dans le nouveau serveur (important) ! Vous pouvez créer manuellement un nouveau rôle appelé «guildcopy» et le script l'utilisera automatiquement. Si vous le faites, laissez simplement ce champ vide. (il est recommandé de ne pas toucher à ce paramètre) |
| copyEmojis | Par défaut: false - Définissez sur true pour copier les émoticônes (voir aussi [Comportement commun](https://github.com/Jisagi/Discord-guild-copy#common-behaviour)) |
| copyBans | Par défaut: false - Définissez sur true pour maintenir bannis du serveur les utilisateurs. Le bot doit avoir l'autorisation BAN_MEMBERS (Bannir les membres) sur le serveur copié si vous voulez activez cette option ! |
| language | Par défaut: en (anglais) - Définissez le sur une des langues disponibles dans le dossier "translations" (ru (russe), en (anglais), de (allemand) |
| output | Par défaut: all - Sorties (messages qui peuvent être des erreurs ou informations) qui peuvent être renvoyés par le programme. Valeurs possibles: "all" toutes les sorties sont renvoyés, "error" seules les erreurs sont renvoyées, "none" aucune sortie n'est renvoyé |
| djsVersionCheck | Par défaut: true - Vérifie la version local (actuel) de Discord.js par le commit hashé. Si vous lancez périodiquement le script, vous voudrez peut-être le désactiver |
| debug | Par défaut: false - Définissez sur true pour un résultat général un peu plus poussé et l'affichage d'une erreur si il y en a, par exemple lors de l'apparition d'un problème |
| token | Votre token de compte. Le bot n'a pas besoin d'autorisations sur le serveur copié (exepction: copyBans = true). |

## Comportement commun
- Nouveau nettoyage de guilde
  - Création / Suppression d'émôticones: Cela prendra du temps, surtout s'il y en a beaucoup. Attendez-vous à quelques limites de fréquence lorsque "debug" est activé. Si 'copyEmojis' est désactivé, les émôticones sur le nouveau serveur ne seront pas supprimés ou de nouveaux ajoutés.
  - Création / Suppression des interdictions: voir 'Création / Suppression Emoji' ci-dessus
  - Suppression de salon: l'utilisateur peut toujours afficher les salosn supprimées même si elles sont déjà supprimées. Pour résoudre ce problème, redémarrez simplement votre Discord. Vous pouvez le faire pendant que le script est en cours d'exécution.
- Région
  - Certaines guildes ont des régions VIP (partenariats Discord) qui ne peuvent pas être utilisées par des guildes normales. Par conséquent, si vous copiez une telle guilde, la région sera définie comme "Centre des Etats-Unis".

## Problèmes
La plupart des problèmes courants sont affichés dans la console lors de l'exécution du script. Si vous rencontrez des pannes ou tout autre comportement étrange non répertorié [ici](https://github.com/Jisagi/Discord-guild-copy#common-behaviour), n'hésitez pas à créer un [problème] (https: // github. com / Jisagi / Discord-guild-copy / issues / new). Le script crée des journaux dans le dossier 'logs'. N'hésitez pas à les télécharger sur quelque chose comme [pastebin](https://pastebin.com/) et ajoutez-les au problème créé pour m'aider à trouver le problème.

## Puis-je suggérer de nouvelles fonctionnalités (ou me plaindre du code laid)
Bien sûr, il suffit de créer une [issue](https://github.com/Jisagi/Discord-guild-copy/issues/new) ou une [pull request](https://github.com/Jisagi/Discord-guild-copy/compare).

## Traduction

Si vous aider à traduire le script, Si vous vous sentez libre. Vous avez juste à créer une copie du "en.json" dans le dossier "translations" et créer une pull request avec la nouvelle traduction. Toutes les [@@X@@] publications sont des parties dynamiques d'une sentence et doivent être dans une place correcte pour chaque langue numérotée en 1,2,3,... Merci d'essayer votre traduction au moins une fois avant de l'envoyer et n'oubliez pas de changer les paramètres "langcode/language/author" qui sont tout en haut du fichier.

## Licence
Ce logiciel est sous licence GPLv3. Pour plus de détails, voir [LICENCE](https://github.com/Jisagi/Discord-guild-copy/blob/master/LICENSE).

## Credits

Le logiciel a été codé par Jisagi et le guide original par lui aussi, le guide a été traduit en français par TheLightSpirit
