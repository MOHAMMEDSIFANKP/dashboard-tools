import Link from "next/link";

interface Navigation {
  name: string;
  href: string;
  type: "table" | "chart";
}

export default function Home() {
  const navigations: Navigation[] = [
    { name: "Redux + RTK + RTK query", href: "/redux", type: "table" },
    { name: "AG List", href: "/ag-table", type: "table" },
    { name: "TanStack Table", href: "/tanStack-table", type: "table" },
    { name: "React Table", href: "/react-table", type: "table" },

    { name: "Dashboard", href: "/dashboard", type: "chart" },
    { name: "AG Charts", href: "/ag-charts", type: "chart" },
    { name: "Chart JS", href: "/chart-js", type: "chart" },
    { name: "React Plotly", href: "/react-plotly", type: "chart" },
    { name: "Nivo Charts", href: "/nivo-charts", type: "chart" },
    { name: "Victory Charts", href: "/victory-charts", type: "chart" },
    { name: "ECharts", href: "/echarts", type: "chart" },
  ];

  const tables = navigations.filter((nav) => nav.type === "table");
  const charts = navigations.filter((nav) => nav.type === "chart");

  return (
    <section className="h-screen w-full grid grid-cols-[280px_1fr]">
      <aside className="p-6 bg-gray-900 text-white space-y-8">
        {/* Tables */}
        <div>
          <h2 className="text-lg font-semibold mb-3 border-b pb-1">🧾 Tables</h2>
          <nav className="flex flex-col gap-2">
            {tables.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="bg-gray-700 hover:bg-gray-600 transition rounded-xl px-4 py-2 text-sm"
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        {/* Charts */}
        <div>
          <h2 className="text-lg font-semibold mb-3 border-b pb-1">📊 Charts</h2>
          <nav className="flex flex-col gap-2">
            {charts.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="bg-gray-700 hover:bg-gray-600 transition rounded-xl px-4 py-2 text-sm"
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="p-10 flex items-center justify-center text-gray-500 text-xl">
        Select a section from the left
      </main>
    </section>
  );
}
