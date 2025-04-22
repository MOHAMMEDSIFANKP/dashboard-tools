import Image from "next/image";
import Link from "next/link";
import { name } from "plotly.js/lib/scatter";

interface Navigation {
  name: string;
  href: string;
}

export default function Home() {
  const navigations = [
    {
      name: "Redux + RTK + RTK query",
      href: "/redux",
    },
    {
      name: "AG List",
      href: "/ag-table",
    },
    {
      name: "TanStack Table",
      href: "/tanStack-table",
    },
    {
      name: "AG Charts",
      href: "/ag-charts",
    },
    {
      name: "Chart JS",
      href: "/chart-js",
    },
    {
      name: "React Plotly",
      href: "/react-plotly",
    },
    {
      name: "Nivo Charts",
      href: "/nivo-charts",
    },
    {
      name: "React Table",
      href: "/react-table",
    },
    {
      name: "Victory Charts",
      href: "/victory-charts",
    }
    
    
  ];
  return (
    <section className="h-screen w-full grid grid-cols-[30%__1fr]">
      <div className="p-[20px] flex flex-col gap-4 bg-gray-400">
        {navigations.map((item: Navigation) => (
          <Link
            key={item.href}
            href={item.href}
            className="bg-white text-black text-center border px-2 rounded-2xl"
          >
            {item.name}
          </Link>
        ))}
      </div>
      <div></div>
    </section>
  );
}
