# Application Requirements Document

## Overview
This document outlines the core requirements and specifications for the Giessen.dev Transcriber application. It serves as the authoritative source of truth for all development operations and ensures consistent understanding of the application's purpose, functionality, and constraints.

## Application Purpose
The Giessen.dev Transcriber is a desktop voice transcription application built with Nuxt.js and Tauri that allows users to:
- Transcribe audio files (primarily MP3) using AI models
- Manage transcriptions through a full CRUD interface
- Process multiple files in a queue
- Export transcriptions in various formats

## Core Requirements

### 1. Background Processing
**Requirement**: Every transcription must be processed in the background without blocking the user interface.

**Implementation Details**:
- Use Web Workers for transcription processing
- Support sequential processing of multiple files in a queue
- Provide real-time progress updates and streaming results
- Allow users to continue interacting with the app during processing

### 2. Completion Handling
**Requirement**: When a transcription completes, the system must:
- Automatically save the transcription to the persistent store (`useTauriStoreLoad`)
- Display a notification/toast to inform the user (`useToast`)
- Update the ongoing transcriptions status
- Make the transcription immediately available for CRUD operations

**Implementation Details**:
- Worker sends "completed" message with transcription data
- Main thread listener processes completion and triggers callbacks
- Use both Tauri native notifications and toast fallbacks
- Persist data using Tauri's store API with localStorage fallback

### 3. CRUD Operations
**Requirement**: Users must be able to perform full CRUD operations on completed transcriptions through the dedicated transcriptions page (`@app/pages/transcriptions.vue`).

**Required Operations**:
- **Create**: Allow manual creation of transcriptions
- **Read**: Display all transcriptions with metadata (timestamp, language, model, duration)
- **Update**: Provide in-line editing with formatting tools (bold, italic, timestamps)
- **Delete**: Allow deletion with confirmation

**Additional Features**:
- Export transcriptions (text, JSON, with timestamps)
- Re-transcribe with timestamps
- Search and filter capabilities

## Technical Architecture

### Frontend Framework
- **Nuxt.js 4**: Modern Vue.js framework with SSR/SSG capabilities
- **Vue 3**: Composition API with `<script setup>` syntax
- **TypeScript**: Strict typing for all code
- **NuxtUI**: Beautiful UI component library
- **Radix Vue**: Accessible component primitives
- **TailwindCSS**: Utility-first CSS framework

### Desktop Integration
- **Tauri**: Cross-platform desktop application framework
- **Rust Backend**: For system integration and performance
- **Web Workers**: For background transcription processing

### State Management
- **Pinia**: For complex state management (when needed)
- **VueUse**: Essential Vue composition utilities
- **Custom Composables**: For specific functionality (useTranscriber, useTauriStoreLoadCustom, etc.)

### AI/ML Integration
- **Hugging Face Transformers**: For transcription models
- **ONNX Runtime**: Optimized model execution
- **Multiple Models**: Support for various Whisper models (tiny, small, medium, large, etc.)
- **Language Support**: English and multilingual models

## Key Features

### File Processing
- Drag-and-drop interface for MP3 files
- Batch processing with queue management
- File validation (MP3 only)
- Progress tracking with visual indicators
- Streaming transcription results

### Transcription Management
- Persistent storage of transcriptions
- Metadata tracking (language, model, duration, timestamp)
- Rich text editing capabilities
- Export functionality (multiple formats)
- Search and organization tools

### User Experience
- Responsive design with mobile-first approach
- Real-time notifications and toasts
- Error handling with user-friendly messages
- Loading states and progress indicators
- Accessibility considerations

## Data Persistence
- **Primary**: Tauri store (transcriptions.json)
- **Fallback**: localStorage for web environments
- **Structure**: JSON-based storage with metadata
- **Synchronization**: Automatic save on all CRUD operations

## Performance Requirements
- **Background Processing**: Non-blocking UI during transcription
- **Memory Management**: Efficient handling of large audio files
- **Model Loading**: Lazy loading and caching of AI models
- **Streaming**: Real-time results for long audio files
- **Chunking**: Process long audio files in segments

## Security Considerations
- **Input Validation**: Validate all file uploads and user inputs
- **No Sensitive Data Exposure**: Never log or expose API keys, tokens, or sensitive information
- **Secure File Handling**: Safe processing of user-uploaded audio files
- **HTTPS**: Use secure connections for external API calls (when applicable)

## Development Guidelines

### Code Style
- Use TypeScript for all code
- Follow Vue 3 Composition API patterns
- Prefer composition functions over options API
- Use descriptive variable names with auxiliary verbs (e.g., `isLoading`, `hasError`)
- Structure files: exported component, composables, helpers, static content, types

### Naming Conventions
- Lowercase with dashes for directories (e.g., `components/auth-wizard`)
- PascalCase for component names (e.g., `AuthWizard.vue`)
- camelCase for composables (e.g., `useAuthState.ts`)

### Component Template Structure
```vue
<template>
	<Content here />
</template>

<script lang="ts" setup>
/**
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

## Animation Guidelines
Use `@vueuse/motion/nuxt` module with these presets:
- `v-motion-fade` - Basic fade animation
- `v-motion-fade-visible` - Fade when element becomes visible
- `v-motion-roll-bottom` - Roll in from bottom
- `v-motion-pop` - Pop/scale animation
- `v-motion-slide-bottom` - Slide in from bottom

## File Structure
```
app/
├── assets/
│   ├── css/
│   ├── icons/
│   └── workers/
│       └── transcriptionWorker.js
├── components/
│   ├── Design/
│   ├── Layout/
│   └── Site/
├── composables/
├── layouts/
├── middleware/
├── modules/
├── pages/
├── store/
└── types/
```

## Testing Requirements
- Unit tests for composables and utilities
- Component tests for critical UI elements
- Integration tests for transcription workflow
- E2E tests for complete user journeys

## Deployment
- **Development**: `pnpm run dev`
- **Build**: `pnpm run build`
- **Tauri Dev**: `pnpm run tauri:dev`
- **Tauri Build**: `pnpm run tauri:build`

## Quality Assurance
- Run `pnpm run lint` before committing
- Ensure all TypeScript types are properly defined
- Follow established naming conventions
- Test components and features thoroughly
- Verify Core Web Vitals (LCP, CLS, FID)

---

*This document must be referenced for all development operations to ensure compliance with application requirements and maintain consistency across the codebase.*</content>
</xai:function_call name="todowrite">
<parameter name="todos">[{"content": "Create comprehensive REQUIREMENTS.md document with application specifications", "status": "completed", "priority": "high", "id": "create-requirements-doc"}]
