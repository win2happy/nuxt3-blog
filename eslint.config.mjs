import tailwind from "eslint-plugin-tailwindcss";
import withNuxt from "./.nuxt/eslint.config.mjs";

export default withNuxt(
  ...tailwind.configs["flat/recommended"],
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.vue"],
    rules: {
      "quotes": ["error", "double"],
      "semi": ["error", "always"],
      "prefer-promise-reject-errors": "off",
      "no-multi-spaces": ["error"],
      "no-undef": "off",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["error"],
      "@typescript-eslint/no-var-requires": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "typescript-config/strict": "off",
      "vue/multi-word-component-names": "off",
      "vue/no-multiple-template-root": "off",
      "vue/no-v-model-argument": "off",
      "vue/no-v-html": "off",
      "tailwindcss/no-custom-classname": ["warn", {
        "whitelist": [
          "daily-calendar",
          "daily-quote",
          "history-today",
          "history-item",
          "hot-trends",
          "platform-card",
          "trend-item",
          "news-quick-read",
          "news-item",
          "animate-modal-in",
          "news-aggregator"
        ]
      }]
    }
  }
);
