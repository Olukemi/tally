#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{
    CustomMenuItem, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu,
};

fn main() {
    let tray_menu = SystemTrayMenu::new()
        .add_item(CustomMenuItem::new("show".to_string(), "Show"))
        .add_item(CustomMenuItem::new("quit".to_string(), "Quit"));

    let tray = SystemTray::new().with_menu(tray_menu);

    tauri::Builder::default()
        .system_tray(tray)
        .on_system_tray_event(|app, event| match event {
            // Left-click the tray icon → show/focus the window
            SystemTrayEvent::LeftClick { .. } => {
                let win = app.get_window("main").unwrap();
                win.show().unwrap();
                win.set_focus().unwrap();
            }
            // Right-click menu items
            SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
                "show" => {
                    let win = app.get_window("main").unwrap();
                    win.show().unwrap();
                    win.set_focus().unwrap();
                }
                "quit" => std::process::exit(0),
                _ => {}
            },
            _ => {}
        })
        // Intercept the close button (✕) — hide instead of quit
        .on_window_event(|event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event.event() {
                event.window().hide().unwrap();
                api.prevent_close();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}