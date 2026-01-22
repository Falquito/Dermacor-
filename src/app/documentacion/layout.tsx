import { ProtectedPage } from "@/components/auth/ProtectedPage";
import { Header } from "@/components/header";
import SideBar from "@/components/sideBar";
import { SidebarProvider } from "@/components/ui/sidebar-context";

export default function DocumentacionLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
    return(
        <ProtectedPage>
            <SidebarProvider>
                <Header />
                    <SideBar>
                        {children}
                    </SideBar>
            </SidebarProvider>
        </ProtectedPage>
    )
}