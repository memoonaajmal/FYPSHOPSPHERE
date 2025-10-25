"use client";
import { useState, useRef, useEffect } from "react";
import { useDispatch } from "react-redux";
import { addItemToCart } from "../redux/CartSlice";
import { MessageCircle, X, Send } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import styles from "./styles/Chatbot.module.css";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:4000";

export default function Chatbot() {
  const dispatch = useDispatch();
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("chatbotOpen") === "true";
    }
    return false;
  });

  const [history, setHistory] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("chatbotHistory");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [imageErrors, setImageErrors] = useState(new Set());
  const [topProducts, setTopProducts] = useState([]);
  const [awaitingCartChoice, setAwaitingCartChoice] = useState(false);
  const [awaitingProductNumber, setAwaitingProductNumber] = useState(false);
  const [awaitingCheckoutChoice, setAwaitingCheckoutChoice] = useState(false);
  const messagesEndRef = useRef(null);

  // Save chat state
  useEffect(() => {
    localStorage.setItem("chatbotOpen", isOpen);
  }, [isOpen]);

  useEffect(() => {
    localStorage.setItem("chatbotHistory", JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const cleanFilename = (filename) =>
    filename?.replace(/["']/g, "").trim() || "";

  const handleImageError = (filename) => {
    setImageErrors((prev) => new Set(prev).add(filename));
  };

    async function send() {
    if (!input.trim() || loading) return;
    const userMsg = { sender: "user", text: input };
    const userInput = input.toLowerCase();
    setHistory((h) => [...h, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // 🛒 Step 1 — Handle checkout confirmation FIRST
      if (awaitingCheckoutChoice) {
        if (userInput.includes("yes")) {
          setHistory((h) => [
            ...h,
            { sender: "bot", text: "Taking you to the checkout page... 💳" },
          ]);
          setAwaitingCheckoutChoice(false);
          setLoading(false);
          setTimeout(() => (window.location.href = "/user/checkout"), 1000);
          return;
        }

        if (userInput.includes("no")) {
          setHistory((h) => [
            ...h,
            { sender: "bot", text: "No problem! 😊 You can keep exploring products." },
          ]);
          setAwaitingCheckoutChoice(false);
          setLoading(false);
          return;
        }

        setHistory((h) => [
          ...h,
          { sender: "bot", text: "Please reply with 'yes' or 'no'." },
        ]);
        setLoading(false);
        return;
      }

      // 🛍️ Step 2 — Handle add-to-cart yes/no
      if (awaitingCartChoice) {
        if (userInput.includes("no")) {
          setHistory((h) => [
            ...h,
            { sender: "bot", text: "Alright 😊 Let me know if you want to explore something else!" },
          ]);
          setAwaitingCartChoice(false);
          setLoading(false);
          return;
        }

        if (userInput.includes("yes")) {
          const productList = topProducts
            .map((p, i) => `${i + 1}. ${p.productDisplayName}`)
            .join("\n");
          setHistory((h) => [
            ...h,
            { sender: "bot", text: `Great! Which product would you like to add?\n${productList}` },
          ]);
          setAwaitingCartChoice(false);
          setAwaitingProductNumber(true);
          setLoading(false);
          return;
        }

        setHistory((h) => [...h, { sender: "bot", text: "Please reply with 'yes' or 'no'." }]);
        setLoading(false);
        return;
      }

      // 🧮 Step 3 — Handle product selection
      if (awaitingProductNumber) {
        const index = parseInt(userInput) - 1;
        if (isNaN(index) || index < 0 || index >= topProducts.length) {
          setHistory((h) => [
            ...h,
            { sender: "bot", text: "Please enter a valid product number (e.g., 1, 2, 3)." },
          ]);
          setLoading(false);
          return;
        }

        const selected = topProducts[index];
        dispatch(
          addItemToCart({
            id: selected._id,
            name: selected.productDisplayName,
            price: selected.price || 0,
            image: `${BASE_URL}/images/${selected.imageFilename}`,
            storeId: selected.storeId,
            qty: 1,
          })
        );

        setHistory((h) => [
          ...h,
          { sender: "bot", text: `✅ ${selected.productDisplayName} added to your cart! 🛒` },
          { sender: "bot", text: "Would you like to go to the checkout page? (Yes/No)" },
        ]);

        setAwaitingProductNumber(false);
        setAwaitingCheckoutChoice(true);
        setTopProducts([]);
        setLoading(false);
        return;
      }

      // 🤖 Step 4 — Regular chatbot backend call
      const res = await fetch(`${BASE_URL}/api/chatbot/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userInput }),
      });

      const data = await res.json();
      setTopProducts(data.topProducts || []);

      setHistory((h) => [
        ...h,
        { sender: "bot", text: data.answer || "No answer received", products: data.topProducts || [] },
      ]);

      if (data.topProducts?.length > 0) {
        setHistory((h) => [
          ...h,
          { sender: "bot", text: "Would you like to add one of these to your cart? (Yes/No)" },
        ]);
        setAwaitingCartChoice(true);
      }
    } catch (err) {
      console.error("Chatbot error:", err);
      setHistory((h) => [...h, { sender: "bot", text: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  const handleKeyPress = (e) => e.key === "Enter" && !loading && send();

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
                          const imageSrc = `${BASE_URL.replace(
                            /\/$/,
                            ""
                          )}/images/${cleaned}`;
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
              aria-label="Send"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
