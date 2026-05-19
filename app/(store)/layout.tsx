import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
// import { WhatsAppButton } from "@/components/layout/whatsapp-button";
import { CartSheet } from "@/components/cart/cart-sheet";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="min-h-screen">{children}</main>
      <Footer />
      {/* <WhatsAppButton /> */}
      <CartSheet />
    </>
  );
}
