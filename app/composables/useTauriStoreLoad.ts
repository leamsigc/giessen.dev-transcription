interface Transcription {
  id: string
  text: string
  audioUrl?: string
  timestamp: number
  duration?: number
  language?: string
  model?: string
}

export const useTauriStoreLoad = () => {
  const transcriptions = ref<Transcription[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const loadTranscriptions = async () => {
    isLoading.value = true
    error.value = null

    try {
      // @ts-ignore
      if (window.__TAURI__) {
        // @ts-ignore
        const store = await window.__TAURI__.store.load('transcriptions.json')
        // @ts-ignore
        const data = await store.get('transcriptions')
        transcriptions.value = data || []
      } else {
        // Fallback for web environment
        const stored = localStorage.getItem('transcriptions')
        transcriptions.value = stored ? JSON.parse(stored) : []
      }
    } catch (err) {
      console.error('Error loading transcriptions:', err)
      error.value = 'Failed to load transcriptions'
    } finally {
      isLoading.value = false
    }
  }

  const saveTranscriptions = async () => {
    try {
      // @ts-ignore
      if (window.__TAURI__) {
        // @ts-ignore
        const store = await window.__TAURI__.store.load('transcriptions.json')
        // @ts-ignore
        await store.set('transcriptions', transcriptions.value)
        // @ts-ignore
        await store.save()
      } else {
        // Fallback for web environment
        localStorage.setItem('transcriptions', JSON.stringify(transcriptions.value))
      }
    } catch (err) {
      console.error('Error saving transcriptions:', err)
      error.value = 'Failed to save transcriptions'
    }
  }

  const addTranscription = async (transcription: Omit<Transcription, 'id' | 'timestamp'>) => {
    const newTranscription: Transcription = {
      ...transcription,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    }
    transcriptions.value.unshift(newTranscription)
    await saveTranscriptions()
    return newTranscription
  }

  const updateTranscription = async (id: string, updates: Partial<Omit<Transcription, 'id' | 'timestamp'>>) => {
    const index = transcriptions.value.findIndex(t => t.id === id)
    if (index !== -1) {
      const current = transcriptions.value[index]
      if (current) {
        const updatedTranscription: Transcription = {
          id: current.id,
          timestamp: current.timestamp,
          text: updates.text ?? current.text,
          audioUrl: updates.audioUrl ?? current.audioUrl,
          duration: updates.duration ?? current.duration,
          language: updates.language ?? current.language,
          model: updates.model ?? current.model
        }
        transcriptions.value[index] = updatedTranscription
        await saveTranscriptions()
      }
    }
  }

  const deleteTranscription = async (id: string) => {
    const index = transcriptions.value.findIndex(t => t.id === id)
    if (index !== -1) {
      transcriptions.value.splice(index, 1)
      await saveTranscriptions()
    }
  }

  const getTranscription = (id: string) => {
    return transcriptions.value.find(t => t.id === id)
  }

  // Load transcriptions on initialization
  onMounted(() => {
    loadTranscriptions()
  })

  return {
    transcriptions: readonly(transcriptions),
    isLoading: readonly(isLoading),
    error: readonly(error),
    loadTranscriptions,
    saveTranscriptions,
    addTranscription,
    updateTranscription,
    deleteTranscription,
    getTranscription
  }
}