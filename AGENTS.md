# Development Agent Guidelines

This document outlines the coding standards and development practices for the Giessen.dev Transcriber project.

## Agent Capabilities

The development agent is an expert in:
- **TypeScript** - Advanced type safety and modern syntax
- **Node.js** - Server-side JavaScript runtime
- **NuxtJS 4** - Modern Vue.js framework with SSR/SSG
- **Vue 3** - Progressive JavaScript framework
- **NuxtUI** - Beautiful UI component library
- **Radix Vue** - Accessible component primitives
- **VueUse** - Essential Vue composition utilities
- **TailwindCSS** - Utility-first CSS framework

## Code Style and Structure

### General Principles
- Write concise, technical TypeScript code with accurate examples
- Use composition API and declarative programming patterns
- Avoid options API in favor of composition API
- Prefer iteration and modularization over code duplication
- Use descriptive variable names with auxiliary verbs (e.g., `isLoading`, `hasError`)
- Structure files: exported component, composables, helpers, static content, types

### Naming Conventions
- Use lowercase with dashes for directories (e.g., `components/auth-wizard`)
- Use PascalCase for component names (e.g., `AuthWizard.vue`)
- Use camelCase for composables (e.g., `useAuthState.ts`)

## TypeScript Usage

### Best Practices
- Use TypeScript for all code
- Prefer types over interfaces for object definitions
- Avoid enums; use const objects instead
- Use Vue 3 with TypeScript, leveraging `defineComponent` and `PropType`

### Syntax and Formatting
- Use arrow functions for methods and computed properties
- Avoid unnecessary curly braces in conditionals
- Use concise syntax for simple statements
- Use template syntax for declarative rendering

## UI and Styling

### Framework Usage
- Use NuxtUI, Vue, Radix Vue, and Tailwind for components and styling
- Use as much Tailwind CSS as possible for styling
- Avoid custom CSS classes unless absolutely necessary
- Implement responsive design with Tailwind CSS using mobile-first approach

## Performance Optimization

### Nuxt-Specific Optimizations
- Leverage Nuxt's built-in performance optimizations
- Use Suspense for asynchronous components
- Implement lazy loading for routes and components
- Optimize images: use WebP format, include size data, implement lazy loading

### Core Web Vitals
- Optimize for LCP (Largest Contentful Paint)
- Optimize for CLS (Cumulative Layout Shift)
- Optimize for FID (First Input Delay)

## Key Conventions

### State Management
- Use Pinia for state management
- Leverage VueUse for common composables and utility functions
- Utilize Nuxt's auto-imports feature for components and composables

## Nuxt-Specific Guidelines

### Directory Structure
- Follow Nuxt 4 directory structure (e.g., `pages/`, `components/`, `composables/`)
- Use Nuxt's built-in features:
  - Auto-imports for components and composables
  - File-based routing in the `pages/` directory
  - Server routes in the `server/` directory
  - Leverage Nuxt plugins for global functionality

### Data Fetching
- Use `useFetch` and `useAsyncData` for data fetching
- Implement SEO best practices using Nuxt's `useHead` and `useSeoMeta`

## Vue 3 and Composition API Best Practices

### Component Structure
- Use `<script setup>` syntax for concise component definitions
- Leverage `ref`, `reactive`, and `computed` for reactive state management
- Use `provide`/`inject` for dependency injection when appropriate
- Implement custom composables for reusable logic

## Component Template

When creating new Vue files, use this template:

```vue
<template>
	<Content here />
</template>

<script lang="ts" setup>
/**
 *
 * Component Description: <The component description>
 *
 * @author Ismael Garcia <leamsigc@leamsigc.com>
 * @version 0.0.1
 *
 * @todo [ ] Test the component
 * @todo [ ] Integration test.
 * @todo [✔] Update the typescript.
 */
</script>

<style scoped>

</style>
```

## Feature Development Workflow

When creating a new feature, follow these steps:

1. **Create Feature Directory Structure**
   - Create `<FEATURE>` directory in `./app/pages/app/<FEATURE>/`
   - Create all necessary Vue routes (index, create, update)
   - Create translation JSON files for each route

2. **Create Composables**
   - Create `use<FEATURE>.ts` in `./app/composables/`
   - Create `use<FEATURE>Management.ts` for state management

3. **Create API Routes** (if needed)
   - Create `<FEATURE>.ts` in `./server/api/v1/<FEATURE>/` for CRUD operations
   - Create `<FEATURE>.ts` in `./server/services/` for business logic

4. **Database Integration**
   - Use server services for business logic and database operations
   - Implement proper error handling and validation

## Animation Guidelines

Use the `@vueuse/motion/nuxt` module for animations with these presets:

### Available Animation Presets
- `v-motion-fade` - Basic fade animation
- `v-motion-fade-visible` - Fade when element becomes visible
- `v-motion-fade-visible-once` - Fade once when element becomes visible
- `v-motion-roll-bottom` - Roll in from bottom
- `v-motion-roll-left` - Roll in from left
- `v-motion-roll-right` - Roll in from right
- `v-motion-roll-top` - Roll in from top
- `v-motion-pop` - Pop/scale animation
- `v-motion-slide-bottom` - Slide in from bottom
- `v-motion-slide-left` - Slide in from left
- `v-motion-slide-right` - Slide in from right
- `v-motion-slide-top` - Slide in from top

### Usage Examples
```vue
<div v-motion-fade />

<div v-motion-roll-bottom />

<div v-motion-pop-visible-once />
```

## Translation Usage

Always use the composable for translations:

```ts
const { t } = useI18n();
```

## Development Commands

### Available Scripts
- `pnpm run dev` - Start development server
- `pnpm run build` - Build for production
- `pnpm run lint` - Run ESLint
- `pnpm run tauri:dev` - Start Tauri development
- `pnpm run tauri:build` - Build Tauri application

### Code Quality
- Run `pnpm run lint` before committing
- Ensure all TypeScript types are properly defined
- Follow the established naming conventions
- Test components and features thoroughly

## Security Best Practices

- Never expose sensitive data in client-side code
- Validate all user inputs on both client and server
- Use HTTPS for all external API calls
- Implement proper error handling without exposing sensitive information
- Follow the principle of least privilege for API permissions

## Performance Monitoring

- Monitor Core Web Vitals in production
- Use Nuxt's built-in performance monitoring
- Optimize bundle size and loading times
- Implement proper caching strategies for AI models and static assets

---

*This agent follows the established coding standards and best practices for the Giessen.dev Transcriber project.*
