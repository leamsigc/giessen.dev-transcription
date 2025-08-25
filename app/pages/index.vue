<template>
	<UContainer class="relative overflow-hidden h-screen">
		<div class="grid size-full place-content-center gap-y-8">
			<SvgoLogo :filled="true" :font-controlled="false" class="mx-auto size-40" />

			<div class="flex flex-col items-center gap-y-3">
				<h1 class="animate-pulse text-3xl sm:text-4xl text-pretty font-bold font-heading md:mb-5">
					{{ app.name.toUpperCase() }}
				</h1>
				<p class="leading-7 text-pretty">
					Voice to Text Transcription
				</p>

				<div class="flex flex-col items-center gap-4">
					<div class="flex gap-2">
						<UButton :disabled="isRecording" color="primary" size="lg" @click="startRecording">
							<UIcon name="i-heroicons-microphone" class="w-5 h-5 mr-2" />
							Start Recording
						</UButton>
						<UButton :disabled="!isRecording" color="error" size="lg" @click="stopRecording">
							<UIcon name="i-heroicons-stop" class="w-5 h-5 mr-2" />
							Stop Recording
						</UButton>
					</div>

					<!-- Drag and Drop File Transcriber -->
					<div class="w-full max-w-2xl">
						<h3 class="text-lg font-semibold mb-4 text-center">
							Or Upload MP3 Files
						</h3>
						<DragDropFileTranscriber />
					</div>

					<!-- Recording View with Visual Wave Indicator -->
					<div v-if="isRecording" class="recording-view p-6 bg-red-50 rounded-lg border-2 border-red-200">
						<p class="text-red-600 font-semibold mb-4">
							🔴 Recording...
						</p>
						<canvas ref="waveCanvas" width="400" height="100" class="border rounded" />
					</div>

					<!-- Transcription Result -->
					<div
						v-if="transcriptionResult"
						class="transcription-result p-4 bg-green-50 rounded-lg border border-green-200 max-w-md"
					>
						<p class="font-semibold text-green-800 mb-2">
							Transcription:
						</p>
						<p class="text-green-700">
							{{ transcriptionResult }}
						</p>
					</div>

					<!-- Error Display -->
					<div v-if="error" class="error-message p-4 bg-red-50 rounded-lg border border-red-200">
						<p class="text-red-700">
							{{ error }}
						</p>
					</div>

					<!-- Model Selection -->
					<div class="model-selection">
						<!-- {{ modelsOptions }} -->
						<label class="block text-sm font-medium mb-2">Select Model:</label>
						<USelect
							v-model="selectedModel" value-key="value" :items="items" placeholder="Choose a model"
							class="w-64"
						/>
					</div>
				</div>
			</div>

			<div class="flex justify-center gap-4">
				<UButton to="/transcriptions" variant="outline">
					<UIcon name="i-heroicons-document-text" class="w-5 h-5 mr-2" />
					Transcriptions
				</UButton>
				<UButton to="/settings" variant="outline">
					<UIcon name="i-heroicons-cog-6-tooth" class="w-5 h-5 mr-2" />
					Settings
				</UButton>
				<UButton :to="app.repo">
					Star on GitHub
				</UButton>
			</div>
		</div>

		<div class="fixed bottom-6 text-sm absolute-center-h">
			<div class="flex items-center gap-1 text-(--ui-text-muted)">
				<p class="text-sm">
					Made by
				</p>
				<ULink :to="app.repo" external target="_blank">
					{{ app.author }}
				</ULink>
			</div>
		</div>
	</UContainer>
</template>

<script lang="ts" setup>
	const { app } = useAppConfig();
	const { run, init, status, progress, error, result, modelsOptions, selectedModel, getModels } = useTranscriber();
	const { selectedMicrophone, getMicrophoneStream, loadMicrophoneSelection } = useMicrophone();
	const { addTranscription } = useTauriStoreLoadCustom();

	const isRecording = ref(false);
	const transcriptionResult = ref("");
	const waveCanvas = ref<HTMLCanvasElement | null>(null);
	let mediaRecorder: MediaRecorder | null = null;
	let audioChunks: Blob[] = [];
	let animationId: number | null = null;
	const items = computed(() => {
		return modelsOptions.value.map((model) => {
			return {
				label: model.name,
				value: model.id
			};
		});
	});

	definePageMeta({
		layout: "home"
	});
	await getModels();
	loadMicrophoneSelection();
	// Listen to Tauri events
	onMounted(() => {
		// @ts-ignore
		if (window.TAURI_) {
			// @ts-ignore
			window.TAURI_.event.listen("start-recording", startRecording);
			// @ts-ignore
			window.TAURI_.event.listen("stop-recording", stopRecording);
		}
		init()
	});

	onUnmounted(() => {
		if (mediaRecorder) mediaRecorder.stop();
		if (animationId) cancelAnimationFrame(animationId);
	});

	const startRecording = async () => {
		if (isRecording.value) return;
		isRecording.value = true;
		audioChunks = [];

		try {
			const stream = await getMicrophoneStream(selectedMicrophone.value);
			if (!stream.value) {
				error.value = "Failed to get microphone stream";
				return;
			}
			mediaRecorder = new MediaRecorder(stream.value);

			mediaRecorder.ondataavailable = (e) => {
				if (e.data.size > 0) audioChunks.push(e.data);
			};

			mediaRecorder.onstop = async () => {
				// Show notification that transcription is starting
				showNotification("Transcription in Progress", "Your audio is being transcribed...");

				const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
				const audioFile = new File([audioBlob], "recording.webm", { type: "audio/webm" });
				await run(audioFile, "en"); // Transcribe with selected language
				transcriptionResult.value = result.value?.text || "";

				// Save transcription to store
				if (transcriptionResult.value) {
					await addTranscription({
						text: transcriptionResult.value,
						language: "en",
						model: selectedModel.value || "default",
						duration: audioChunks.length > 0 ? audioChunks.reduce((total, chunk) => total + chunk.size, 0) / 16000 : undefined // Rough estimate
					});
				}

				pasteToFocusedInput(transcriptionResult.value);
				isRecording.value = false;

				// Show notification that transcription is complete
				showNotification("Transcription Complete", "Your transcription is ready!");
			};

			mediaRecorder.start();
			drawWave(); // Start visual indicator
		} catch (err) {
			console.error("Error starting recording:", err);
			error.value = "Failed to start recording";
			isRecording.value = false;
		}
	};

	const stopRecording = () => {
		if (mediaRecorder && isRecording.value) {
			mediaRecorder.stop();
			mediaRecorder.stream.getTracks().forEach((track) => track.stop());
		}
	};

	const pasteToFocusedInput = (text: string) => {
		const activeElement = document.activeElement;
		if (activeElement && (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA")) {
			const inputElement = activeElement as HTMLInputElement | HTMLTextAreaElement;
			const start = inputElement.selectionStart || 0;
			const end = inputElement.selectionEnd || 0;
			inputElement.value = inputElement.value.substring(0, start) + text + inputElement.value.substring(end);
			inputElement.selectionStart = inputElement.selectionEnd = start + text.length;
			inputElement.focus();
		}
	};

	const drawWave = () => {
		if (!waveCanvas.value || !mediaRecorder?.stream) return;

		const canvas = waveCanvas.value;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const analyser = new AnalyserNode(new AudioContext(), { fftSize: 256 });
		const dataArray = new Uint8Array(analyser.frequencyBinCount);

		const source = new MediaStreamAudioSourceNode(new AudioContext(), { mediaStream: mediaRecorder.stream });
		source.connect(analyser);

		const draw = () => {
			analyser.getByteFrequencyData(dataArray);
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.fillStyle = "#ef4444"; // Red color for recording indicator

			dataArray.forEach((value, index) => {
				const barHeight = (value / 255) * canvas.height;
				const barWidth = canvas.width / dataArray.length;
				const x = index * barWidth;
				const y = canvas.height - barHeight;
				ctx.fillRect(x, y, barWidth - 1, barHeight);
			});

			animationId = requestAnimationFrame(draw);
		};
	};

	const showNotification = async (title: string, body: string) => {
		// @ts-ignore
		if (window.__TAURI__) {
			try {
				// @ts-ignore
				await window.__TAURI__.notification.sendNotification({
					title,
					body,
					icon: "icon.png"
				});
			} catch (error) {
				console.error("Error showing notification:", error);
			}
		} else {
			// Fallback for web environment
			if ("Notification" in window && Notification.permission === "granted") {
				new Notification(title, { body });
			} else if ("Notification" in window && Notification.permission !== "denied") {
				Notification.requestPermission().then((permission) => {
					if (permission === "granted") {
						new Notification(title, { body });
					}
				});
			}
		}
	};
</script>

<style scoped>
.recording-view {
	animation: pulse 2s infinite;
}

@keyframes pulse {
	0%, 100% {
		opacity: 1;
	}
	50% {
		opacity: 0.7;
	}
}

.transcription-result {
	max-width: 500px;
	word-wrap: break-word;
}

.model-selection {
	min-width: 300px;
}
</style>
