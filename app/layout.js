import "./globals.css";
import Head from "./head";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Nav from "@/components/Navigation";
import AuthContextProvider from "@/lib/store/auth-context";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <Head />
      <body suppressHydrationWarning={true}>
        <AuthContextProvider>
          <ToastContainer />
          <Nav />
          {children}
        </AuthContextProvider>
      </body>
    </html>
  );
}
