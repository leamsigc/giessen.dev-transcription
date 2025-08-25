export const useMicrophone = () => {
	const selectedMicrophone = ref("");
	const microphones = ref<MediaDeviceInfo[]>([]);

	const getMicrophones = async () => {
		try {
			const devices = await navigator.mediaDevices.enumerateDevices();
			console.log("devices", devices);

			microphones.value = devices.filter((device) => device.kind === "audioinput");
			if (microphones.value.length > 0 && !selectedMicrophone.value) {
				const firstMic = microphones.value[0];
				if (firstMic) {
					selectedMicrophone.value = firstMic.deviceId || firstMic.label || "default";
				}
			}
		} catch (error) {
			console.error("Error getting microphones:", error);
		}
	};

	const getMicrophoneStream = async (deviceId?: string) => {
		try {
			const { stream, isSupported } = useUserMedia({ navigator, enabled: true, constraints: { audio: true } });
			console.log("is supported", isSupported);
			console.log("stream", stream);

			return stream;
		} catch (error) {
			console.error("Microphone access error:", error);
			throw error; // Re-throw to handle in calling code
		}
	};

	const saveMicrophoneSelection = () => {
		// Save to localStorage
		if (typeof window !== "undefined") {
			localStorage.setItem("selectedMicrophone", selectedMicrophone.value);
		}
	};

	const loadMicrophoneSelection = () => {
		if (typeof window !== "undefined") {
			const saved = localStorage.getItem("selectedMicrophone");
			if (saved) {
				selectedMicrophone.value = saved;
			}
		}
	};
	const requestMicrophonePermission = async () => {
		try {
			const { stream } = useUserMedia({ navigator, constraints: { audio: true } });
			console.log("stream", stream);
		} catch (error) {
			console.error("Microphone access error:", error);
			throw error; // Re-throw to handle in calling code
		}
	};

	return {
		selectedMicrophone,
		microphones,
		getMicrophones,
		getMicrophoneStream,
		saveMicrophoneSelection,
		loadMicrophoneSelection,
		requestMicrophonePermission
	};
};
