"use client";

import { StatePersistenceService } from '../services/StatePersistenceService';

if (typeof window !== 'undefined') {
  StatePersistenceService.init();
}

export function StateInit() {
  return null;
}
