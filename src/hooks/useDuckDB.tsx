// hooks/useDuckDB.tsx
'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import * as duckdb from '@duckdb/duckdb-wasm';
import Papa from 'papaparse';

// Simple types for better TypeScript support
interface DuckDBResult {
  success: boolean;
  data?: any[];
  error?: string;
}

enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG',
}


// IndexedDB helpers
const DB_NAME = 'financial_app_db';
const STORE_NAME = 'financial_data';

// Check if data exists in IndexedDB
const getFromIndexedDB = async (): Promise<any[] | null> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      db.createObjectStore(STORE_NAME, { keyPath: 'id' });
    };
    
    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get('csv_data');
      
      getRequest.onsuccess = () => {
        db.close();
        if (getRequest.result && getRequest.result.data) {
          resolve(getRequest.result.data);
        } else {
          resolve(null);
        }
      };
      
      getRequest.onerror = () => {
        db.close();
        resolve(null); // Just resolve with null on error
      };
    };
    
    request.onerror = () => resolve(null);
  });
};

// Store data in IndexedDB
const saveToIndexedDB = async (data: any[]): Promise<void> => {
  return new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME, 1);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      db.createObjectStore(STORE_NAME, { keyPath: 'id' });
    };
    
    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      store.put({
        id: 'csv_data',
        data: data,
        timestamp: Date.now()
      });
      
      transaction.oncomplete = () => {
        db.close();
        resolve();
      };
      
      transaction.onerror = () => {
        db.close();
        resolve(); // Just resolve even on error
      };
    };
    
    request.onerror = () => resolve();
  });
};

export function useDuckDB() {
  const dbRef = useRef<duckdb.AsyncDuckDB | null>(null);
  const connRef = useRef<duckdb.AsyncDuckDBConnection | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize DuckDB and load data
  useEffect(() => {
    let isMounted = true;
    
    const init = async () => {
      try {
        // 1. Initialize DuckDB
        const BUNDLES = duckdb.getJsDelivrBundles();
        const bundle = await duckdb.selectBundle(BUNDLES);
        const worker_url = URL.createObjectURL(
          new Blob([`importScripts("${bundle.mainWorker}");`], { type: "text/javascript" })
        );
        
        const worker = new Worker(worker_url);
        const db = new duckdb.AsyncDuckDB(new duckdb.ConsoleLogger(duckdb.LogLevel.INFO), worker);
        await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
        URL.revokeObjectURL(worker_url);
        
        dbRef.current = db;
        const conn = await db.connect();
        connRef.current = conn;
        
        // 2. Try to get data from IndexedDB
        const cachedData = await getFromIndexedDB();
        
        if (cachedData) {
          // Use cached data
          await loadDataToDuckDB(conn, cachedData);
          console.log("Data loaded from IndexedDB cache");
        } else {
          // Load from CSV file
          await loadCSVData(conn);
        }
        
        if (isMounted) setIsReady(true);
      } catch (err: any) {
        console.error("DuckDB initialization failed:", err);
        if (isMounted) setError(err.message);
      }
    };
    
    init();
    
    return () => {
      isMounted = false;
      connRef.current?.close();
      dbRef.current?.terminate();
    };
  }, []);
  
  // Helper to load data into DuckDB
  const loadDataToDuckDB = async (conn: duckdb.AsyncDuckDBConnection, data: any[]) => {
    if (!data.length) return;
    
    const cols = Object.keys(data[0]);
    const types = cols.map(col => {
      const isNum = data.slice(0, 10).every(row => !isNaN(parseFloat(row[col])));
      return `${col} ${isNum ? 'DOUBLE' : 'VARCHAR'}`;
    });
    
    await conn.query(`DROP TABLE IF EXISTS financial_data`);
    await conn.query(`CREATE TABLE financial_data (${types.join(', ')})`);
    
    // Insert data in batches
    const batchSize = 100;
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      const rows = batch.map(row => 
        `(${cols.map(col => {
          const val = row[col];
          return val == null || val === '' ? 'NULL' : (isNaN(val) ? `'${String(val).replace(/'/g, "''")}'` : val);
        }).join(', ')})`
      ).join(', ');
      
      await conn.query(`INSERT INTO financial_data VALUES ${rows}`);
    }
  };
  
  // Load data from CSV
  const loadCSVData = async (conn: duckdb.AsyncDuckDBConnection) => {
    const res = await fetch('/files/dataset_elphi_finance_YYYYMM.csv');
    const csv = await res.text();
    
    return new Promise<void>((resolve, reject) => {
      Papa.parse(csv, {
        delimiter: ";",
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        complete: async ({ data }) => {
          if (!data.length) {
            return reject(new Error("No data in CSV"));
          }
          
          await loadDataToDuckDB(conn, data);
          
          // Store in IndexedDB for future use
          await saveToIndexedDB(data);
          
          resolve();
        },
        error: (err:any) => reject(err),
      });
    });
  };

  // Execute SQL query
  const executeQuery = useCallback(async (sql: string): Promise<DuckDBResult> => {
    try {
      if (!connRef.current) {
        throw new Error("DuckDB connection not initialized");
      }
      
      const result = await connRef.current.query(sql);
      return {
        data: result.toArray(),
        success: true
      };
    } catch (err: any) {
      return { error: err.message, success: false };
    }
  }, []);

  return {
    executeQuery,
    isLoading: !isReady,
    isDataLoaded: isReady,
    error
  };
}