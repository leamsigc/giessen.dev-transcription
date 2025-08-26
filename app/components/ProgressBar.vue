<template>
	<div class="w-full bg-gray-200 rounded-full h-2">
		<div
			class="bg-blue-600 h-2 rounded-full transition-all duration-300"
			:style="{ width: `${progress}%` }"
		/>
	</div>
	<p v-if="showPercentage" class="text-sm text-blue-600 mt-1">
		{{ Math.round(progress) }}% complete
	</p>
</template>

<script lang="ts" setup>
/**
 * ProgressBar Component
 *
 * Displays a progress bar with optional percentage text.
 *
 * @author Ismael Garcia <leamsigc@leamsigc.com>
 * @version 0.0.1
 */

	interface Props {
		progress: number
		showPercentage?: boolean
	}

	withDefaults(defineProps<Props>(), {
		showPercentage: true
	});
</script>
