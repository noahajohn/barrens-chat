import type { PrismaClient } from '../generated/prisma/client.js'

const DISCORD_API = 'https://discord.com/api/v10'

interface DiscordTokenResponse {
  access_token: string
}

interface DiscordUser {
  id: string
  username: string
  avatar: string | null
}

interface OAuthConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
}

export async function exchangeDiscordCode(
  config: OAuthConfig,
  code: string,
): Promise<DiscordTokenResponse | null> {
  const response = await fetch(`${DISCORD_API}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: config.redirectUri,
    }),
  })

  if (!response.ok) return null

  return (await response.json()) as DiscordTokenResponse
}

export async function fetchDiscordUser(accessToken: string): Promise<DiscordUser | null> {
  const response = await fetch(`${DISCORD_API}/users/@me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok) return null

  return (await response.json()) as DiscordUser
}

function buildAvatarUrl(discordId: string, avatar: string | null): string | null {
  return avatar ? `https://cdn.discordapp.com/avatars/${discordId}/${avatar}.png` : null
}

export async function upsertDiscordUser(
  prisma: PrismaClient,
  discordUser: DiscordUser,
) {
  const avatarUrl = buildAvatarUrl(discordUser.id, discordUser.avatar)

  return prisma.user.upsert({
    where: { discordId: discordUser.id },
    update: {
      username: discordUser.username,
      avatarUrl,
    },
    create: {
      discordId: discordUser.id,
      username: discordUser.username,
      avatarUrl,
    },
  })
}
