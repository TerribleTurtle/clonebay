import { useRouter } from 'next/navigation';
import { clearAuthDictionary } from '../auth/AuthRepository';
import { BrowserStorageService } from '../services/BrowserStorageService';
import { logger } from '../utils/logger';

export function useDataWipe() {
  const router = useRouter();

  const handleWipeData = async (confirmMessage: string) => {
    if (window.confirm(confirmMessage)) {
      try {
        await clearAuthDictionary();
        BrowserStorageService.clearAllStorage();
        router.push("/");
      } catch (err) {
        logger.error("Failed to wipe local data", err);
        window.alert("CRITICAL ERROR: Failed to wipe data. Tokens may still exist.");
      }
    }
  };

  return { handleWipeData };
}
