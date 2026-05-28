mod manager;
mod timeline;

pub use manager::{
    get_vault_path, load_startup_vault, vault_init, VaultError, VaultManager, VaultState,
};

pub use timeline::{
    create_entry, create_entry_note, create_entry_subfolder, delete_entry,
    list_entry_children, list_timeline, move_entry, read_entry_file, write_entry_file,
};
