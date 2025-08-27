import { computed, ref } from "vue";
import TranscriptionWorker from "@/assets/workers/transcriptionWorker?worker";

type WorkerStatus = "idle" | "loading" | "loaded" | "ready" | "transcribing" | "complete" | "done" | "unloaded" | "models" | "error";
interface ModelsOption {
	id: string
	name: string
	description: string
}

const getAudioData = async (audioFile: File): Promise<AudioBuffer> => {
	const arrayBuffer = await audioFile.arrayBuffer();
	const audioCTX = new AudioContext({
		sampleRate: 16000
	});
	const audioBuffer = await audioCTX.decodeAudioData(arrayBuffer);
	return audioBuffer;
};

const status = ref<WorkerStatus>("idle");
const worker = ref<Worker | null>(null);
const isInitialized = ref(false);

const selectedModel = ref("onnx-community/whisper-base_timestamped");
const modelsOptions = ref<ModelsOption[]>([]);

const progress = ref<number>(0);
const error = ref<string | null>(null);

const result = ref<any>(null);
const streamingResult = ref<any>(null);
const isStreaming = ref<boolean>(false);

// Store completion callbacks by transcription ID
const completionCallbacks = ref<Map<string, { onCompleted?: (result: any, metadata: any) => void, onError?: (error: string) => void }>>(new Map());

export const useTranscriber = () => {
	const initWorker = async () => {
		if (!worker.value) {
			worker.value = new TranscriptionWorker();
			if (!worker.value) {
				throw new Error("Failed to create worker");
			}

			worker.value.onmessage = (event) => {
				const { type, status: workerStatus, progress: workerProgress, error: workerError, result: workerResult, modelsOptions: availableModels, transcriptionId, fileName, language, model, fileSize } = event.data;
				console.log("event", event);
				console.log("event", availableModels);

				// Handle messages without type field (fallback for legacy messages)
				if (!type && workerStatus) {
					// Treat as status message
					status.value = workerStatus;
					if (workerProgress !== undefined) {
						progress.value = workerProgress;
					}
					// Handle ready status (model loaded successfully)
					if (workerStatus === "ready") {
						status.value = "loaded";
					}
					return;
				}

				switch (type) {
					case "models":
						modelsOptions.value = availableModels;
						break;
					case "status":
						status.value = workerStatus;
						if (workerProgress !== undefined) {
							progress.value = workerProgress;
						}
						// Start streaming when transcription begins
						if (workerStatus === "transcribing") {
							isStreaming.value = true;
							// Initialize streaming result if not already set
							if (!streamingResult.value) {
								streamingResult.value = { text: "" };
							}
						}
						// Handle ready status (model loaded successfully)
						if (workerStatus === "ready") {
							status.value = "loaded";
						}
						// Handle unloaded status
						if (workerStatus === "unloaded") {
							status.value = "idle";
							isInitialized.value = false;
						}
						// Handle completion status
						if (workerStatus === "complete") {
							isStreaming.value = false;
							streamingResult.value = null;
							result.value = workerResult;
							status.value = "done";
						}
						break;
					case "stream":
						streamingResult.value = workerResult;
						if (workerProgress !== undefined) {
							progress.value = workerProgress;
						}
						break;
					case "completed":
						// Set the final result
						result.value = workerResult;
						status.value = "done";
						isStreaming.value = false;
						streamingResult.value = null;

						// Handle automatic completion
						if (transcriptionId && completionCallbacks.value.has(transcriptionId)) {
							const callbacks = completionCallbacks.value.get(transcriptionId);
							if (callbacks?.onCompleted) {
								const metadata = {
									transcriptionId,
									fileName,
									language,
									model,
									fileSize
								};
								callbacks.onCompleted(workerResult, metadata);
							}
							completionCallbacks.value.delete(transcriptionId);
						}
						break;
					case "error":
						status.value = "error";
						error.value = workerError;
						isStreaming.value = false;
						// Call error callback if transcriptionId is provided
						if (transcriptionId && completionCallbacks.value.has(transcriptionId)) {
							const callbacks = completionCallbacks.value.get(transcriptionId);
							if (callbacks?.onError) {
								callbacks.onError(workerError);
							}
							completionCallbacks.value.delete(transcriptionId);
						}
						break;
					default:
						console.warn("Unknown worker message type:", type, event.data);
						break;
				}
			};
		}
	};

	const init = async () => {
		// Only initialize if not already done
		if (isInitialized.value) {
			return;
		}

		await initWorker();
		worker.value?.postMessage({ type: "loadModel", payload: { model: selectedModel.value } });
		isInitialized.value = true;
	};
	const run = async (audioFile: File, language: string, options?: {
		transcriptionId?: string
		fileName?: string
		onCompleted?: (result: any, metadata: any) => void
		onError?: (error: string, transcriptionId?: string) => void
	}) => {
		// Initialize if not already done
		if (!isInitialized.value || status.value === "idle") {
			await init();
		}

		// Store callbacks if transcriptionId is provided
		if (options?.transcriptionId) {
			completionCallbacks.value.set(options.transcriptionId, {
				onCompleted: options.onCompleted,
				onError: options.onError
			});
		}

		try {
			const audioBuffer = await getAudioData(audioFile);
			// Convert AudioBuffer to Float32Array for the worker
			const audioData = audioBuffer.getChannelData(0);
			worker.value?.postMessage({
				type: "transcribe",
				payload: {
					audio: audioData,
					language,
					model: selectedModel.value,
					transcriptionId: options?.transcriptionId,
					fileName: options?.fileName,
					fileSize: audioFile.size
				}
			});
		} catch (err) {
			error.value = (err as Error).message;
			status.value = "error";
			if (options?.onError) {
				options.onError((err as Error).message, options.transcriptionId);
			}
			// Clean up callbacks
			if (options?.transcriptionId) {
				completionCallbacks.value.delete(options.transcriptionId);
			}
		}
	};

	const getModels = async () => {
		await initWorker();
		worker.value?.postMessage({ type: "models" });
	};

	const resetInitialization = () => {
		isInitialized.value = false;
		status.value = "idle";
		error.value = null;
		progress.value = 0;
	};

	const unloadModel = () => {
		if (worker.value) {
			worker.value.postMessage({ type: "unloadModel" });
		}
		resetInitialization();
	};

	return {
		getModels,
		init,
		run,
		unloadModel,
		resetInitialization,
		isLoaded: computed(() => status.value === "loaded" || status.value === "done"),
		isRunning: computed(() => status.value === "transcribing"),
		isInitialized: computed(() => isInitialized.value),
		isStreaming: computed(() => isStreaming.value),
		modelsOptions,
		selectedModel,
		status,
		progress,
		error,
		result,
		streamingResult
	};
};
