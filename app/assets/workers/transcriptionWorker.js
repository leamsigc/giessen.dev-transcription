import { pipeline } from "@huggingface/transformers";

const PER_DEVICE_CONFIG = {
    webgpu: {
        dtype: {
            encoder_model: 'fp32',
            decoder_model_merged: 'q4',
        },
        device: 'webgpu',
    },
    wasm: {
        dtype: 'q8',
        device: 'wasm',
    },
};

/**
 * This class uses the Singleton pattern to ensure that only one instance of the model is loaded.
 */
class PipelineSingleton {
    static model_id = 'onnx-community/whisper-base_timestamped';
    static instance = null;

    static async getInstance(progress_callback = null, device = 'wasm') {
        if (!this.instance) {
            this.instance = pipeline('automatic-speech-recognition', this.model_id, {
                ...PER_DEVICE_CONFIG[device],
                progress_callback,
            });
        }
        return this.instance;
    }
}

let transcriber = null;
let isEnglishModel = true;

const modelsOptions = [
	{
		id: "onnx-community/whisper-tiny.en",
		name: "whisper-tiny.en",
		description: "whisper-tiny.en (English)"
	},
	{
		id: "onnx-community/whisper-tiny",
		name: "whisper-tiny",
		description: "whisper-tiny (Multilingual)"
	},
	{
		id: "onnx-community/whisper-small",
		name: "whisper-small",
		description: "whisper-small (Multilingual)"
	},
	{
		id: "onnx-community/whisper-small.en",
		name: "whisper-small.en",
		description: "whisper-small.en (English)"
	},
	{
		id: "onnx-community/whisper-base",
		name: "whisper-base",
		description: "whisper-base (Multilingual)"
	},
	{
		id: "onnx-community/whisper-medium.en",
		name: "whisper-medium.en",
		description: "whisper-medium.en (English)"
	},
	{
		id: "onnx-community/whisper-large.en",
		name: "whisper-large.en",
		description: "whisper-large.en (English)"
	},
	{
		id: "onnx-community/whisper-medium",
		name: "whisper-medium",
		description: "whisper-medium (Multilingual)"
	},
	{
		id: "onnx-community/whisper-large",
		name: "whisper-large",
		description: "whisper-large (Multilingual)"
	},
	{
		id: "onnx-community/whisper-large-v2",
		name: "whisper-large-v2",
		description: "whisper-large-v2 (Multilingual)"
	},
	{
		id: "onnx-community/whisper-large-v3",
		name: "whisper-large-v3",
		description: "whisper-large-v3 (Multilingual)"
	},
	{
		id: "onnx-community/whisper-tiny_timestamped",
		name: "whisper-tiny_timestamped",
		description: "whisper-tiny_timestamped (Multilingual)"
	},
	{
		id: "onnx-community/whisper-small_timestamped",
		name: "whisper-small_timestamped",
		description: "whisper-small_timestamped (Multilingual)"
	},
	{
		id: "onnx-community/whisper-base_timestamped",
		name: "whisper-base_timestamped",
		description: "whisper-base_timestamped (Multilingual)"
	},
	{
		id: "onnx-community/whisper-large-v3-turbo_timestamped",
		name: "whisper-large-v3-turbo_timestamped",
		description: "whisper-large-v3-turbo_timestamped (Multilingual)"
	}
];

// Listen for messages from the main thread
self.addEventListener('message', async (e) => {
    const { type, payload } = e.data;

	switch (type) {
		case "models":
			try {
				self.postMessage({ type: "models", modelsOptions });
			} catch (error) {
				self.postMessage({ type: "error", error: error.message });
			}
			break;
		case "loadModel":
			try {
				self.postMessage({
					type: 'status',
					status: 'loading',
					data: `Loading model (${payload.device || 'wasm'})...`
				});
				if (payload.model.includes(".en")) {
					isEnglishModel = true;
				} else {
					isEnglishModel = false;
				}

				// Load the pipeline and save it for future use.
				transcriber = await PipelineSingleton.getInstance(x => {
					// We also add a progress callback to the pipeline so that we can
					// track model loading.
					self.postMessage({ type: 'status', ...x });
				}, payload.device || 'wasm');

				if (payload.device === 'webgpu') {
					self.postMessage({
						type: 'status',
						status: 'loading',
						data: 'Compiling shaders and warming up model...'
					});

					await transcriber(new Float32Array(16_000), {
						language: 'en',
					});
				}

				self.postMessage({ type: 'status', status: 'ready' });
			} catch (error) {
				self.postMessage({ type: "error", error: error.message });
			}
			break;

		case "transcribe":
			try {
				const transcriber = await PipelineSingleton.getInstance();

				// Read and preprocess audio
				const start = performance.now();

				const { audio, language, model } = payload;
				console.log({ audio, language, model });
				console.log("Transcribing audio:", audio, "with language:", language, "and model:", model);

				// Calculate audio duration (sample rate is 16000 Hz)
				const duration = audio.length / 16000;
				console.log("Audio duration:", duration, "seconds");

				const settings = {
					language,
					return_timestamps: 'word',
					chunk_length_s: 30,
				};

				let result;

				// For long audio files, implement streaming by processing in chunks
				if (duration > 30) {
					settings.stride_length_s = 5;
					console.log("Using chunking for long audio:", settings);

					// Process in chunks for streaming effect
					const chunkDuration = 30; // 30 seconds per chunk
					const strideDuration = 5; // 5 seconds overlap
					const samplesPerChunk = chunkDuration * 16000;
					const strideSamples = strideDuration * 16000;

					let accumulatedText = "";
					let chunkCount = 0;

					// Calculate number of chunks needed
					const totalChunks = Math.ceil((duration - strideDuration) / (chunkDuration - strideDuration));

					for (let i = 0; i < audio.length; i += samplesPerChunk - strideSamples) {
						const chunkEnd = Math.min(i + samplesPerChunk, audio.length);
						const chunk = audio.slice(i, chunkEnd);

						chunkCount++;
						const progressPercent = (chunkCount / totalChunks) * 100;

						console.log(`Processing chunk ${chunkCount}/${totalChunks}, progress: ${progressPercent}%`);

						const chunkResult = await transcriber(chunk, !isEnglishModel ? settings : { return_timestamps: 'word', chunk_length_s: 30 });

						if (chunkResult && chunkResult.text) {
							// For streaming, send partial result
							accumulatedText += (chunkCount > 1 ? " " : "") + chunkResult.text.trim();
							self.postMessage({
								type: "stream",
								result: { ...chunkResult, text: accumulatedText },
								progress: Math.min(progressPercent, 95)
							});
						}

						self.postMessage({ type: "status", status: "transcribing", progress: progressPercent });
					}

					result = { text: accumulatedText, chunks: [] };
				} else {
					// For short audio, process normally
					result = await transcriber(audio, !isEnglishModel ? settings : { return_timestamps: 'word', chunk_length_s: 30 });
				}

				const end = performance.now();

				self.postMessage({ type: 'status', status: 'complete', result, time: end - start });
				self.postMessage({
					type: "completed",
					result,
					transcriptionId: payload.transcriptionId,
					fileName: payload.fileName,
					language: payload.language,
					model: payload.model,
					fileSize: payload.fileSize
				});
			} catch (error) {
				self.postMessage({ type: "error", error: error.message });
			}
			break;

		case "unloadModel":
			PipelineSingleton.instance = null;
			transcriber = null;
			self.postMessage({ type: "status", status: "unloaded", progress: 100 });
			break;

		default:
			self.postMessage({ type: "error", error: "Unknown message type" });
			break;
	}
});
