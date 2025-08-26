<template>
	<div class="p-4 bg-blue-50 rounded-lg border border-blue-200">
		<div class="flex items-center gap-3">
			<UIcon name="i-heroicons-cog-6-tooth" class="w-5 h-5 text-blue-600 animate-spin" />
			<div class="flex-1">
				<p class="font-semibold text-blue-800">
					Processing: {{ fileName }}
				</p>
				<ProgressBar :progress="progress" />
			</div>
		</div>

		<!-- Streaming Transcription Display -->
		<StreamingTranscription
			v-if="isStreaming"
			:text="streamingResult?.text"
			class="mt-4"
		/>
	</div>
</template>

<script lang="ts" setup>
/**
 * ProcessingStatus Component
 *
 * Displays current processing status with progress and streaming transcription.
 *
 * @author Ismael Garcia <leamsigc@leamsigc.com>
 * @version 0.0.1
 */

	interface Props {
		fileName: string
		progress: number
		isStreaming?: boolean
		streamingResult?: { text?: string } | null
	}

	withDefaults(defineProps<Props>(), {
		isStreaming: false,
		streamingResult: null
	});
</script>
