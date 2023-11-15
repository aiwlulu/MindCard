import "./globals.css";
import Head from "./head";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Nav from "@/components/Navigation";
import AuthContextProvider from "@/lib/store/auth-context";
import { MindmapProvider } from "@/lib/store/mindmap-context";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <Head />
      <body suppressHydrationWarning={true}>
        <AuthContextProvider>
          <MindmapProvider>
            <ToastContainer />
            <Nav />
            <ProtectedRoute>{children}</ProtectedRoute>
          </MindmapProvider>
        </AuthContextProvider>
      </body>
    </html>
  );
}
