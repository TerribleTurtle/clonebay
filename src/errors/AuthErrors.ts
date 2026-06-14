export class SsoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SsoError';
  }
}

export class CsrfError extends SsoError {
  constructor(message: string = "Invalid state parameter (CSRF mismatch).") {
    super(message);
    this.name = 'CsrfError';
  }
}

export class ConfigurationError extends SsoError {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

export class SessionDataError extends SsoError {
  constructor(message: string = "Missing callback parameters or session data.") {
    super(message);
    this.name = 'SessionDataError';
  }
}
