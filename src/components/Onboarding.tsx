import { useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "@/components/ui/button";

interface OnboardingProps {
  onSuccess: (path: string) => void;
}

export function Onboarding({ onSuccess }: OnboardingProps) {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPicking, setIsPicking] = useState(false);

  async function handleChooseFolder() {
    setIsPicking(true);
    setErrorMsg(null);

    try {
      // Open the OS native directory picker
      const selected = await open({ directory: true, multiple: false });

      // User cancelled — stay on the screen
      if (selected === null) {
        return;
      }

      // Initialise the vault at the chosen path
      await invoke<void>("vault_init", { path: selected });

      // Success — notify parent to switch to the main window
      onSuccess(selected);
    } catch (err) {
      // vault_init returned a VaultError or the IPC call failed
      const msg =
        typeof err === "string"
          ? err
          : err instanceof Error
            ? err.message
            : JSON.stringify(err);
      setErrorMsg(msg);
    } finally {
      setIsPicking(false);
    }
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
      <div className="flex flex-col items-center gap-6 max-w-sm text-center px-6">
        <h1 className="text-2xl font-semibold tracking-tight">MyPKM</h1>
        <p className="text-sm text-muted-foreground">
          Choose a folder to use as your vault. A new vault will be initialised
          there if one doesn't already exist.
        </p>

        <Button onClick={handleChooseFolder} disabled={isPicking}>
          {isPicking ? "Setting up…" : "Choose vault folder"}
        </Button>

        {errorMsg && (
          <p className="text-sm text-destructive" role="alert">
            {errorMsg}
          </p>
        )}
      </div>
    </div>
  );
}
