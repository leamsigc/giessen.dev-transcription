<template>
	<div>
		<SiteNavbar class="sticky bg-(--ui-bg)/75 backdrop-blur" />
		<SiteSidebar />

		<!-- Ongoing Transcriptions Banner -->
		<div v-if="hasOngoingTranscriptions" class="fixed top-0 left-0 right-0 z-50 bg-blue-600 text-white shadow-lg">
			<div class="px-4 py-2 flex items-center justify-between">
				<div class="flex items-center gap-3">
					<UIcon name="i-heroicons-cog-6-tooth" class="w-5 h-5 animate-spin" />
					<span class="font-medium">
						{{ ongoingTranscriptions.length }} transcription{{ ongoingTranscriptions.length > 1 ? 's' : '' }} in progress
					</span>
				</div>
				<div class="flex items-center gap-4">
					<div v-for="transcription in ongoingTranscriptions" :key="transcription.id" class="flex items-center gap-2">
						<span class="text-sm">{{ transcription.fileName }}</span>
						<div class="w-20 bg-blue-500 rounded-full h-2">
							<div
								class="bg-white h-2 rounded-full transition-all duration-300"
								:style="{ width: `${transcription.progress}%` }"
							/>
						</div>
						<span class="text-sm">{{ Math.round(transcription.progress) }}%</span>
					</div>
				</div>
			</div>
		</div>

		<UContainer :class="{ 'pt-12': hasOngoingTranscriptions }">
			<slot />
		</UContainer>
	</div>
</template>

<script lang="ts" setup>
	const { ongoingTranscriptions, hasOngoingTranscriptions } = useOngoingTranscriptions();
</script>
