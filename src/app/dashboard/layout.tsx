// app/layout.tsx
import SideBarLayout from "@/components/sidebar/sidebar"
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Generated by create next app",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <div>
            <SideBarLayout>
                {children}
            </SideBarLayout>
        </div>
    );
}
