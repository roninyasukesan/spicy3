const { FlatCompat } = require("@eslint/eslintrc")

const compat = new FlatCompat({
  baseDirectory: __dirname
})

module.exports = [
  {
    ignores: ["**/.next/**", "**/node_modules/**", "components/chat/chat-layout.tsx"]
  },
  ...compat.extends("next"),
  {
    rules: {
      "react/no-unescaped-entities": "off",
      "@next/next/no-page-custom-font": "off"
    }
  }
]
