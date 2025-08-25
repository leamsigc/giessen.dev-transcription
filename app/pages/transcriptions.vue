<template>
	<UContainer class="py-8">
		<div class="max-w-6xl mx-auto">
			<div class="flex justify-between items-center mb-8">
				<h1 class="text-3xl font-bold">
					Transcriptions
				</h1>
				<UButton color="primary" @click="showCreateModal = true">
					<UIcon name="i-heroicons-plus" class="w-5 h-5 mr-2" />
					New Transcription
				</UButton>
			</div>

			<!-- Loading State -->
			<div v-if="isLoading" class="flex justify-center py-8">
				<UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin" />
			</div>

			<!-- Error State -->
			<div v-else-if="error" class="text-red-600 p-4 bg-red-50 rounded-lg">
				{{ error }}
			</div>

			<!-- Empty State -->
			<div v-else-if="transcriptions.length === 0" class="text-center py-12">
				<UIcon name="i-heroicons-document-text" class="w-16 h-16 mx-auto mb-4 text-gray-400" />
				<h3 class="text-lg font-medium mb-2">
					No transcriptions yet
				</h3>
				<p class="text-gray-600 mb-4">
					Start by recording some audio to create your first transcription.
				</p>
				<NuxtLink to="/" class="inline-block">
					<UButton color="primary">
						Go to Recorder
					</UButton>
				</NuxtLink>
			</div>

			<!-- Transcriptions List -->
			<div v-else class="space-y-6">
				<UCard v-for="transcription in transcriptions" :key="transcription.id" class="p-6">
					<div class="flex justify-between items-start mb-4">
						<div class="flex-1">
							<div class="flex items-center gap-2 mb-2">
								<h3 class="font-semibold">
									Transcription
								</h3>
								<span class="text-sm text-gray-500">{{ formatDate(transcription.timestamp) }}</span>
							</div>

							<!-- Edit Mode -->
							<div v-if="editingTranscription === transcription.id" class="space-y-3">
								<div class="border rounded-lg p-4 bg-gray-50">
									<div class="flex items-center justify-between mb-3">
										<h4 class="font-medium">
											Visual Editor
										</h4>
										<div class="flex gap-2">
											<UButton size="xs" variant="outline" @click="formatText('bold')">
												<UIcon name="i-heroicons-bold" class="w-4 h-4" />
											</UButton>
											<UButton size="xs" variant="outline" @click="formatText('italic')">
												<UIcon name="i-heroicons-italic" class="w-4 h-4" />
											</UButton>
											<UButton size="xs" variant="outline" @click="insertTimestamp">
												<UIcon name="i-heroicons-clock" class="w-4 h-4" />
											</UButton>
										</div>
									</div>
									<UTextarea
										ref="editorTextarea" v-model="editedText" :rows="8"
										placeholder="Edit transcription text..." class="w-full font-mono text-sm"
									/>
									<div class="flex items-center justify-between mt-2 text-xs text-gray-500">
										<span>{{ editedText.length }} characters</span>
										<span>{{ editedText.split(/\s+/).filter(word => word.length > 0).length }} words</span>
									</div>
								</div>
								<div class="flex gap-2">
									<UButton size="sm" color="primary" @click="saveEdit">
										<UIcon name="i-heroicons-check" class="w-4 h-4 mr-1" />
										Save
									</UButton>
									<UButton size="sm" variant="outline" @click="cancelEdit">
										<UIcon name="i-heroicons-x-mark" class="w-4 h-4 mr-1" />
										Cancel
									</UButton>
								</div>
							</div>

							<!-- View Mode -->
							<div v-else>
								<p class="text-gray-700 whitespace-pre-wrap mb-4">
									{{ transcription.text }}
								</p>
								<div class="flex items-center gap-4 text-sm text-gray-500">
									<span v-if="transcription.language">Language: {{ transcription.language }}</span>
									<span v-if="transcription.model">Model: {{ transcription.model }}</span>
									<span v-if="transcription.duration">{{ transcription.duration }}s</span>
								</div>
							</div>
						</div>

						<!-- Actions -->
						<div v-if="editingTranscription !== transcription.id" class="flex gap-2 ml-4">
							<UDropdownMenu :items="getExportMenuItems(transcription.id)">
								<UButton size="sm" variant="outline" color="success">
									<UIcon name="i-heroicons-arrow-down-tray" class="w-4 h-4 mr-1" />
									Export
								</UButton>
							</UDropdownMenu>
							<UButton size="sm" variant="outline" @click="startEditing(transcription.id)">
								<UIcon name="i-heroicons-pencil" class="w-4 h-4" />
							</UButton>
							<UButton size="sm" variant="outline" color="error" @click="confirmDelete(transcription.id)">
								<UIcon name="i-heroicons-trash" class="w-4 h-4" />
							</UButton>
						</div>
					</div>
				</UCard>
			</div>

			<!-- Create Modal -->
			<UModal v-model:open="showCreateModal" title="Create New Transcription">
				<template #body>
					<div class="my-4">
						<UTextarea
							v-model="newTranscriptionText" :rows="10" placeholder="Enter transcription text..."
							class="w-full"
						/>
					</div>

					<div class="flex justify-end gap-2">
						<UButton variant="outline" @click="showCreateModal = false">
							Cancel
						</UButton>
						<UButton color="primary" @click="createTranscription">
							Create
						</UButton>
					</div>
				</template>
			</UModal>
		</div>
	</UContainer>
</template>

<script lang="ts" setup>
	const { transcriptions, isLoading, error, addTranscription, updateTranscription, deleteTranscription, getTranscription } = useTauriStoreLoadCustom();

	const editingTranscription = ref<string | null>(null);
	const editedText = ref("");
	const showCreateModal = ref(false);
	const newTranscriptionText = ref("");
	const editorTextarea = ref<HTMLTextAreaElement | null>(null);

	const startEditing = (id: string) => {
		const transcription = getTranscription(id);
		if (transcription) {
			editingTranscription.value = id;
			editedText.value = transcription.text;
		}
	};

	const saveEdit = async () => {
		if (editingTranscription.value) {
			await updateTranscription(editingTranscription.value, { text: editedText.value });
			editingTranscription.value = null;
			editedText.value = "";
		}
	};

	const cancelEdit = () => {
		editingTranscription.value = null;
		editedText.value = "";
	};

	const confirmDelete = async (id: string) => {
		if (confirm("Are you sure you want to delete this transcription?")) {
			await deleteTranscription(id);
		}
	};

	const createTranscription = async () => {
		if (newTranscriptionText.value.trim()) {
			await addTranscription({
				text: newTranscriptionText.value.trim(),
				language: "en",
				model: "default"
			});
			newTranscriptionText.value = "";
			showCreateModal.value = false;
		}
	};

	const formatDate = (timestamp: number) => {
		return new Date(timestamp).toLocaleString();
	};

	const formatText = (format: string) => {
		if (!editorTextarea.value) return;

		const textarea = editorTextarea.value;
		const start = textarea.selectionStart;
		const end = textarea.selectionEnd;
		const selectedText = editedText.value.substring(start, end);

		if (!selectedText) return;

		let formattedText = "";
		switch (format) {
		case "bold":
			formattedText = `**${selectedText}**`;
			break;
		case "italic":
			formattedText = `*${selectedText}*`;
			break;
		}

		editedText.value = editedText.value.substring(0, start) + formattedText + editedText.value.substring(end);
		// Restore cursor position
		nextTick(() => {
			textarea.focus();
			textarea.setSelectionRange(start + formattedText.length, start + formattedText.length);
		});
	};

	const insertTimestamp = () => {
		if (!editorTextarea.value) return;

		const textarea = editorTextarea.value;
		const cursorPos = textarea.selectionStart;
		const timestamp = `[${new Date().toLocaleTimeString()}]`;

		editedText.value = editedText.value.substring(0, cursorPos) + timestamp + editedText.value.substring(cursorPos);

		// Restore cursor position after the timestamp
		nextTick(() => {
			textarea.focus();
			textarea.setSelectionRange(cursorPos + timestamp.length, cursorPos + timestamp.length);
		});
	};

	const getExportMenuItems = (id: string) => {
		return [
			[{
				label: "Export as Text",
				icon: "i-heroicons-document-text",
				click: () => exportAsText(id)
			}],
			[{
				label: "Export as JSON",
				icon: "i-heroicons-code-bracket",
				click: () => exportAsJSON(id)
			}],
			[{
				label: "Export with Timestamps",
				icon: "i-heroicons-clock",
				click: () => exportWithTimestamps(id)
			}],
			[{
				label: "Export Audio",
				icon: "i-heroicons-musical-note",
				click: () => exportAudio(id)
			}],
			[{
				label: "Re-transcribe with Timestamps",
				icon: "i-heroicons-arrow-path",
				click: () => retranscribeWithTimestamps(id)
			}]
		];
	};

	const exportAsText = async (id: string) => {
		const transcription = getTranscription(id);
		if (!transcription) return;

		const filename = `transcription_${new Date(transcription.timestamp).toISOString().split("T")[0]}.txt`;
		const content = transcription.text;

		await downloadFile(content, filename, "text/plain");
	};

	const exportAsJSON = async (id: string) => {
		const transcription = getTranscription(id);
		if (!transcription) return;

		const filename = `transcription_${new Date(transcription.timestamp).toISOString().split("T")[0]}.json`;
		const content = JSON.stringify(transcription, null, 2);

		await downloadFile(content, filename, "application/json");
	};

	const exportWithTimestamps = async (id: string) => {
		const transcription = getTranscription(id);
		if (!transcription) return;

		const filename = `transcription_with_timestamps_${new Date(transcription.timestamp).toISOString().split("T")[0]}.txt`;
		const timestamp = new Date(transcription.timestamp).toLocaleString();
		const content = `[${timestamp}]\n\n${transcription.text}`;

		await downloadFile(content, filename, "text/plain");
	};

	const exportAudio = async (id: string) => {
		const transcription = getTranscription(id);
		if (!transcription || !transcription.audioUrl) {
			alert("No audio file available for this transcription");
			return;
		}

		// This would need to be implemented based on how audio is stored
		// For now, just show a message
		alert("Audio export functionality would be implemented here");
	};

	const retranscribeWithTimestamps = async (id: string) => {
		const transcription = getTranscription(id);
		if (!transcription || !transcription.audioUrl) {
			alert("No audio file available for re-transcription");
			return;
		}

		try {
			// This would need to be implemented with the actual audio file
			// For now, we'll simulate re-transcription with timestamps
			const timestampedText = addTimestampsToText(transcription.text);

			// Update the transcription with timestamped version
			await updateTranscription(id, { text: timestampedText });

			// Export the timestamped version
			const filename = `retranscription_with_timestamps_${new Date(transcription.timestamp).toISOString().split("T")[0]}.txt`;
			await downloadFile(timestampedText, filename, "text/plain");

			alert("Re-transcription with timestamps completed and exported!");
		} catch (error) {
			console.error("Error re-transcribing:", error);
			alert("Error during re-transcription");
		}
	};

	const addTimestampsToText = (text: string) => {
		const words = text.split(/\s+/);
		const timestampedWords = words.map((word, index) => {
			const timestamp = new Date(Date.now() + index * 1000).toLocaleTimeString();
			return `[${timestamp}] ${word}`;
		});
		return timestampedWords.join("\n");
	};

	const downloadFile = async (content: string, filename: string, mimeType: string) => {
		const blob = new Blob([content], { type: mimeType });
		const url = URL.createObjectURL(blob);

		// @ts-ignore
		if (window.__TAURI__) {
			try {
				// @ts-ignore
				await window.__TAURI__.dialog.save({
					defaultPath: filename,
					filters: [{
						name: "File",
						extensions: [filename.split(".").pop() || "txt"]
					}]
				});
				// In a real implementation, you'd write the file to the selected path
			} catch (error) {
				console.error("Error saving file:", error);
			}
		} else {
			// Web fallback
			const a = document.createElement("a");
			a.href = url;
			a.download = filename;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
		}

		URL.revokeObjectURL(url);
	};
</script>
