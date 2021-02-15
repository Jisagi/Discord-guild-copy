# Discord guild copy

## Information
Did you ever want to create a copy of a guild? Now you can! There is no need to manually create roles, channels and permissions, which can take very long depending on the original guilds size. The script does everything for you. It backs up a guild into a single file and lets you create a new guild from it. You can share your file with others, too.

### What will be copied
- Categories
- Text & Voice channels
- Roles (also managed ones)
- Role permissions for categories and text/voice channels (no user specific ones)
- Emojis
- Bans

### What will not be copied
- Chat history
- Invites
- Webhooks
- Audit Logs
- Third party integrations (Twitch/Youtube)

## What do I need
- [Node.js](https://nodejs.org/) any version >= 12.0.0 should work
- Git
  - [for windows](https://git-scm.com/download/win) or
  - [for other platforms](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
- A Discord account with a bot user
  - Discord Developer page [link](https://discordapp.com/developers/applications/me) to create a bot
- (Optional) A preferably empty guild which can be overwritten

## Disclaimer
**The script must be run with a bot user token.** According to discords [statement](https://support.discordapp.com/hc/en-us/articles/115002192352-Automated-user-accounts-self-bots000000), any kind of user account botting including so called SelfBots are forbidden. The script will therefore block the execution with a user account token.

## Installation & Usage
1. Download the repository from github
2. Unzip it
3. Navigate into the extracted folder
4. Edit the `settings.json` and fill in all necessary data (see [Settings](https://github.com/Jisagi/Discord-guild-copy#settings) for more information)
5. Open the console and run `npm install` (on windows you can shift + right click inside the project folder and select 'open command prompt here'). You can also use `yarn install`
6. Run `node copy.js` in the console to print usage

## Settings
To get the id of a guild open your client settings -> Appearance and then enable developer mode. If you now right click on a guild you can select 'Copy ID'.

| Variable | Explanation |
| --- | --- |
| originalGuildId | The id of the guild you want to clone. Can be left blank if a guildData.json file already exists. |
| newGuildId | The id of the new guild you want to clone to. |
| newGuildAdminRoleId | The id of a role with administrator permissions. The bot needs to have this role on the new guild! You can manually create a new role called 'guildcopy' and the script will automatically use it. If you do so, just leave this field empty. |
| cleanup | default: true - Set this to false, to skip the cleanup phase on the new guild |
| copy.General | default: true - Set this to false to skip setting general guild data e.g. the guild's name or the icon |
| copy.RCC | default: true - RCC stands for roles & categories & channels. Set this to false to skip creating them altogether |
| copy.Emojis | default: false - Set to true to copy emojis (see also [Common Behaviour](https://github.com/Jisagi/Discord-guild-copy#common-behaviour)) |
| copy.Bans | default: false - Set to true to copy banned users. The bot needs to have the BAN_MEMBERS permission on the original guild if you enable this! |
| language | default: en - Set this to any supported language from the `translations` folder |
| output | default: all - Possible values: `all` for everything, `error` for errors only, `none` for no output at all |
| djsVersionCheck | default: true - Checks the local discord.js version by its commit hash. If you periodically run this script, you might want to disable this |
| sleepTimeout | default: 0 - Sleep timer in milliseconds (>0) to avoid possible ratelimits on very large guilds creations  |
| debug | default: false - Set to true for a more detailed general and error output e.g. when creating an issue |
| token | The bot token. The bot does not need any permissions on the original guild (only exception: copy.Bans=true). |

## Common Behaviour
- New guild cleanup
  - Emoji Creation/Deletion: This will take time, especially if there are lots of them. Expect a few rateLimits when 'debug' is on. If 'copyEmojis' is disabled, emojis on the new server won't be deleted or new ones added. Emojis can only be created, if the original ones still exist on their respective server, bcause they are not saved locally or the back file
  - Bans Creation/Deletion: see 'Emoji Creation/Deletion' above
  - Channel Deletion: The client might still show deleted channels despite them already being deleted. To fix this, just restart your discord client. You can do this while the script is running.
- Region
  - Some guilds have VIP regions which cannot be used by normal guilds. Therefore if you copy such a guild the region will be set to us-central.
- Nitro Boosted Guild
  - If you backup a nitro boosted guild, this backup can still be loaded on any non or lower boosted guild. The script will automatically scale down the voice channel bitrates and the amount of possible emojis. The same goes for the guild splash and banner.
  - The Tier 3 vanity URL will not be backed up or copied to a new guild!

## Issues
Most of the common issues are displayed in the console while running the script. If you encounter crashes or any other weird behaviour not listed [here](https://github.com/Jisagi/Discord-guild-copy#common-behaviour) feel free to create an [issue](https://github.com/Jisagi/Discord-guild-copy/issues/new). The script creates logs in the 'logs' folder. Feel free to upload those to something like [pastebin](https://pastebin.com/) and add them to the created issue to help me find the problem.

## Can I suggest new features (or complain about ugly code)
Of course, just create an [issue](https://github.com/Jisagi/Discord-guild-copy/issues/new) or a [pull request](https://github.com/Jisagi/Discord-guild-copy/compare).

## Translation Guide
If you want to help translate the script, feel free do so so. Just create a copy of the `en.json` in the `translation` folder and create a pull request with the new translation. All `[@@X@@]` statements are dynamic parts of a sentence and need to be in the correct spot for each language numbered with 1,2,3,... Please test your translation at least once before submitting it and don't forget to change the langcode/language/author at the top of the file.

## License
This software is licensed under the terms of the GPLv3. For more details see [LICENSE](https://github.com/Jisagi/Discord-guild-copy/blob/master/LICENSE).

## Credits
- [EmberVulpix](https://github.com/EmberVulpix) for the command line arguments
- [TheLightSpirit](https://github.com/TheLightSpirit) for the french README translation (not always up-to-date)
- Everybody who helps adding new features and finding bugs!