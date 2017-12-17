# Discord guild copy

## Information
Did you ever want to create a copy of a guild? Now you can! There is no need to manually create roles, channels and permissions, which can take very long depending on the original guilds size. The script does everything for you. It backs up a guild into a single file and lets you create a new guild from it. You can share your file with others, too.

### What will be copied
- Categories
- Text & Voice channels
- Roles (also managed ones)
- Role permissions for categories and text/voice channels (no user specific ones)
- Emojis (see [Disclaimer](https://github.com/Jisagi/Discord-guild-copy#disclaimer))

### What will not be copied
- Chat history
- Bans
- Invites
- Webhooks
- Audit Logs
- Third party integrations (Twitch/Youtube)

## What do I need
- [Node.js](https://nodejs.org/) any version >= 8.0.0 should work (discord.js is the limiting factor here)
- [discord.js](https://github.com/hydrabolt/discord.js) The latest version **_not the stable release._** ([Explanation](https://github.com/Jisagi/Discord-guild-copy#why-using-120-dev-and-not-the-stable-release))
  - This will automatically be downloaded. See Installation for more information.
- A Discord account with a bot user
  - Discord Developer page [link](https://discordapp.com/developers/applications/me) to create a bot
- A preferably empty guild which can be overwritten

## Disclaimer
**_Use this script at your own risk!_**

Discord has a strict policy on user bots and also a lower rate limit. The script executes quite a few api calls, therefore the execution on a user account is blocked at least to a certain point (see below). If you provide a user account token the script will backup the original guild and save it to a file but then stop the execution with a warning. From there on you just replace the user token with a bot token and rerun the script. It will automatically load the backup file and do its job.

The most problematic part are the emojis. The deletion and creation of a guild with maxed out emojis will hit the rate limit. By default emojis will not be copied over to the new guild. If you only have around 25 or less emojis you might not run into a rate limit. I don't recommend using this if you have more.

## Installation & Usage
1. Download the repository from github
2. Unzip it
3. Navigate into the extracted folder
4. Edit the `settings.json` and fill in all necessary data (see [Settings](https://github.com/Jisagi/Discord-guild-copy#settings) for more information)
5. Open the console and run `npm install` (on windows you can shift + right click inside project folder folder and select 'open command prompt here')
6. Run `node copy.js` in the console to start the script

## Settings
To get the id of a guild go into your discord client settings > Appearance and enable developer mode. If you now right click on a guild you can select 'Copy ID'.

| Variable | Explanation |
| --- | --- |
| originalGuildId | The id of the guild you want to clone. Can be left blank if a guildData.json already exists. |
| newGuildId | The id of the new guild you want to clone to. |
| newGuildAdminRoleId | The id of a role with administrator permissions. The bot needs to have this role on the new guild! You can manually create a new role called 'guildcopy' and the script will automatically use it. If you do so, just leave this field empty. |
| copyEmojis | default: false - set to true to copy emojis (see [Disclaimer](https://github.com/Jisagi/Discord-guild-copy#disclaimer)) |
| debug | default: false - set to true for a more detailed general and error output e.g. when creating an issue |
| token | Your account token. The user/bot does not need any permissions on the original guild. |

## Common Behaviour
- New guild cleanup
  - Emoji Deletion: This will take time, especially if there are lot of them. Expect at least a few minutes if there are more than 30. You can either delete them manually and then running the script or using a completely new and empty guild altogether.
  - Channel Deletion: The client might still show deleted channels despite them already being deleted. To fix this, just restart your discord client. You can do this while the script is running.
- Region
  - Some guilds have VIP regions which cannot be used by normal guilds. Therefore if you copy such a guild the region will be set to us-central.

## Why using 12.0-dev and not the stable release
The latest stable release 11.2.1 does not support categories yet and the upcoming 11.3 release does not support some features concerning Permission Overwrites. As soon as 12.0 get its stable release I will change this.

I try to check new commits for changes which might break something but if I miss one, feel free to remind me ;D

## Issues
Most of the common issues are displayed in the console while running the script. If you encounter crashes or any other weird behaviour not listed [here](https://github.com/Jisagi/Discord-guild-copy#common-behaviour) feel free to create an [issue](https://github.com/Jisagi/Discord-guild-copy/issues/new).

### Can I suggest new features (or complain about ugly code)
Of course, just create an [issue](https://github.com/Jisagi/Discord-guild-copy/issues/new) or a [pull request](https://github.com/Jisagi/Discord-guild-copy/compare).

## License
This software is licensed under the terms of the GPLv3. For more details see [LICENSE](https://github.com/Jisagi/Discord-guild-copy/blob/master/LICENSE).
