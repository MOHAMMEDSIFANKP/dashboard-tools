// hooks/useDuckDB.js
'use client';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import * as duckdb from '@duckdb/duckdb-wasm';
import Papa from 'papaparse';

const instantiateDuckDB = async () => {
  const CDN_BUNDLES = duckdb.getJsDelivrBundles();
  const bundle = await duckdb.selectBundle(CDN_BUNDLES);

  const worker_url = URL.createObjectURL(
    new Blob([`importScripts("${bundle.mainWorker}");`], {
      type: "text/javascript",
    })
  );

  const worker = new Worker(worker_url);
  const logger = new duckdb.ConsoleLogger("INFO");
  const db = new duckdb.AsyncDuckDB(logger, worker);
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
  URL.revokeObjectURL(worker_url);
  return db;
};

export function useDuckDB() {
  const dbRef = useRef(null);
  const connRef = useRef(null);

  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const [columns, setColumns] = useState([]);

  const initDuckDB = useCallback(async () => {
    try {
      const db = await instantiateDuckDB();
      dbRef.current = db;

      const conn = await db.connect();
      connRef.current = conn;

      return conn;
    } catch (err) {
      console.error("DuckDB init failed:", err);
      setError(err.message);
      return null;
    }
  }, []);

  const loadCSV = useCallback(async (conn) => {
    try {
      const res = await fetch('/files/dataset_elphi_finance_YYYYMM.csv');
      const csv = await res.text();

      return new Promise((resolve, reject) => {
        Papa.parse(csv, {
          delimiter: ";",
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true,
          complete: async ({ data }) => {
            if (!data.length) {
              return reject(new Error("No data in CSV"));
            }

            const cols = Object.keys(data[0]);
            const types = cols.map(col => {
              const isNum = data.slice(0, 10).every(row => !isNaN(parseFloat(row[col])));
              return `${col} ${isNum ? 'DOUBLE' : 'VARCHAR'}`;
            });

            await conn.query(`DROP TABLE IF EXISTS financial_data`);
            await conn.query(`CREATE TABLE financial_data (${types.join(', ')})`);

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

            setColumns(cols.map(c => ({ field: c })));
            resolve();
          },
          error: err => reject(err),
        });
      });

    } catch (err) {
      console.error("CSV Load Failed:", err);
      throw err;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      const conn = await initDuckDB();
      if (conn && isMounted) {
        try {
          await loadCSV(conn);
          if (isMounted) setIsReady(true);
        } catch (err) {
          if (isMounted) setError(err.message);
        }
      }
    })();

    return () => {
      isMounted = false;
      connRef.current?.close();
      dbRef.current?.terminate();
    };
  }, [initDuckDB, loadCSV]);

  const executeQuery = useCallback(async (sql) => {
    try {
      const result = await connRef.current.query(sql);
      return {
        data: result.toArray(),
        columnNames: result.schema.fields.map(f => f.name),
        success: true
      };
    } catch (err) {
      return { error: err.message, success: false };
    }
  }, []);

  const getAvailableYears = useCallback(async () => {
    try {
      const res = await connRef.current.query(`SELECT DISTINCT "fiscalYear" FROM financial_data ORDER BY "fiscalYear"`);
      return { data: res.toArray().map(r => r[0]), success: true };
    } catch (err) {
      return { error: err.message, success: false };
    }
  }, []);

  return {
    executeQuery,
    getAvailableYears,
    isLoading: !isReady,
    isDataLoaded: isReady,
    error,
    columns
  };
}
