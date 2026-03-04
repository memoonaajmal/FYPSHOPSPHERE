import ChatbotWrapper from "../../../components/ChatbotWrapper";

export default function UserLayout({ children }) {
  return (
    <>
      {children}
      <ChatbotWrapper />
    </>
  );
}