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

import { computed, ref } from "vue";

const { run, progress, result, selectedModel } = useTranscriber();
const { addTranscription } = useTauriStoreLoadCustom();
const toast = useToast();

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

// Computed properties
const pendingFiles = computed(() => files.value.filter((f) => f.status === "pending"));
const completedFiles = computed(() => files.value.filter((f) => f.status === "completed"));
const processingFile = computed(() => {
	if (currentProcessingIndex.value >= 0 && currentProcessingIndex.value < files.value.length) {
		return files.value[currentProcessingIndex.value];
	}
	return null;
});

const showNotification = async (title: string, body: string) => {
	const permissionGranted = await useTauriNotificationIsPermissionGranted();

	if (!permissionGranted) {
		const permission = await useTauriNotificationRequestPermission();
		if (permission !== "granted") {
			toast.add({
				title: "Error",
				description: "Missing notifications permission",
				color: "error"
			});
			return;
		}
	}

	useTauriNotificationSendNotification({
		title,
		body
	});
};

// File validation
const isValidFile = (file: File): boolean => {
	return file.type === "audio/mpeg" || file.name.toLowerCase().endsWith(".mp3");
};

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

		await run(fileToProcess.file, "en");

		// Wait for transcription to complete
		const transcriptionResult = result.value?.text || "";

		fileToProcess.status = "completed";
		fileToProcess.result = transcriptionResult;

		// Save transcription to store
		if (transcriptionResult) {
			await addTranscription({
				text: transcriptionResult,
				language: "en",
				model: selectedModel.value || "default",
				duration: fileToProcess.file.size / 16000 // Rough estimate
			});
		}

		showNotification("File Processed", `${fileToProcess.file.name} transcription complete.`);
	} catch (err) {
		fileToProcess.status = "error";
		fileToProcess.error = (err as Error).message;
		showNotification("Processing Error", `Failed to process ${fileToProcess.file.name}`);
	}

	// Process next file
	setTimeout(() => {
		isProcessing.value = false;
		processNextFile();
	}, 1000); // Small delay between files
};

// Handle file selection from UFileUpload events
const onFileSelect = (selectedFiles: File[]) => {
	const validFiles = selectedFiles.filter(isValidFile);

	if (validFiles.length === 0) {
		showNotification("Invalid Files", "Please select MP3 files only.");
		return;
	}

	// Add valid files to queue
	const newQueueItems: FileQueueItem[] = validFiles.map((file) => ({
		file,
		status: "pending"
	}));

	files.value.push(...newQueueItems);

	// Start processing if not already processing
	if (!isProcessing.value) {
		processNextFile();
	}

	showNotification("Files Added", `${validFiles.length} MP3 file(s) added to queue.`);
};

// Handle UFileUpload change event
const handleFileChange = (value: any) => {
	console.log("selectedFiles", value);
	// The UFileUpload component with multiple="true" should emit an array of File objects directly.
	// Ensure value is an array of Files before passing to onFileSelect
	if (Array.isArray(value) && value.every(item => item instanceof File)) {
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
		<div v-if="isProcessing && processingFile" class="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
			<div class="flex items-center gap-3">
				<UIcon name="i-heroicons-cog-6-tooth" class="w-5 h-5 text-blue-600 animate-spin" />
				<div class="flex-1">
					<p class="font-semibold text-blue-800">
						Processing: {{ processingFile.file.name }}
					</p>
					<div class="w-full bg-blue-200 rounded-full h-2 mt-2">
						<div
							class="bg-blue-600 h-2 rounded-full transition-all duration-300"
							:style="{ width: `${progress}%` }"
						/>
					</div>
					<p class="text-sm text-blue-600 mt-1">
						{{ Math.round(progress) }}% complete
					</p>
				</div>
			</div>
		</div>

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
				<div
					v-for="(fileItem, index) in files"
					:key="index"
					class="flex items-center gap-3 p-3 rounded-lg border"
					:class="{
						'bg-gray-50 border-gray-200': fileItem.status === 'pending',
						'bg-blue-50 border-blue-200': fileItem.status === 'processing',
						'bg-green-50 border-green-200': fileItem.status === 'completed',
						'bg-red-50 border-red-200': fileItem.status === 'error'
					}"
				>
					<!-- Status Icon -->
					<UIcon
						:name="fileItem.status === 'pending' ? 'i-heroicons-clock'
							: fileItem.status === 'processing' ? 'i-heroicons-cog-6-tooth'
								: fileItem.status === 'completed' ? 'i-heroicons-check-circle'
									: 'i-heroicons-exclamation-circle'"
						class="w-5 h-5 flex-shrink-0"
						:class="{
							'text-gray-500': fileItem.status === 'pending',
							'text-blue-600 animate-spin': fileItem.status === 'processing',
							'text-green-600': fileItem.status === 'completed',
							'text-red-600': fileItem.status === 'error'
						}"
					/>

					<!-- File Info -->
					<div class="flex-1 min-w-0">
						<p class="font-medium truncate">
							{{ fileItem.file.name }}
						</p>
						<p class="text-sm text-gray-500">
							{{ (fileItem.file.size / 1024 / 1024).toFixed(2) }} MB
						</p>
						<p v-if="fileItem.result" class="text-sm text-green-700 mt-1">
							Transcription: {{ fileItem.result.substring(0, 100) }}{{ fileItem.result.length > 100 ? '...' : '' }}
						</p>
						<p v-if="fileItem.error" class="text-sm text-red-700 mt-1">
							Error: {{ fileItem.error }}
						</p>
					</div>

					<!-- Remove Button -->
					<UButton
						:disabled="fileItem.status === 'processing'"
						variant="ghost"
						color="error"
						size="sm"
						class="flex-shrink-0"
						@click="removeFile(index)"
					>
						<UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
					</UButton>
				</div>
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


<style scoped>
/* Custom styles if needed */
</style>
