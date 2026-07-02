# MAL to Discord Widget Sync

Sync public MyAnimeList profile stats to a Discord application profile widget.

## Requirements

| Item | Details |
| --- | --- |
| Runtime | Node.js 18 or newer |
| Source data | Public MyAnimeList profile |
| Destination | Discord application profile widget |

## Setup

| Step | Command | Notes |
| --- | --- | --- |
| Install dependencies | `npm install` | Installs the project packages |
| Create environment file | `.env` | Add the required values listed below before running the script |
| Start the sync | `npm start` | Runs the sync loop |

## Easy Discord Developer Portal Setup

If you want a faster Discord setup, you can use the included `discord_portal.json` file with [Discord_Widget_Configurator](https://github.com/ItzMeShadow999/Discord_Widget_Configurator).

This can help you import the Discord widget configuration without building everything manually in the Developer Portal.

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `MAL_USERNAME` | Yes | Public MyAnimeList username |
| `DISCORD_BOT_TOKEN` | Yes | Discord bot token used for the API request |
| `APPLICATION_ID` | Yes | Discord application ID |
| `DISCORD_USER_ID` | Yes | Target Discord user ID; non-digits are removed before use |

## Widget Layout

| Section | Fields |
| --- | --- |
| Upper widget | `username`, `joindate`, `dayswatched` |
| Grid | `watching`, `plantowatch`, `completed`, `dropped`, `onhold`, `totalwatched` |

## Notes

| Topic | Details |
| --- | --- |
| Sync interval | Runs on startup and then every 15 minutes |
| Source API | Uses Jikan to read public MyAnimeList data |
| Safety | Do not commit `.env` or real credentials |
| Development | AI assistance was used during development and documentation |
| Inspiration | This project was inspired by [mal-discord-widget](https://github.com/7Games/mal-discord-widget), the Python version of the same idea |

## License

This project is released under the MIT License. See [LICENSE](LICENSE) for details.