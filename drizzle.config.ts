import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/main/db/schema.ts',
  out: './.drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: './dev.db' // only used by drizzle-kit locally; runtime uses userData path
  }
})
