<template>
	<UIcon
		:name="iconName"
		:class="iconClass"
		class="flex-shrink-0"
	/>
</template>

<script lang="ts" setup>
/**
 * StatusIcon Component
 *
 * Displays status icons with appropriate styling based on status type.
 *
 * @author Ismael Garcia <leamsigc@leamsigc.com>
 * @version 0.0.1
 */

	interface Props {
		status: "pending" | "processing" | "completed" | "error"
		size?: "sm" | "md" | "lg"
	}

	const props = withDefaults(defineProps<Props>(), {
		size: "md"
	});

	const sizeClasses = {
		sm: "w-4 h-4",
		md: "w-5 h-5",
		lg: "w-6 h-6"
	};

	const iconName = computed(() => {
		switch (props.status) {
		case "pending":
			return "i-heroicons-clock";
		case "processing":
			return "i-heroicons-cog-6-tooth";
		case "completed":
			return "i-heroicons-check-circle";
		case "error":
			return "i-heroicons-exclamation-circle";
		default:
			return "i-heroicons-clock";
		}
	});

	const iconClass = computed(() => {
		const baseClass = sizeClasses[props.size];
		const statusClass = {
			pending: "text-gray-500",
			processing: "text-blue-600 animate-spin",
			completed: "text-green-600",
			error: "text-red-600"
		}[props.status];

		return `${baseClass} ${statusClass}`;
	});
</script>
