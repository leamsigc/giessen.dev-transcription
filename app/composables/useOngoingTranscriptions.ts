interface OngoingTranscription {
	id: string
	fileName: string
	progress: number
	status: "processing" | "completed" | "error"
	startTime: number
}

export const useOngoingTranscriptions = () => {
	const ongoingTranscriptions = ref<OngoingTranscription[]>([]);

	const addOngoingTranscription = (fileName: string) => {
		const newTranscription: OngoingTranscription = {
			id: crypto.randomUUID(),
			fileName,
			progress: 0,
			status: "processing",
			startTime: Date.now()
		};
		ongoingTranscriptions.value.push(newTranscription);
		return newTranscription.id;
	};

	const updateProgress = (id: string, progress: number) => {
		const transcription = ongoingTranscriptions.value.find((t) => t.id === id);
		if (transcription) {
			transcription.progress = progress;
		}
	};

	const removeTranscription = (id: string) => {
		const index = ongoingTranscriptions.value.findIndex((t) => t.id === id);
		if (index !== -1) {
			ongoingTranscriptions.value.splice(index, 1);
		}
	};

	const completeTranscription = (id: string) => {
		const transcription = ongoingTranscriptions.value.find((t) => t.id === id);
		if (transcription) {
			transcription.status = "completed";
			transcription.progress = 100;
			// Remove after a delay to show completion
			setTimeout(() => {
				removeTranscription(id);
			}, 3000);
		}
	};

	const errorTranscription = (id: string) => {
		const transcription = ongoingTranscriptions.value.find((t) => t.id === id);
		if (transcription) {
			transcription.status = "error";
			// Remove after a delay
			setTimeout(() => {
				removeTranscription(id);
			}, 5000);
		}
	};

	const hasOngoingTranscriptions = computed(() => ongoingTranscriptions.value.length > 0);

	return {
		ongoingTranscriptions: readonly(ongoingTranscriptions),
		hasOngoingTranscriptions,
		addOngoingTranscription,
		updateProgress,
		completeTranscription,
		errorTranscription,
		removeTranscription
	};
};
