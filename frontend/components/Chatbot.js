"use client";
import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import Link from "next/link";
import Image from "next/image"; // ✅ Import Next.js Image
import styles from "./styles/Chatbot.module.css";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:4000";

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [imageErrors, setImageErrors] = useState(new Set());
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history]);

  // ✅ Clean filename (remove quotes)
  const cleanFilename = (filename) => {
    if (!filename) return '';
    return filename.replace(/["']/g, '').trim();
  };

  const handleImageError = (filename) => {
    setImageErrors(prev => new Set(prev).add(filename));
    console.error("❌ Image failed to load:", filename);
  };

  async function send() {
    if (!input.trim() || loading) return;

    const userMsg = { sender: "user", text: input };
    const userInput = input;

    setHistory((h) => [...h, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/api/chatbot/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userInput }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to get response");
      }

      const data = await res.json();

      setHistory((h) => [
        ...h,
        {
          sender: "bot",
          text: data.answer || "No answer received",
          products: data.topProducts || [],
        },
      ]);
    } catch (err) {
      console.error("Chatbot error:", err);
      setHistory((h) => [
        ...h,
        {
          sender: "bot",
          text: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !loading) {
      send();
    }
  };

  return (
    <>
      {/* Chat Button */}
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
          {/* Header */}
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

          {/* Messages */}
          <div className={styles.messages}>
            {history.length === 0 && (
              <div className={styles.welcomeMessage}>
                <p>👋 Hi! I'm your shopping assistant.</p>
                <p>Ask me about products, colors, styles, or anything else!</p>
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
                          const cleanedFilename = cleanFilename(p.imageFilename);
                          // ✅ Build URL same way as ProductCard
                          const imageSrc = `${BASE_URL.replace(/\/$/, "")}/images/${cleanedFilename}`;
                          const hasError = imageErrors.has(cleanedFilename);
                          
                          return (
                            <Link
                              key={idx}
                              href={`/user/products/${p._id}`}
                              className={styles.productCard}
                              onClick={() => setIsOpen(false)}
                            >
                              <div className={styles.productImage}>
                                {cleanedFilename && !hasError ? (
                                  // ✅ Use Next.js Image component
                                  <Image
                                    src={imageSrc}
                                    alt={p.productDisplayName || "Product"}
                                    width={120}
                                    height={120}
                                    className={styles.image}
                                    onError={() => handleImageError(cleanedFilename)}
                                  />
                                ) : (
                                  <div className={styles.noImage}>
                                    {p.productDisplayName?.charAt(0) || '?'}
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

          {/* Input */}
          <div className={styles.inputArea}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about products..."
              disabled={loading}
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              aria-label="Send message"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}