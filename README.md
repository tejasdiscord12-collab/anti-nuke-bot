# Discord Anti-Nuke Bot

A production-ready Discord bot built with `discord.js` (latest stable) to protect your server from nuking, mass bans, admin abuse, and role/channel destruction.

## 🛡️ Key Features

- **Administrator Protection**: Instantly bans anyone gaining Admin permissions who isn't a trusted owner.
- **Channel Protection**: Automatically restores deleted channels and bans the executor.
- **Role Protection**: Prevents unauthorized creation or modification of Administrator roles.
- **Mass Ban Protection**: Detects and stops mass ban attempts (3 bans in 10 seconds).
- **Anti-Ban/Anti-Kick**: Restricts moderation actions to specified `OWNER_IDS`.
- **Comprehensive Logging**: Detailed security logs for every incident.

## 🚀 Setup Instructions

1.  **Clone/Download** the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure your environment:
    - Edit `.env` with your `TOKEN` and `SECURITY_LOG_CHANNEL_ID`.
    - Edit `config.js` to add your `OWNER_IDS` (already populated for you if provided).
4.  **Permissions**:
    - Ensure the bot has the `Administrator` permission.
    - **CRITICAL**: The bot's role must be at the **VERY TOP** of the role hierarchy to manage and ban other administrators.
5.  Run the bot:
    ```bash
    node index.js
    ```

## ⚙️ Configuration

Settings can be adjusted in `config.js`:
- `MASS_BAN_LIMIT`: Max bans allowed before punishment.
- `MASS_BAN_TIME_WINDOW`: Timeframe for the mass ban limit (in milliseconds).
- `OWNER_IDS`: Array of Discord IDs allowed to perform sensitive actions.

## 📜 Logging System

All security actions are logged with:
- Executor details
- Target details
- Action taken
- Timestamp (UTC)
- Result (Banned/Reverted/Blocked)
