import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import boundaries from "eslint-plugin-boundaries";
import importPlugin from "eslint-plugin-import";
import promisePlugin from "eslint-plugin-promise";
import functionalPlugin from "eslint-plugin-functional";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "*.config.mjs",
    "*.config.ts",
  ]),
  {
    plugins: {
      "boundaries": boundaries,
      "import": importPlugin,
      "promise": promisePlugin,
      "functional": functionalPlugin,
    },
    settings: {
      "boundaries/elements": [
        { "type": "app", "pattern": "src/app/**/*" },
        { "type": "ui", "pattern": "src/components/**/*" },
        { "type": "logic", "pattern": "src/lib/**/*" }
      ]
    },
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          "selector": "Literal[value=/(?:^|\\s|:)(?:bg|text|border|fill|stroke|ring|shadow)-\\[.*#[0-9a-fA-F]+.*\\]/]",
          "message": "FAIL LOUDLY: Arbitrary hex code classes are strictly banned. Use centralized EVE NeoCom tokens (e.g., bg-zinc-950)."
        },
        {
          "selector": "TemplateElement[value.raw=/(?:^|\\s|:)(?:bg|text|border|fill|stroke|ring|shadow)-\\[.*#[0-9a-fA-F]+.*\\]/]",
          "message": "FAIL LOUDLY: Arbitrary hex code classes are strictly banned in template strings. Use centralized EVE NeoCom tokens."
        },
        {
          "selector": "Literal[value=/(?:^|\\s|:)(?:bg|text)-(?:white|black)(?=\\s|$)/]",
          "message": "FAIL LOUDLY: Generic white/black utilities are BANNED. Use appropriate EVE NeoCom tokens like bg-zinc-950."
        },
        {
          "selector": "TemplateElement[value.raw=/(?:^|\\s|:)(?:bg|text)-(?:white|black)(?=\\s|$)/]",
          "message": "FAIL LOUDLY: Generic white/black utilities are BANNED in template strings. Use appropriate EVE NeoCom tokens."
        },
        {
          "selector": "Literal[value=/(?:^|\\s|:)(?:bg|text|border|from|to|fill|stroke|ring)-(?:slate|gray|neutral|stone|indigo|purple)-(?:\\d{2,3})/]",
          "message": "FAIL LOUDLY: Generic 'AI-slop' colors are BANNED. Use EVE NeoCom theme tokens (e.g., bg-zinc-950, glowing amber/cyan accents)."
        },
        {
          "selector": "TemplateElement[value.raw=/(?:^|\\s|:)(?:bg|text|border|from|to|fill|stroke|ring)-(?:slate|gray|neutral|stone|indigo|purple)-(?:\\d{2,3})/]",
          "message": "FAIL LOUDLY: Generic 'AI-slop' colors are BANNED in template strings. Use EVE NeoCom theme tokens."
        },
        {
          "selector": "CallExpression[callee.name='useContext']",
          "message": "FAIL LOUDLY: useContext is banned in React 19. Use the new 'use()' API instead."
        },
        {
          "selector": "Literal[value=/(?:^|\\s|:)(?:rounded(?:-(?:sm|md|lg|xl|2xl|3xl))?|shadow-(?:sm|md|lg|xl|2xl|inner))(?=\\s|$)/]",
          "message": "FAIL LOUDLY: Generic rounding and soft shadows are BANNED. Use sharp corners and glowing accents to match the EVE aesthetic."
        },
        {
          "selector": "TemplateElement[value.raw=/(?:^|\\s|:)(?:rounded(?:-(?:sm|md|lg|xl|2xl|3xl))?|shadow-(?:sm|md|lg|xl|2xl|inner))(?=\\s|$)/]",
          "message": "FAIL LOUDLY: Generic rounding and soft shadows are BANNED in template strings. Use sharp corners and glowing accents."
        },
        {
          "selector": "ImportSpecifier[imported.name='forwardRef']",
          "message": "FAIL LOUDLY: forwardRef is deprecated in React 19. Pass 'ref' as a standard prop."
        },
        {
          "selector": "AssignmentExpression[left.property.name='defaultProps']",
          "message": "FAIL LOUDLY: defaultProps is deprecated in React 19. Use ES6 default parameters."
        },
        {
          "selector": "Literal[value=/(?:^|\\s|:)(?:bg-gradient|from-|via-|to-)/]",
          "message": "FAIL LOUDLY: Gradients are strictly managed. Use pure solid colors or specific EVE-approved gradients only."
        },
        {
          "selector": "TSAnyKeyword",
          "message": "FAIL LOUDLY: 'any' type is strictly banned. Use 'unknown' or define a precise interface."
        },
        {
          "selector": "TSAsExpression:not(:has(TSTypeReference > Identifier[name='const']))",
          "message": "FAIL LOUDLY: 'as' type casting is BANNED (except 'as const'). Rely on type inference or Zod validation."
        },
        {
          "selector": "CatchClause > BlockStatement:not(:has(ThrowStatement)):not(:has(CallExpression[callee.object.name='console']))",
          "message": "FAIL LOUDLY: Catch blocks MUST NOT swallow errors silently. You must explicitly log (console.error) or re-throw."
        },
        {
          "selector": "ExpressionStatement > Literal[value='use server'], Directive > Literal[value='use server']",
          "message": "FAIL LOUDLY: 'use server' is strictly banned. Server Actions and Next.js backend features are not allowed."
        },
        {
          "selector": "MemberExpression[object.object.name='process'][object.property.name='env'][property.type='Identifier'][property.name!=/^NEXT_PUBLIC_/], MemberExpression[object.object.name='process'][object.property.name='env'][property.type='Literal'][property.value!=/^NEXT_PUBLIC_/]",
          "message": "FAIL LOUDLY: Accessing non-NEXT_PUBLIC_ environment variables is banned. EVE SSO tokens must be stored client-side."
        }
      ],
      "max-lines": ["warn", { "max": 200, "skipBlankLines": true, "skipComments": true }],
      "no-magic-numbers": ["error", { "ignore": [0, 1, -1] }],
      "no-empty": ["error", { "allowEmptyCatch": false }],
      "promise/catch-or-return": "error",
      "promise/no-return-wrap": "error",
      "no-restricted-imports": [
        "error",
        {
          "paths": [
            { "name": "next/server", "message": "FAIL LOUDLY: Server features are banned." },
            { "name": "next/headers", "message": "FAIL LOUDLY: Server features are banned." },
            { "name": "next/cache", "message": "FAIL LOUDLY: Server features are banned." },
            { "name": "fs", "message": "FAIL LOUDLY: Node.js backend features are banned." },
            { "name": "child_process", "message": "FAIL LOUDLY: Node.js backend features are banned." },
            { "name": "crypto", "message": "FAIL LOUDLY: Node.js backend features are banned." }
          ]
        }
      ],
      "import/no-cycle": "error",
      "boundaries/element-types": [
        "error",
        {
          "default": "disallow",
          "message": "${file.type} is not allowed to import ${dependency.type}",
          "rules": [
            {
              "from": "app",
              "allow": ["app", "ui", "logic"]
            },
            {
              "from": "ui",
              "allow": ["ui", "logic"]
            },
            {
              "from": "logic",
              "allow": ["logic"]
            }
          ]
        }
      ]
    }
  },
  {
    files: ["src/app/**/*.tsx", "src/components/**/*.tsx"],
    rules: {
      "no-restricted-globals": [
        "error",
        {
          "name": "localStorage",
          "message": "FAIL LOUDLY: Direct access to localStorage is banned in UI. Route it through the Zustand store."
        },
        {
          "name": "sessionStorage",
          "message": "FAIL LOUDLY: Direct access to sessionStorage is banned in UI. Route it through the Zustand store."
        }
      ],
      "no-restricted-properties": [
        "error",
        {
          "object": "window",
          "property": "location",
          "message": "FAIL LOUDLY: window.location access is banned in UI components. Delegate to the store or router."
        }
      ]
    }
  },
  {
    files: ["src/app/**/*.tsx", "src/components/**/*.tsx", "src/store/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          "paths": [
            {
              "name": "idb-keyval",
              "message": "FAIL LOUDLY: Direct idb-keyval imports are BANNED here. Encapsulate inside dedicated repositories (e.g., AuthRepository)."
            },
            { "name": "next/server", "message": "FAIL LOUDLY: Server features are banned." },
            { "name": "next/headers", "message": "FAIL LOUDLY: Server features are banned." },
            { "name": "next/cache", "message": "FAIL LOUDLY: Server features are banned." },
            { "name": "fs", "message": "FAIL LOUDLY: Node.js backend features are banned." },
            { "name": "child_process", "message": "FAIL LOUDLY: Node.js backend features are banned." },
            { "name": "crypto", "message": "FAIL LOUDLY: Node.js backend features are banned." }
          ]
        }
      ]
    }
  },
  {
    files: ["tests/**/*.ts", "tests/**/*.tsx", "src/**/*.test.ts", "src/**/*.test.tsx", "scripts/**/*.ts"],
    rules: {
      "no-magic-numbers": "off",
      "no-restricted-syntax": "off"
    }
  },
  {
    files: ["src/utils/**/*.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          "selector": "CallExpression[callee.object.name='Math'][callee.property.name='random']",
          "message": "FAIL LOUDLY: Math.random is banned in pure utility functions."
        },
        {
          "selector": "CallExpression[callee.object.name='Date'][callee.property.name='now']",
          "message": "FAIL LOUDLY: Date.now is banned in pure utility functions. Pass time as a parameter."
        },
        {
          "selector": "NewExpression[callee.name='Date'][arguments.length=0]",
          "message": "FAIL LOUDLY: new Date() is banned in pure utility functions. Pass time as a parameter."
        }
      ]
    }
  },
  {
    files: ["src/schemas/**/*.ts"],
    rules: {
      "functional/immutable-data": "error"
    }
  }
]);

export default eslintConfig;
