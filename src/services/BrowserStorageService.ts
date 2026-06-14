export class BrowserStorageService {
  static clearAllStorage(): void {
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
    }
  }
}
