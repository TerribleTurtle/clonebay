import { useState, useEffect } from "react";
import { useSettingsStore } from "../../store/useSettingsStore";
import { configSchema } from "../../lib/schemas/configSchema";

export function useSettingsForm() {
  const settings = useSettingsStore();
  const [mounted, setMounted] = useState(false);

  const [draftSettings, setDraftSettings] = useState({
    walletYellowThreshold: 0,
    walletRedThreshold: 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    setDraftSettings({
      walletYellowThreshold: settings.walletYellowThreshold,
      walletRedThreshold: settings.walletRedThreshold,
    });
    setErrors({});
  }, [settings.walletYellowThreshold, settings.walletRedThreshold]);

  const handleSave = () => {
    const result = configSchema.safeParse(draftSettings);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      setErrors({
        walletYellowThreshold: fieldErrors["walletYellowThreshold"]?.[0] || "",
        walletRedThreshold: fieldErrors["walletRedThreshold"]?.[0] || "",
      });
      return;
    }

    setErrors({});
    settings.setWalletYellowThreshold(draftSettings.walletYellowThreshold);
    settings.setWalletRedThreshold(draftSettings.walletRedThreshold);
  };

  return {
    mounted,
    draftSettings,
    setDraftSettings,
    errors,
    handleSave,
    settings,
  };
}
