import { Type, type Static } from '@sinclair/typebox'
import { Value } from '@sinclair/typebox/value'

const EnvSchema = Type.Object({
  DATABASE_URL: Type.String(),
  DISCORD_CLIENT_ID: Type.String(),
  DISCORD_CLIENT_SECRET: Type.String(),
  DISCORD_REDIRECT_URI: Type.String(),
  JWT_SECRET: Type.String({ minLength: 32 }),
  FRONTEND_URL: Type.String(),
  PORT: Type.String({ default: '3000' }),
  NODE_ENV: Type.Union(
    [Type.Literal('development'), Type.Literal('production'), Type.Literal('test')],
    { default: 'development' },
  ),
})

export type Env = Static<typeof EnvSchema>

export function loadEnv(): Env {
  return Value.Decode(EnvSchema, process.env)
}
