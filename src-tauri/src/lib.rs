#[cfg_attr(mobile, tauri::mobile_entry_point)]

use tauri::{
	menu::{Menu, MenuItem},
	tray::{TrayIcon, TrayIconBuilder},
	Emitter
};
use std::sync::{Arc, RwLock};

pub fn run() {
    tauri::Builder::default()
		.setup(|app| {
			let recording = Arc::new(RwLock::new(false));
			let tray: Arc<RwLock<Option<TrayIcon>>> = Arc::new(RwLock::new(None));

			let update_menu = |app: &tauri::AppHandle, recording: bool, tray: &Arc<RwLock<Option<TrayIcon>>>| {
				let start_text = if recording { "🔴 Recording" } else { "Start" };
				let start_i = MenuItem::with_id(app, "start", start_text, true, None::<&str>)?;
				let stop_i = MenuItem::with_id(app, "stop", "Stop", recording, None::<&str>)?;
				let history_i = MenuItem::with_id(app, "history", "History", true, None::<&str>)?;
				let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
				let menu = Menu::with_items(app, &[&start_i, &stop_i, &history_i, &quit_i])?;

				if let Some(t) = tray.read().unwrap().as_ref() {
					t.set_menu(Some(menu))?;
				}
				Ok(())
			};

			update_menu(app.handle(), *recording.read().unwrap(), &tray)?;

			let tray_clone = Arc::clone(&tray);
			*tray.write().unwrap() = Some(TrayIconBuilder::new()
				.show_menu_on_left_click(true)
				.icon(app.default_window_icon().unwrap().clone())
				.on_menu_event(move |app, event| {
					match event.id.as_ref() {
						"start" if !*recording.read().unwrap() => {
							*recording.write().unwrap() = true;
							let _ = app.emit("start-recording", ());
							let _: Result<(), tauri::Error> = update_menu(app, *recording.read().unwrap(), &tray_clone);
						}
						"stop" if *recording.read().unwrap() => {
							*recording.write().unwrap() = false;
							let _ = app.emit("stop-recording", ());
							let _: Result<(), tauri::Error> = update_menu(app, *recording.read().unwrap(), &tray_clone);
						}
						"history" => {
							let _ = app.emit("show-history", ());
						}
						"quit" => {
							app.exit(0);
						}
						other => {
							println!("menu item {} not handled", other);
						}
					}
				})
				.build(app)?);

			Ok(())
		})
		.plugin(tauri_plugin_shell::init())
		.plugin(tauri_plugin_notification::init())
		.plugin(tauri_plugin_os::init())
		.plugin(tauri_plugin_fs::init())
		.plugin(tauri_plugin_store::Builder::new().build())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
