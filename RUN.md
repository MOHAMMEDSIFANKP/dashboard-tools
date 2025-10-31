## Dashboard Tools — Test Case Project

This repository is a test case project showcasing a Next.js (TypeScript) dashboard that compares and demonstrates multiple charting and table libraries. It includes sample datasets (CSV) and in-browser DuckDB (WASM) usage for quick data exploration, plus Redux state management and a variety of UI components.

### Prerequisites
- **Node.js**: 18+ (LTS recommended)
- **npm**: comes with Node (project uses `package-lock.json`)

### 1) Install dependencies
```bash
npm install
```

### 2) Run in development
Starts Next.js with Turbopack for fast HMR.
```bash
npm run dev
```
Then open `http://localhost:3000`.

### 3) Build for production
```bash
npm run build
```

### 4) Start production server
After building, start the server:
```bash
npm start
```
The app will be served at `http://localhost:3000` by default.

### Notable routes & features
- **Home**: `src/app/page.tsx` with links to feature pages
- **Charts**: `ag-charts`, `highcharts`, `chart-js`, `nivo-charts`, `echarts`, `react-plotly`, `victory-charts`
- **AG Charts Enterprise**: route `/ag-charts-enterprise` → `src/app/ag-charts-enterprise/`
- **Syncfusion Charts**: route `/syncfusion` → `src/app/syncfusion/`
- **Tables**: `ag-table`, `react-table`, `tanStack-table`
- **Dashboards**: `dashboard`, including draggable layouts
- **Redux**: `src/store`, slices in `src/store/slices`
- **DuckDB (WASM)**: `src/hooks/useDuckDB.tsx`, provider in `src/app/_providers/DuckDBContext.tsx`
- **Sample data**: `public/files/`

### Libraries: Free vs Paid
- Free dashboard tools:
  - `ag-charts` (community)
  - `chart-js`
  - `nivo-charts`
  - `echarts`
  - `react-plotly`
  - `victory-charts`
- Paid dashboard tools:
  - `ag-charts-enterprise`
  - `syncfusion`
  - `highcharts`

### Tables
- Free tables in this project:
  - `ag-table` (AG Grid Community)
  - `react-table`
  - `tanStack-table`
  - `@table-library/react-table-library`
- Paid table options (not included here):
  - AG Grid Enterprise, Syncfusion DataGrid, etc.

### Linting
```bash
npm run lint
```

### Configuration
- Next.js config: `next.config.ts`
- TypeScript config: `tsconfig.json`
- ESLint config: `eslint.config.mjs`
- Tailwind/PostCSS: `postcss.config.mjs` (Tailwind v4 via PostCSS)

### Notes
- Some enterprise/large libraries (e.g., `ag-charts-enterprise`) may require a license for full features in real deployments. They are included here for test and comparison purposes.

### AG Charts Enterprise setup (optional license)
- Page: `/ag-charts-enterprise` uses `ag-charts-enterprise`.
- To add a license key, edit `src/app/ag-charts-enterprise/AGChartsEnterprise.tsx` and uncomment the line inside the browser guard:
  ```ts
  // AgCharts.setLicenseKey('your-license-key');
  ```

### Syncfusion Charts setup (optional license)
- Page: `/syncfusion` uses `@syncfusion/ej2-react-charts`.
- Provide your license key via env var and restart dev server:
  1. Create `.env.local` in project root:
     ```bash
     echo NEXT_PUBLIC_SYNCFUSION_LICENSE_KEY=YOUR_KEY_HERE > .env.local
     ```
  2. The key is read in `src/app/syncfusion/syncfusionPage.tsx` via `registerLicense(process.env.NEXT_PUBLIC_SYNCFUSION_LICENSE_KEY)`.


