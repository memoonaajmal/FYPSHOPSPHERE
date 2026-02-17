"use client";
import { MessageCircle, X, Send, Mic, MicOff } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import styles from "./styles/Chatbot.module.css";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:4000";

export default function ChatbotUI({
  // State
  isOpen,
  setIsOpen,
  isLoggedIn,
  history,
  input,
  setInput,
  loading,
  imageErrors,
  // Voice
  listening,
  voiceReady,
  voiceLoading,
  // Handlers
  send,
  handleKeyPress,
  toggleListening,
  getMicButtonTitle,
  handleImageError,
  // Refs
  messagesEndRef,
}) {
  const cleanFilename = (filename) =>
    filename?.replace(/["']/g, "").trim() || "";

  return (
    <>
      {/* Floating Chat Button */}
      <button
        className={styles.chatButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open chat"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className={styles.chatWindow}>
          <div className={styles.chatHeader}>
            <div className={styles.headerContent}>
              <MessageCircle size={20} />
              <span>ShopSphere Assistant</span>
            </div>
            <button
              className={styles.closeButton}
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
            >
              <X size={20} />
            </button>
          </div>

          {!isLoggedIn && (
            <div className={styles.disclaimer}>
              ⚠️ You are not logged in. This chat will NOT be saved.
            </div>
          )}

          {/* Chat Messages */}
          <div className={styles.messages}>
            {history.length === 0 && (
              <div className={styles.welcomeMessage}>
                <p>👋 Hi! I'm your shopping assistant.</p>
                <p>Ask me about products, colors, or categories!</p>
                <div className={styles.suggestions}>
                  <button
                    onClick={() => setInput("Show me black watches for men")}
                  >
                    Black watches
                  </button>
                  <button onClick={() => setInput("I need a blue handbag")}>
                    Blue handbags
                  </button>
                  <button
                    onClick={() => setInput("What sunglasses do you have?")}
                  >
                    Sunglasses
                  </button>
                </div>
              </div>
            )}

            {history.map((m, i) => (
              <div
                key={i}
                className={`${styles.messageWrapper} ${
                  m.sender === "user" ? styles.userMessage : styles.botMessage
                }`}
              >
                <div className={styles.messageBubble}>
                  <div className={styles.messageText}>
                    {m.text.split("\n").map((line, idx) => (
                      <p key={idx}>{line}</p>
                    ))}
                  </div>

                  {m.products && m.products.length > 0 && (
                    <div className={styles.productsSection}>
                      <strong className={styles.productsTitle}>
                        Top matches:
                      </strong>
                      <div className={styles.productCards}>
                        {m.products.slice(0, 5).map((p, idx) => {
                          const cleaned = cleanFilename(p.imageFilename);
                          const imageSrc = `${BASE_URL.replace(/\/$/, "")}/images/${cleaned}`;
                          const hasError = imageErrors.has(cleaned);

                          return (
                            <Link
                              key={idx}
                              href={`/user/products/${p._id}`}
                              className={styles.productCard}
                            >
                              <div className={styles.productImage}>
                                {cleaned && !hasError ? (
                                  <Image
                                    src={imageSrc}
                                    alt={p.productDisplayName || "Product"}
                                    width={120}
                                    height={120}
                                    onError={() => handleImageError(cleaned)}
                                  />
                                ) : (
                                  <div className={styles.noImage}>
                                    {p.productDisplayName?.charAt(0) || "?"}
                                  </div>
                                )}
                              </div>
                              <div className={styles.productInfo}>
                                <span className={styles.productName}>
                                  {p.productDisplayName}
                                </span>
                                <span className={styles.productDetails}>
                                  {p.baseColour} • {p.gender}
                                </span>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className={`${styles.messageWrapper} ${styles.botMessage}`}>
                <div className={styles.messageBubble}>
                  <div className={styles.typingIndicator}>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className={styles.inputArea}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                voiceLoading
                  ? "Preparing microphone..."
                  : voiceReady
                    ? "🎤 Ready! Speak now..."
                    : listening
                      ? "Listening..."
                      : "Ask about products..."
              }
              disabled={loading}
            />

            {/* MIC BUTTON */}
            <button
              onClick={toggleListening}
              title={getMicButtonTitle()}
              disabled={voiceLoading}
              className={`${styles.micBtn} ${
                voiceLoading
                  ? styles.micDisabled
                  : listening
                    ? styles.micListening
                    : voiceReady
                      ? styles.micReady
                      : styles.micIdle
              }`}
            >
              {listening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>

            <button onClick={() => send()} disabled={loading || !input.trim()}>
              <Send size={20} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
