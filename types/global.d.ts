declare interface ModuleOptions {
	prefix: false | string
}

declare global {
	interface Window {
		__TAURI__?: {
			event: {
				listen: (event: string, handler: (event: any) => void) => Promise<void>
			}
		}
	}
}

export {};
