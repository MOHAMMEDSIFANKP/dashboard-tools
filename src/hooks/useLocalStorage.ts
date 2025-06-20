// src\hooks\useLocalStorage.ts

import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (val: T) => void] {
  const isClient = typeof window !== 'undefined';

  const [storedValue, setStoredValue] = useState<T>(() => {
    if (!isClient) return initialValue;

    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (err) {
      console.warn(`Error reading localStorage key "${key}":`, err);
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      if (isClient) {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (err) {
      console.warn(`Error setting localStorage key "${key}":`, err);
    }
  };

  useEffect(() => {
    if (isClient) {
      const item = window.localStorage.getItem(key);
      if (item) setStoredValue(JSON.parse(item));
    }
  }, [key]);

  return [storedValue, setValue];
}
