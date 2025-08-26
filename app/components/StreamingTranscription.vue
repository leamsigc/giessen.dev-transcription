<template>
	<div class="p-3 bg-white rounded border border-blue-300">
		<div class="flex items-center gap-2 mb-2">
			<UIcon name="i-heroicons-chat-bubble-left-right" class="w-4 h-4 text-blue-600" />
			<span class="text-sm font-medium text-blue-800">{{ title }}</span>
		</div>
		<div class="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
			{{ displayText }}
			<span v-if="showCursor" class="inline-block w-2 h-4 bg-blue-600 ml-1 animate-pulse" />
		</div>
	</div>
</template>

<script lang="ts" setup>
/**
 * StreamingTranscription Component
 *
 * Displays streaming transcription text with loading cursor.
 *
 * @author Ismael Garcia <leamsigc@leamsigc.com>
 * @version 0.0.1
 */

	interface Props {
		text?: string
		title?: string
		placeholder?: string
		showCursor?: boolean
	}

	const props = withDefaults(defineProps<Props>(), {
		title: "Live Transcription:",
		placeholder: "Initializing transcription...",
		showCursor: true
	});

	const displayText = computed(() => {
		return props.text || props.placeholder;
	});
</script>
