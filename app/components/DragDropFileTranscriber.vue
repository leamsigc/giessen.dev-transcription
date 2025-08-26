<template>
	<div class="w-full max-w-2xl mx-auto">
		<!-- File Upload Area -->
		<UFileUpload
			:multiple="true"
			accept=".mp3,audio/mpeg"
			color="neutral"
			highlight
			label="Drop your MP3 files here"
			description="MP3 files only (multiple files supported)"
			class="w-full min-h-48 mb-6"
			@update:model-value="handleFileChange"
		/>

		<!-- Processing Status -->
		<ProcessingStatus
			v-if="isProcessing && processingFile"
			:file-name="processingFile.file.name"
			:progress="progress"
			:is-streaming="isStreaming"
			:streaming-result="streamingResult"
			class="mb-6"
		/>

		<!-- File Queue -->
		<div v-if="files.length > 0" class="mb-6">
			<div class="flex items-center justify-between mb-4">
				<h3 class="text-lg font-semibold">
					File Queue
				</h3>
				<UButton
					:disabled="isProcessing"
					variant="outline"
					color="error"
					size="sm"
					@click="clearAll"
				>
					Clear All
				</UButton>
			</div>

			<div class="space-y-2">
				<FileQueueItem
					v-for="(fileItem, index) in files"
					:key="index"
					:file-item="fileItem"
					:index="index"
					:is-streaming="isStreaming"
					:streaming-result="streamingResult"
					@remove="removeFile"
				/>
			</div>
		</div>

		<!-- Summary -->
		<div v-if="files.length > 0" class="flex gap-4 text-sm">
			<div class="flex items-center gap-1">
				<UIcon name="i-heroicons-clock" class="w-4 h-4 text-gray-500" />
				<span>Pending: {{ pendingFiles.length }}</span>
			</div>
			<div class="flex items-center gap-1">
				<UIcon name="i-heroicons-check-circle" class="w-4 h-4 text-green-500" />
				<span>Completed: {{ completedFiles.length }}</span>
			</div>
		</div>
	</div>
</template>

<script lang="ts" setup>
/**
 * DragDropFileTranscriber Component
 *
 * Handles drag and drop of multiple MP3 files for transcription processing.
 * Processes files sequentially - when one finishes, the next one starts.
 *
 * @author Ismael Garcia <leamsigc@leamsigc.com>
 * @version 0.0.1
 *
 * @todo [ ] Test the component
 * @todo [ ] Integration test.
 * @todo [✔] Update the typescript.
 */

	import { computed, ref, watch } from "vue";

	const { run, progress, streamingResult, isStreaming, selectedModel } = useTranscriber();
	const { addTranscription } = useTauriStoreLoadCustom();
	const { addOngoingTranscription, updateProgress, completeTranscription, errorTranscription } = useOngoingTranscriptions();
	const { showNotification } = useNotifications();
	const { validateFiles } = useFileValidation();

	interface FileQueueItem {
		file: File
		status: "pending" | "processing" | "completed" | "error"
		result?: string
		error?: string
	}

	const files = ref<FileQueueItem[]>([]);
	const uploadedFiles = ref<File[]>([]);
	const currentProcessingIndex = ref<number>(-1);
	const isProcessing = ref(false);
	const currentTranscriptionId = ref<string | null>(null);

	// Watch progress and update ongoing transcription
	watch(progress, (newProgress) => {
		if (currentTranscriptionId.value && newProgress > 0) {
			updateProgress(currentTranscriptionId.value, newProgress);
		}
	});

	// Computed properties
	const pendingFiles = computed(() => files.value.filter((f) => f.status === "pending"));
	const completedFiles = computed(() => files.value.filter((f) => f.status === "completed"));
	const processingFile = computed(() => {
		if (currentProcessingIndex.value >= 0 && currentProcessingIndex.value < files.value.length) {
			return files.value[currentProcessingIndex.value];
		}
		return null;
	});

	// Process next file in queue
	const processNextFile = async () => {
		if (isProcessing.value) return;

		const nextIndex = files.value.findIndex((f) => f.status === "pending");
		if (nextIndex === -1) {
			isProcessing.value = false;
			showNotification("Processing Complete", "All files have been processed.");
			return;
		}

		currentProcessingIndex.value = nextIndex;
		isProcessing.value = true;
		const fileToProcess = files.value[nextIndex];
		if (!fileToProcess) {
			return;
		}

		fileToProcess.status = "processing";

		try {
			showNotification("Processing Started", `Transcribing: ${fileToProcess.file.name}`);

			// Add to ongoing transcriptions
			currentTranscriptionId.value = addOngoingTranscription(fileToProcess.file.name);

			// Define completion callback
			const onCompleted = async (workerResult: any, metadata: any) => {
				const transcriptionResult = workerResult?.text || "";

				fileToProcess.status = "completed";
				fileToProcess.result = transcriptionResult;

				// Save transcription to store
				if (transcriptionResult) {
					await addTranscription({
						text: transcriptionResult,
						language: metadata.language || "en",
						model: metadata.model || selectedModel.value || "default",
						duration: metadata.fileSize / 16000 // Rough estimate
					});
				}

				// Mark as completed in ongoing transcriptions
				if (currentTranscriptionId.value) {
					completeTranscription(currentTranscriptionId.value);
					currentTranscriptionId.value = null;
				}

				showNotification("File Processed", `${fileToProcess.file.name} transcription complete.`);
			};

			// Define error callback
			const onError = (errorMsg: string) => {
				fileToProcess.status = "error";
				fileToProcess.error = errorMsg;

				// Mark as error in ongoing transcriptions
				if (currentTranscriptionId.value) {
					errorTranscription(currentTranscriptionId.value);
					currentTranscriptionId.value = null;
				}

				showNotification("Processing Error", `Failed to process ${fileToProcess.file.name}`);
			};

			// Run transcription with callbacks - don't await, let it run in background
			run(fileToProcess.file, "en", {
				transcriptionId: currentTranscriptionId.value,
				fileName: fileToProcess.file.name,
				onCompleted: (workerResult: any, metadata: any) => {
					// Call the original onCompleted callback
					onCompleted(workerResult, metadata);
					// Move to next file after completion
					setTimeout(() => {
						processNextFile();
					}, 500);
				},
				onError: (errorMsg: string) => {
					// Call the original onError callback
					onError(errorMsg);
					// Move to next file after error
					setTimeout(() => {
						processNextFile();
					}, 1000);
				}
			});
		} catch (err) {
			fileToProcess.status = "error";
			fileToProcess.error = (err as Error).message;

			// Mark as error in ongoing transcriptions
			if (currentTranscriptionId.value) {
				errorTranscription(currentTranscriptionId.value);
				currentTranscriptionId.value = null;
			}

			showNotification("Processing Error", `Failed to process ${fileToProcess.file.name}`);

			// Move to next file after error
			setTimeout(() => {
				processNextFile();
			}, 1000);
		}
	};

	// Handle file selection from UFileUpload events
	const onFileSelect = (selectedFiles: File[]) => {
		const { valid, invalid } = validateFiles(selectedFiles);

		if (invalid.length > 0) {
			showNotification("Invalid Files", `${invalid.length} file(s) were skipped. Please select MP3 files only.`);
		}

		if (valid.length === 0) {
			showNotification("No Valid Files", "Please select MP3 files only.");
			return;
		}

		// Add valid files to queue
		const newQueueItems: FileQueueItem[] = valid.map((file) => ({
			file,
			status: "pending"
		}));

		files.value.push(...newQueueItems);

		// Start processing if not already processing
		if (!isProcessing.value) {
			processNextFile();
		}

		showNotification("Files Added", `${valid.length} MP3 file(s) added to queue.`);
	};

	// Handle UFileUpload change event
	const handleFileChange = (value: any) => {
		console.log("selectedFiles", value);
		// The UFileUpload component with multiple="true" should emit an array of File objects directly.
		// Ensure value is an array of Files before passing to onFileSelect
		if (Array.isArray(value) && value.every((item) => item instanceof File)) {
			onFileSelect(value as File[]);
		} else {
			console.error("UFileUpload did not emit an array of File objects:", value);
			showNotification("File Upload Error", "Invalid file selection received.");
		}
	};

	// Remove file from queue
	const removeFile = (index: number) => {
		if (!files.value[index]) {
			return; // File at index does not exist, do nothing
		}
		if (files.value[index].status === "processing") {
			showNotification("Cannot Remove", "Cannot remove file while processing.");
			return;
		}
		files.value.splice(index, 1);
	};

	// Clear all files
	const clearAll = () => {
		if (isProcessing.value) {
			showNotification("Cannot Clear", "Cannot clear while processing files.");
			return;
		}
		files.value = [];
		uploadedFiles.value = [];
		currentProcessingIndex.value = -1;
	};
</script>

<style scoped>
/* Custom styles if needed */
</style>
