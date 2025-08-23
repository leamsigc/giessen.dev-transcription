export const useMicrophone = () => {
  const selectedMicrophone = ref('')
  const microphones = ref<MediaDeviceInfo[]>([])

  const getMicrophones = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      microphones.value = devices.filter(device => device.kind === 'audioinput')
      if (microphones.value.length > 0 && !selectedMicrophone.value) {
        const firstMic = microphones.value[0]
        if (firstMic) {
          selectedMicrophone.value = firstMic.deviceId || firstMic.label || 'default'
        }
      }
    } catch (error) {
      console.error('Error getting microphones:', error)
    }
  }

  const getMicrophoneStream = async (deviceId?: string) => {
    try {
    const constraints: MediaStreamConstraints = {
      audio: deviceId ? { deviceId: { exact: deviceId } } : true
    }
      console.log("constraints",constraints);
      
      const stream = await navigator.mediaDevices.getUserMedia({audio: true});
      console.log("Sucess accesing media devices");
      
      return stream;
    } catch (error) {
      //this is when user don't allow media devices
      console.log(error);
    }
  }

  const saveMicrophoneSelection = () => {
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedMicrophone', selectedMicrophone.value)
    }
  }

  const loadMicrophoneSelection = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('selectedMicrophone')
      if (saved) {
        selectedMicrophone.value = saved
      }
    }
  }

  return {
    selectedMicrophone,
    microphones,
    getMicrophones,
    getMicrophoneStream,
    saveMicrophoneSelection,
    loadMicrophoneSelection
  }
}