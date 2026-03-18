import type { Config } from 'tailwindcss'
import baseConfig from '@postulo/tailwind-config'

const config: Config = {
  ...baseConfig,
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
}

export default config
