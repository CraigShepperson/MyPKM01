mod manager;

pub use manager::{
    get_vault_path, load_startup_vault, vault_init, VaultError, VaultManager, VaultState,
};
