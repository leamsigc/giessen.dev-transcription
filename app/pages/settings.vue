<template>
	<UContainer class="py-8">
		<div class="max-w-2xl mx-auto">
			<h1 class="text-3xl font-bold mb-8">
				Settings
			</h1>

			<UCard class="mb-6">
				<template #header>
					<h2 class="text-xl font-semibold">
						Microphone Settings
					</h2>
				</template>

				<div class="space-y-4">
					<div>
						<label class="block text-sm font-medium mb-2">Select Microphone:</label>
						<USelect
							v-model="selectedMicrophone" :options="microphoneOptions" placeholder="Choose a microphone"
							class="w-full"
						/>
					</div>

					<div v-if="microphones.length === 0" class="text-gray-500">
						No microphones detected. Please connect a microphone and refresh the page.
					</div>

					<div class="flex gap-2">
						<UButton variant="outline" size="sm" @click="getMicrophones">
							Refresh Microphones
						</UButton>
						<UButton color="primary" size="sm" @click="saveSettings">
							Save Settings
						</UButton>
					</div>
				</div>
			</UCard>

			<UCard>
				<template #header>
					<h2 class="text-xl font-semibold">
						About
					</h2>
				</template>

				<p class="text-gray-600 mb-4">
					Configure your microphone settings for voice transcription.
				</p>
				<UButton color="primary" @click="requestMicrophonePermission">
					Request permission
				</UButton>
			</UCard>
		</div>
	</UContainer>
</template>

<script lang="ts" setup>
	const { selectedMicrophone, microphones, getMicrophones, saveMicrophoneSelection, loadMicrophoneSelection, requestMicrophonePermission } = useMicrophone();

	const microphoneOptions = computed(() => {
		return microphones.value.map((mic) => ({
			label: mic.label || `Microphone ${mic.deviceId?.slice(0, 8) || "Unknown"}`,
			value: mic.deviceId || mic.label || "default"
		}));
	});

	const saveSettings = () => {
		saveMicrophoneSelection();
	};

	onMounted(() => {
		loadMicrophoneSelection();
		getMicrophones();
	});
</script>
