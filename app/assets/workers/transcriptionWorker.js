import { pipeline } from "@huggingface/transformers";

const BASE_MODEL = "onnx-community/whisper-tiny.en";
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

globalThis.onmessage = async (event) => {
	const { type, payload } = event.data;

	switch (type) {
		case "models":
			try {
				globalThis.postMessage({ type: "models", modelsOptions });
			} catch (error) {
				globalThis.postMessage({ type: "error", error: error.message });
			}
			break;
		case "loadModel":
			try {
				globalThis.postMessage({ type: "status", status: "loading", progress: 0 });
				if (payload.model.includes(".en")) {
					isEnglishModel = true;
				} else {
					isEnglishModel = false;
				}

				transcriber = await pipeline("automatic-speech-recognition", payload.model || BASE_MODEL, { dtype: "q8" });
				globalThis.postMessage({ type: "status", status: "loaded", progress: 100 });
			} catch (error) {
				globalThis.postMessage({ type: "error", error: error.message });
			}
			break;

		case "transcribe":
			console.log("Transcriber", transcriber);

			if (!transcriber) {
				globalThis.postMessage({ type: "error", error: "Model not loaded" });
				return;
			}
			try {
				globalThis.postMessage({ type: "status", status: "transcribing", progress: 0 });
				const { audio, language, model } = payload;
				console.log({ audio, language, model });
				console.log("Transcribing audio:", audio, "with language:", language, "and model:", model);

				// Calculate audio duration (sample rate is 16000 Hz)
				const duration = audio.length / 16000;
				console.log("Audio duration:", duration, "seconds");

				const settings = {
					language,
					return_timestamps: true
				};

				let result;

				// For long audio files, implement streaming by processing in chunks
				if (duration > 30) {
					settings.chunk_length_s = 30;
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

						const chunkResult = await transcriber(chunk, !isEnglishModel ? settings : {});

						if (chunkResult && chunkResult.text) {
							// For streaming, send partial result
							accumulatedText += (chunkCount > 1 ? " " : "") + chunkResult.text.trim();
							globalThis.postMessage({
								type: "stream",
								result: { ...chunkResult, text: accumulatedText },
								progress: Math.min(progressPercent, 95)
							});
						}

						globalThis.postMessage({ type: "status", status: "transcribing", progress: progressPercent });
					}

					result = { text: accumulatedText, chunks: [] };
				} else {
					// For short audio, process normally
					result = await transcriber(audio, !isEnglishModel ? settings : {});
				}

				globalThis.postMessage({ type: "status", status: "done", progress: 100 });
				globalThis.postMessage({
					type: "completed",
					result,
					transcriptionId: payload.transcriptionId,
					fileName: payload.fileName,
					language: payload.language,
					model: payload.model,
					fileSize: payload.fileSize
				});
				globalThis.postMessage({ type: "result", result });
			} catch (error) {
				globalThis.postMessage({ type: "error", error: error.message });
			}
			break;

		case "unloadModel":
			transcriber = null;
			globalThis.postMessage({ type: "status", status: "unloaded", progress: 100 });
			break;

		default:
			globalThis.postMessage({ type: "error", error: "Unknown message type" });
			break;
	}
};
