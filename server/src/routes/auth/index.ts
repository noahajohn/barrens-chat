import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { CallbackQuerystring, MeResponse } from './schema.js'

const DISCORD_API = 'https://discord.com/api/v10'
const DISCORD_AUTH_URL = 'https://discord.com/api/oauth2/authorize'

const authRoutes: FastifyPluginAsyncTypebox = async (fastify) => {
  // GET /auth/discord — redirect to Discord OAuth
  fastify.get('/discord', async (request, reply) => {
    const params = new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID!,
      redirect_uri: process.env.DISCORD_REDIRECT_URI!,
      response_type: 'code',
      scope: 'identify',
    })
    return reply.redirect(`${DISCORD_AUTH_URL}?${params.toString()}`)
  })

  // GET /auth/discord/callback — handle OAuth callback
  fastify.get(
    '/discord/callback',
    { schema: { querystring: CallbackQuerystring } },
    async (request, reply) => {
      const { code } = request.query

      // Exchange code for access token
      const tokenResponse = await fetch(`${DISCORD_API}/oauth2/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.DISCORD_CLIENT_ID!,
          client_secret: process.env.DISCORD_CLIENT_SECRET!,
          grant_type: 'authorization_code',
          code,
          redirect_uri: process.env.DISCORD_REDIRECT_URI!,
        }),
      })

      if (!tokenResponse.ok) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
        return reply.redirect(`${frontendUrl}/login?error=auth_failed`)
      }

      const tokenData = (await tokenResponse.json()) as { access_token: string }

      // Fetch user profile from Discord
      const userResponse = await fetch(`${DISCORD_API}/users/@me`, {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      })

      if (!userResponse.ok) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
        return reply.redirect(`${frontendUrl}/login?error=auth_failed`)
      }

      const discordUser = (await userResponse.json()) as {
        id: string
        username: string
        avatar: string | null
      }

      const avatarUrl = discordUser.avatar
        ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
        : null

      // Upsert user in database
      const user = await fastify.prisma.user.upsert({
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

      // Sign JWT and set cookie
      const token = fastify.jwt.sign({
        id: user.id,
        username: user.username,
        avatarUrl: user.avatarUrl,
      })

      const isProduction = process.env.NODE_ENV === 'production'
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'

      return reply
        .setCookie('token', token, {
          path: '/',
          httpOnly: true,
          secure: isProduction,
          sameSite: isProduction ? 'strict' : 'lax',
          maxAge: 7 * 24 * 60 * 60, // 7 days
        })
        .redirect(`${frontendUrl}/`)
    },
  )

  // POST /auth/logout — clear session cookie
  fastify.post('/logout', async (request, reply) => {
    return reply
      .clearCookie('token', { path: '/' })
      .send({ message: 'Logged out' })
  })

  // GET /auth/me — return current user info
  fastify.get(
    '/me',
    {
      onRequest: [fastify.authenticate],
      schema: { response: { 200: MeResponse } },
    },
    async (request) => {
      return {
        id: request.user.id,
        username: request.user.username,
        avatarUrl: request.user.avatarUrl,
      }
    },
  )
}

export default authRoutes
