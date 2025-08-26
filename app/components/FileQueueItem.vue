<template>
	<div
		class="flex items-center gap-3 p-3 rounded-lg border"
		:class="statusClasses"
	>
		<!-- Status Icon -->
		<StatusIcon :status="fileItem.status" />

		<!-- File Info -->
		<div class="flex-1 min-w-0">
			<p class="font-medium truncate">
				{{ fileItem.file.name }}
			</p>
			<p class="text-sm text-gray-500">
				{{ formatFileSize(fileItem.file.size) }}
			</p>
			<p v-if="fileItem.result" class="text-sm text-green-700 mt-1">
				Transcription: {{ truncateText(fileItem.result, 100) }}
			</p>
			<p v-if="fileItem.error" class="text-sm text-red-700 mt-1">
				Error: {{ fileItem.error }}
			</p>

			<!-- Streaming result for currently processing file -->
			<StreamingTranscription
				v-if="fileItem.status === 'processing' && isStreaming"
				:text="streamingResult?.text"
				:show-cursor="!streamingResult?.text"
				title=""
				placeholder="Initializing transcription..."
				class="mt-2 p-2 bg-blue-50 rounded border border-blue-200"
			/>
		</div>

		<!-- Remove Button -->
		<UButton
			:disabled="fileItem.status === 'processing'"
			variant="ghost"
			color="error"
			size="sm"
			class="flex-shrink-0"
			@click="$emit('remove', index)"
		>
			<UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
		</UButton>
	</div>
</template>

<script lang="ts" setup>
/**
 * FileQueueItem Component
 *
 * Displays individual file item in the queue with status, info, and actions.
 *
 * @author Ismael Garcia <leamsigc@leamsigc.com>
 * @version 0.0.1
 */

	interface FileQueueItem {
		file: File
		status: "pending" | "processing" | "completed" | "error"
		result?: string
		error?: string
	}

	interface Props {
		fileItem: FileQueueItem
		index: number
		isStreaming?: boolean
		streamingResult?: { text?: string } | null
	}

	const props = withDefaults(defineProps<Props>(), {
		isStreaming: false,
		streamingResult: null
	});

	defineEmits<{
		remove: [index: number]
	}>();

	const statusClasses = computed(() => {
		return {
			"bg-gray-50 border-gray-200": props.fileItem.status === "pending",
			"bg-blue-50 border-blue-200": props.fileItem.status === "processing",
			"bg-green-50 border-green-200": props.fileItem.status === "completed",
			"bg-red-50 border-red-200": props.fileItem.status === "error"
		};
	});

	const formatFileSize = (bytes: number): string => {
		return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
	};

	const truncateText = (text: string, maxLength: number): string => {
		return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
	};
</script>
