# Copie de serveur Discord

## Informations
Vous avez toujours rêvé de copier votre serveur Discord ? Maintenant vous pouvez ! Pas besoin de faire manuellement les rôles, salons et permissions, cela prendra du temps en fonction de la taille de l'ancien serveur. Ce script fait tout pour vous. Il sauvegarde le serveur dans un fichier et vous pourrez en créer un nouveau. Vous pouvez également partager le fichier du serveur avec des amis.

### Ce qui sera copier
- Catégories
- Salons textuels et vocaux
- Rôles (aussi gérés)
- Permissions des rôles pour les catégories et salons (pas un utilisateur spécifique)
- Emoticônes
- Banissements

### Ce qui ne sera pas copier
- Historique du chat
- Invitations
- Webhooks
- Logs du serveur
- Intégrations (youtube/twitch)

## What do I need
- [Node.js](https://nodejs.org/) version >= 8.0.0 peut marcher
- [discord.js](https://github.com/hydrabolt/discord.js) Dernière version **_pas la version stable._**
  - Ce sera automatiquement installé. Voir la partie installation.
- Un compte Discord avec un bot et token
  - Page Discord Développeur [link](https://discordapp.com/developers/applications/me) to create a bot
- Un serveur vide ou déjà utilisé (données actuelles écrasées)

## Avertissement
**_Utilisez ce script à vos risques et périls !_**

Selon l'équipe Discord, tout type de compte d'utilisateur, y compris les soi-disant SelfBots, sont interdits. Le script doit être exécuté avec un token bot.

## Installation
1. Téléchargez le repository depuis github
2. Unzipper le
3. Ouvrez le dossier
4. Modifiez les paramètres et remplissez toutes les données nécessaires (voir [Paramètres](https://github.com/Jisagi/Discord-guild-copy#settings) pour plus d'informations).
5. Ouvrez la console (SUR CE DOSSIER) et exécutez `npm install` (sur Windows, vous pouvez déplacer + cliquer avec le bouton droit de la souris dans le dossier du projet et sélectionner« Ouvrir l’invite de commande ici »).
6. Exécutez `node copy.js` dans la console pour imprimer

## Paramètres
Pour obtenir l'ID d'une guilde, ouvrez les paramètres Discord -> Apparence, puis activez le mode développeur. Si vous cliquez maintenant avec le bouton droit sur un serveur, vous pouvez sélectionner «Copier l'ID».

| Variable | Explications |
| --- | --- |
| originalGuildId | L'identifiant du serveur que vous voulez copier. Peut être laissé vide si un guildData.json existe déjà. |
| newGuildId | L'identifiant du nouveau serveur sur lequel vous allez copier des données. |
| newGuildAdminRoleId | L'ID d'un rôle avec des autorisations d'administrateur. Le bot doit avoir ce rôle dans le nouveau serveur (important) ! Vous pouvez créer manuellement un nouveau rôle appelé «guildcopy» et le script l'utilisera automatiquement. Si vous le faites, laissez simplement ce champ vide. (il est recommandé de ne pas toucher à ce paramètre) |
| copyEmojis | Par défaut: false - Définissez sur true pour copier les émoticônes (voir aussi [Comportement commun](https://github.com/Jisagi/Discord-guild-copy#common-behaviour)) |
| copyBans | Par défaut: false - Définissez sur true pour maintenir bannis du serveur les utilisateurs. Le bot doit avoir l'autorisation BAN_MEMBERS (Bannir les membres) sur le serveur copié si vous voulez activez cette option ! |
| debug | Par défaut: false - Définissez sur true pour un résultat général un peu plus poussé et l'affichage d'une erreur si il y en a, par exemple lors de l'apparition d'un problème |
| token | Votre token de compte. Le bot n'a pas besoin d'autorisations sur le serveur copié (exepction: copyBans = true). |

## Comportement commun
- Nouveau nettoyage de guilde
  - Création / Suppression d'émôticones: Cela prendra du temps, surtout s'il y en a beaucoup. Attendez-vous à quelques limites de fréquence lorsque "debug" est activé. Si 'copyEmojis' est désactivé, les émôticones sur le nouveau serveur ne seront pas supprimés ou de nouveaux ajoutés.
  - Création / Suppression des interdictions: voir 'Création / Suppression Emoji' ci-dessus
  - Suppression de canal: l'utilisateur peut toujours afficher les chaînes supprimées même si elles sont déjà supprimées. Pour résoudre ce problème, redémarrez simplement votre Discord. Vous pouvez le faire pendant que le script est en cours d'exécution.
- Région
  - Certaines guildes ont des régions VIP (partenariats Discord) qui ne peuvent pas être utilisées par des guildes normales. Par conséquent, si vous copiez une telle guilde, la région sera définie comme centrale.

## Pourquoi utiliser v12.0-dev et pas la version stable
Cela a été développé lorsque 11.2.1 était la dernière version qui n'était pas capable de fournir toutes les fonctionnalités nécessaires (par exemple, catégories, permsissions) pour cloner une guilde entière. Un port / réécriture vers 11.3.X (ou toute version <12.0) et à nouveau vers 12.0 serait simplement un travail inutile.
Je vais probablement passer à la version stable dès que 12.0 sera stable.

Jisagi de vérifier les nouveaux commits pour les changements qui pourraient casser quelque chose mais si il en manque un, conatctez-le.

## Problèmes
La plupart des problèmes courants sont affichés dans la console lors de l'exécution du script. Si vous rencontrez des pannes ou tout autre comportement étrange non répertorié [ici](https://github.com/Jisagi/Discord-guild-copy#common-behaviour), n'hésitez pas à créer un [problème] (https: // github. com / Jisagi / Discord-guild-copy / issues / new). Le script crée des journaux dans le dossier 'logs'. N'hésitez pas à les télécharger sur quelque chose comme [pastebin](https://pastebin.com/) et ajoutez-les au problème créé pour m'aider à trouver le problème.

## Puis-je suggérer de nouvelles fonctionnalités (ou me plaindre du code laide)
Bien sûr, il suffit de créer un [numéro](https://github.com/Jisagi/Discord-guild-copy/issues/new) ou une [demande de traction](https://github.com/Jisagi/Discord-guild-copy/compare).

## Licence
Ce logiciel est sous licence GPLv3. Pour plus de détails, voir [LICENCE](https://github.com/Jisagi/Discord-guild-copy/blob/master/LICENSE).

## Credits

Le logiciel a été codé par Jisagi et le guide original par lui aussi, le guide a été traduit en français par TheLightSpirit