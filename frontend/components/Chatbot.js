"use client";
import { useState, useRef, useEffect } from "react";
import { useDispatch } from "react-redux";
import { addItemToCart } from "../redux/CartSlice";
import { MessageCircle, X, Send, Mic, MicOff } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import styles from "./styles/Chatbot.module.css";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:4000";

// 🔢 NUMBER WORD TO DIGIT CONVERTER
const numberWords = {
  zero: 0, one: 1, two: 2, three: 3, four: 4,
  five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14,
  fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
  twenty: 20, thirty: 30, forty: 40, fifty: 50,
  sixty: 60, seventy: 70, eighty: 80, ninety: 90,
  hundred: 100, thousand: 1000
};

function convertNumberWordsToDigits(text) {
  let result = text.toLowerCase();
  
  // Handle compound numbers like "twenty one" or "twenty-one"
  const compoundPattern = /(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)[\s-]?(one|two|three|four|five|six|seven|eight|nine)/g;
  result = result.replace(compoundPattern, (match, tens, ones) => {
    return String(numberWords[tens] + numberWords[ones]);
  });
  
  // Replace individual number words
  Object.keys(numberWords).forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    result = result.replace(regex, String(numberWords[word]));
  });
  
  return result;
}

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

  /* 🎤 Voice states */
  const [listening, setListening] = useState(false);
  const [voiceReady, setVoiceReady] = useState(false);
  const [voiceLoading, setVoiceLoading] = useState(false);
  const recognitionRef = useRef(null);
  const transcriptRef = useRef("");
  const autoSendTimerRef = useRef(null);

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

  /* 🎙️ Setup Speech Recognition */
  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true; 
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onstart = () => {
      setListening(true);
      setVoiceLoading(false);
      setVoiceReady(true);
      transcriptRef.current = "";
    };

    recognition.onend = () => {
      setListening(false);
      setVoiceReady(false);
      
      // Process any remaining transcript when recognition ends
      if (transcriptRef.current) {
        const finalTranscript = transcriptRef.current.trim();
        if (finalTranscript) {
          processTranscript(finalTranscript);
        }
        transcriptRef.current = "";
      }
    };

    recognition.onresult = (event) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      // Update the transcript ref with the latest result
      if (finalTranscript) {
        transcriptRef.current = finalTranscript;
      } else if (interimTranscript) {
        transcriptRef.current = interimTranscript;
      }

      // 🔢 Convert number words to digits before showing
      const convertedText = convertNumberWordsToDigits(transcriptRef.current.trim());
      setInput(convertedText);

      // If we have a final result, process it immediately
      if (finalTranscript) {
        const cleanTranscript = finalTranscript.trim();
        processTranscript(cleanTranscript);
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      
      // Don't treat "no-speech" as a real error for short utterances
      if (event.error === "no-speech") {
        if (transcriptRef.current) {
          processTranscript(transcriptRef.current.trim());
        }
      }
      
      setListening(false);
      setVoiceLoading(false);
      setVoiceReady(false);
      transcriptRef.current = "";
    };

    recognitionRef.current = recognition;

    return () => {
      if (autoSendTimerRef.current) {
        clearTimeout(autoSendTimerRef.current);
      }
    };
  }, [awaitingCartChoice, awaitingCheckoutChoice]);

  const processTranscript = (transcript) => {
    if (!transcript) return;

    // Clear any existing timer
    if (autoSendTimerRef.current) {
      clearTimeout(autoSendTimerRef.current);
    }

    // 🔢 Convert number words to digits
    const convertedTranscript = convertNumberWordsToDigits(transcript);
    const normalizedInput = convertedTranscript.toLowerCase();
    
    // Auto-send for simple yes/no responses in conversation flows
    if (
      (awaitingCartChoice || awaitingCheckoutChoice) &&
      (normalizedInput === "yes" || 
       normalizedInput === "no" || 
       normalizedInput === "y" || 
       normalizedInput === "n" ||
       normalizedInput.includes("yes") ||
       normalizedInput.includes("no"))
    ) {
      // Extract the actual yes/no
      let command = normalizedInput;
      if (normalizedInput.includes("yes")) command = "yes";
      if (normalizedInput.includes("no")) command = "no";
      
      // Small delay to show the text, then auto-send
      autoSendTimerRef.current = setTimeout(() => {
        send(command);
      }, 500);
    } else if (awaitingProductNumber) {
      // Auto-send for product number selection
      autoSendTimerRef.current = setTimeout(() => {
        send(convertedTranscript);
      }, 500);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (listening) {
      recognitionRef.current.stop();
    } else {
      setVoiceLoading(true);
      transcriptRef.current = "";
      
      setTimeout(() => {
        if (recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch (error) {
            console.error("Error starting recognition:", error);
            setVoiceLoading(false);
          }
        }
      }, 1000);
    }
  };

  const getMicButtonTitle = () => {
    if (voiceLoading) return "Preparing voice input...";
    if (listening && voiceReady) return "Ready! Speak now";
    if (listening) return "Listening...";
    return "Voice input";
  };

  const cleanFilename = (filename) =>
    filename?.replace(/["']/g, "").trim() || "";

  const handleImageError = (filename) => {
    setImageErrors((prev) => new Set(prev).add(filename));
  };

  async function send(overrideInput = null) {
    const finalInput = (overrideInput || input).trim();

    if (!finalInput || loading) return;

    const userMsg = { sender: "user", text: finalInput };
    const userInput = finalInput.toLowerCase();

    setHistory((h) => [...h, userMsg]);
    setInput("");
    setLoading(true);

    transcriptRef.current = "";
    if (autoSendTimerRef.current) {
      clearTimeout(autoSendTimerRef.current);
    }

    try {
      // ✅ Handle checkout confirmation
      if (awaitingCheckoutChoice) {
        if (userInput === "yes" || userInput === "y") {
          setHistory((h) => [
            ...h,
            { sender: "bot", text: "Taking you to the checkout page... 💳" },
          ]);
          setAwaitingCheckoutChoice(false);
          setLoading(false);
          setTimeout(() => (window.location.href = "/user/checkout"), 1000);
          return;
        }

        if (userInput === "no" || userInput === "n") {
          setHistory((h) => [
            ...h,
            {
              sender: "bot",
              text: "No problem! 😊 You can keep exploring products.",
            },
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

      // ✅ Handle add-to-cart yes/no
      if (awaitingCartChoice) {
        if (userInput === "no" || userInput === "n") {
          setHistory((h) => [
            ...h,
            {
              sender: "bot",
              text: "Alright 😊 Let me know if you want to explore something else!",
            },
          ]);
          setAwaitingCartChoice(false);
          setTopProducts([]);
          setLoading(false);
          return;
        }

        if (userInput === "yes" || userInput === "y") {
          const productList = topProducts
            .map((p, i) => `${i + 1}. ${p.productDisplayName}`)
            .join("\n");
          setHistory((h) => [
            ...h,
            {
              sender: "bot",
              text: `Great! Which product would you like to add?\n${productList}`,
            },
          ]);
          setAwaitingCartChoice(false);
          setAwaitingProductNumber(true);
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

      // ✅ Handle product selection
      if (awaitingProductNumber) {
        const index = parseInt(userInput) - 1;
        if (isNaN(index) || index < 0 || index >= topProducts.length) {
          setHistory((h) => [
            ...h,
            {
              sender: "bot",
              text: "Please enter a valid product number (e.g., 1, 2, 3).",
            },
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
          }),
        );

        setHistory((h) => [
          ...h,
          {
            sender: "bot",
            text: `✅ ${selected.productDisplayName} added to your cart! 🛒`,
          },
          {
            sender: "bot",
            text: "Would you like to go to the checkout page? (Yes/No)",
          },
        ]);

        setAwaitingProductNumber(false);
        setAwaitingCheckoutChoice(true);
        setTopProducts([]);
        setLoading(false);
        return;
      }

      // ✅ Regular chatbot backend call (only if NOT in any flow)
      const res = await fetch(`${BASE_URL}/api/chatbot/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userInput }),
      });

      const data = await res.json();
      setTopProducts(data.topProducts || []);

      setHistory((h) => [
        ...h,
        {
          sender: "bot",
          text: data.answer || "No answer received",
          products: data.topProducts || [],
        },
      ]);

      // ✅ Only ask to add products if we have products
      if (data.topProducts?.length > 0) {
        setHistory((h) => [
          ...h,
          {
            sender: "bot",
            text: "Would you like to add one of these to your cart? (Yes/No)",
          },
        ]);
        setAwaitingCartChoice(true);
      }
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
                            "",
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

            {/* 🎤 MIC BUTTON */}
            <button 
              onClick={toggleListening} 
              title={getMicButtonTitle()}
              disabled={voiceLoading}
              style={{
                opacity: voiceLoading ? 0.5 : 1,
                color: voiceReady ? '#4CAF50' : listening ? '#ff9800' : 'inherit'
              }}
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