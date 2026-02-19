import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { CallbackQuerystring, MeResponse } from './schema.js'
import { exchangeDiscordCode, fetchDiscordUser, upsertDiscordUser } from '../../services/auth.js'

const DISCORD_AUTH_URL = 'https://discord.com/api/oauth2/authorize'

const authRoutes: FastifyPluginAsyncTypebox = async (fastify) => {
  const { env } = fastify

  const oauthConfig = {
    clientId: env.DISCORD_CLIENT_ID,
    clientSecret: env.DISCORD_CLIENT_SECRET,
    redirectUri: env.DISCORD_REDIRECT_URI,
  }

  // GET /auth/discord — redirect to Discord OAuth
  fastify.get('/discord', async (_request, reply) => {
    const params = new URLSearchParams({
      client_id: oauthConfig.clientId,
      redirect_uri: oauthConfig.redirectUri,
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

      const tokenData = await exchangeDiscordCode(oauthConfig, code)
      if (!tokenData) {
        return reply.redirect(`${env.FRONTEND_URL}/login?error=auth_failed`)
      }

      const discordUser = await fetchDiscordUser(tokenData.access_token)
      if (!discordUser) {
        return reply.redirect(`${env.FRONTEND_URL}/login?error=auth_failed`)
      }

      const user = await upsertDiscordUser(fastify.prisma, discordUser)

      const token = fastify.jwt.sign({
        id: user.id,
        username: user.username,
        avatarUrl: user.avatarUrl,
      })

      const isProduction = env.NODE_ENV === 'production'

      return reply
        .setCookie('token', token, {
          path: '/',
          httpOnly: true,
          secure: isProduction,
          sameSite: isProduction ? 'strict' : 'lax',
          maxAge: 7 * 24 * 60 * 60, // 7 days
        })
        .redirect(`${env.FRONTEND_URL}/`)
    },
  )

  // POST /auth/logout — clear session cookie
  fastify.post('/logout', async (_request, reply) => {
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
