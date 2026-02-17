"use client";
import { useState, useRef, useEffect } from "react";
import { useDispatch } from "react-redux";
import { addItemToCart } from "../redux/CartSlice";
import { useAuth } from "../src/context/AuthContext";
import { getAuth } from "firebase/auth";
import { saveChatMessage } from "../src/utils/chatStorage";
import ChatbotUI from "./ChatbotUI";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:4000";

//  NUMBER WORD TO DIGIT CONVERTER
const numberWords = {
  zero: 0, one: 1, two: 2, three: 3, four: 4,
  five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14,
  fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
  twenty: 20, thirty: 30, forty: 40, fifty: 50,
  sixty: 60, seventy: 70, eighty: 80, ninety: 90,
  hundred: 100, thousand: 1000,
};

function convertNumberWordsToDigits(text) {
  let result = text.toLowerCase();

  // Handle compound numbers like "twenty one" or "twenty-one"
  const compoundPattern =
    /(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)[\s-]?(one|two|three|four|five|six|seven|eight|nine)/g;
  result = result.replace(compoundPattern, (match, tens, ones) => {
    return String(numberWords[tens] + numberWords[ones]);
  });

  // Replace individual number words
  Object.keys(numberWords).forEach((word) => {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    result = result.replace(regex, String(numberWords[word]));
  });

  return result;
}

export default function Chatbot() {
  const dispatch = useDispatch();
  const { user, loading: authLoading } = useAuth();
  const isLoggedIn = !!user;

  // UI state 
  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [imageErrors, setImageErrors] = useState(new Set());

  // Conversation-flow state 
  const [topProducts, setTopProducts] = useState([]);
  const [awaitingCartChoice, setAwaitingCartChoice] = useState(false);
  const [awaitingProductNumber, setAwaitingProductNumber] = useState(false);
  const [awaitingCheckoutChoice, setAwaitingCheckoutChoice] = useState(false);

  // Voice state 
  const [listening, setListening] = useState(false);
  const [voiceReady, setVoiceReady] = useState(false);
  const [voiceLoading, setVoiceLoading] = useState(false);

  // Refs 
  const recognitionRef = useRef(null);
  const transcriptRef = useRef("");
  const autoSendTimerRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll 
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  // Load chat history 
  useEffect(() => {
    if (!isLoggedIn || authLoading) return;

    async function fetchHistory() {
      try {
        const auth = getAuth();
        const firebaseUser = auth.currentUser;
        if (!firebaseUser) return;

        const token = await firebaseUser.getIdToken();
        const res = await fetch(`${BASE_URL}/api/chat/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        setHistory(data.messages || []);
      } catch (err) {
        console.error("Failed to load chat history", err);
      }
    }

    fetchHistory();
  }, [isLoggedIn, authLoading]);

  // Speech Recognition setup 
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

      if (transcriptRef.current) {
        const finalTranscript = transcriptRef.current.trim();
        if (finalTranscript) processTranscript(finalTranscript);
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

      if (finalTranscript) {
        transcriptRef.current = finalTranscript;
      } else if (interimTranscript) {
        transcriptRef.current = interimTranscript;
      }

      const convertedText = convertNumberWordsToDigits(
        transcriptRef.current.trim()
      );
      setInput(convertedText);

      if (finalTranscript) {
        processTranscript(finalTranscript.trim());
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);

      if (event.error === "no-speech" && transcriptRef.current) {
        processTranscript(transcriptRef.current.trim());
      }

      setListening(false);
      setVoiceLoading(false);
      setVoiceReady(false);
      transcriptRef.current = "";
    };

    recognitionRef.current = recognition;

    return () => {
      if (autoSendTimerRef.current) clearTimeout(autoSendTimerRef.current);
    };
  }, [awaitingCartChoice, awaitingCheckoutChoice]);

  // Helpers 
  const processTranscript = (transcript) => {
    if (!transcript) return;

    if (autoSendTimerRef.current) clearTimeout(autoSendTimerRef.current);

    const convertedTranscript = convertNumberWordsToDigits(transcript);
    const normalizedInput = convertedTranscript.toLowerCase();

    if (
      (awaitingCartChoice || awaitingCheckoutChoice) &&
      (normalizedInput === "yes" ||
        normalizedInput === "no" ||
        normalizedInput === "y" ||
        normalizedInput === "n" ||
        normalizedInput.includes("yes") ||
        normalizedInput.includes("no"))
    ) {
      let command = normalizedInput;
      if (normalizedInput.includes("yes")) command = "yes";
      if (normalizedInput.includes("no")) command = "no";

      autoSendTimerRef.current = setTimeout(() => send(command), 500);
    } else if (awaitingProductNumber) {
      autoSendTimerRef.current = setTimeout(
        () => send(convertedTranscript),
        500
      );
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

  const handleImageError = (filename) => {
    setImageErrors((prev) => new Set(prev).add(filename));
  };

  // Core send function 
  async function send(overrideInput = null) {
    const finalInput = (overrideInput || input).trim();
    if (!finalInput || loading) return;

    const userMsg = { sender: "user", text: finalInput };
    const userInput = finalInput.toLowerCase();

    setHistory((h) => [...h, userMsg]);
    if (isLoggedIn) saveChatMessage(userMsg);

    setInput("");
    setLoading(true);

    transcriptRef.current = "";
    if (autoSendTimerRef.current) clearTimeout(autoSendTimerRef.current);

    try {
      // ── Checkout confirmation flow ──────────────────────────────────────
      if (awaitingCheckoutChoice) {
        if (userInput === "yes" || userInput === "y") {
          const botMsg = {
            sender: "bot",
            text: "Taking you to the checkout page... 💳",
          };
          setHistory((h) => [...h, botMsg]);
          if (isLoggedIn) saveChatMessage(botMsg);

          setAwaitingCheckoutChoice(false);
          setLoading(false);
          setTimeout(() => (window.location.href = "/user/checkout"), 1000);
          return;
        }

        if (userInput === "no" || userInput === "n") {
          const botMsg = {
            sender: "bot",
            text: "No problem! 😊 You can keep exploring products.",
          };
          setHistory((h) => [...h, botMsg]);
          if (isLoggedIn) saveChatMessage(botMsg);

          setAwaitingCheckoutChoice(false);
          setLoading(false);
          return;
        }

        const botMsg = { sender: "bot", text: "Please reply with 'yes' or 'no'." };
        setHistory((h) => [...h, botMsg]);
        if (isLoggedIn) saveChatMessage(botMsg);

        setLoading(false);
        return;
      }

      // ── Add-to-cart yes/no flow ─────────────────────────────────────────
      if (awaitingCartChoice) {
        if (userInput === "no" || userInput === "n") {
          const botMsg = {
            sender: "bot",
            text: "Alright 😊 Let me know if you want to explore something else!",
          };
          setHistory((h) => [...h, botMsg]);
          if (isLoggedIn) saveChatMessage(botMsg);

          setAwaitingCartChoice(false);
          setTopProducts([]);
          setLoading(false);
          return;
        }

        if (userInput === "yes" || userInput === "y") {
          const productList = topProducts
            .map((p, i) => `${i + 1}. ${p.productDisplayName}`)
            .join("\n");
          const botMsg = {
            sender: "bot",
            text: `Great! Which product would you like to add?\n${productList}`,
          };
          setHistory((h) => [...h, botMsg]);
          if (isLoggedIn) saveChatMessage(botMsg);

          setAwaitingCartChoice(false);
          setAwaitingProductNumber(true);
          setLoading(false);
          return;
        }

        const botMsg = { sender: "bot", text: "Please reply with 'yes' or 'no'." };
        setHistory((h) => [...h, botMsg]);
        if (isLoggedIn) saveChatMessage(botMsg);

        setLoading(false);
        return;
      }

      // ── Product number selection flow ───────────────────────────────────
      if (awaitingProductNumber) {
        const index = parseInt(userInput) - 1;
        if (isNaN(index) || index < 0 || index >= topProducts.length) {
          const botMsg = {
            sender: "bot",
            text: "Please enter a valid product number (e.g., 1, 2, 3).",
          };
          setHistory((h) => [...h, botMsg]);
          if (isLoggedIn) saveChatMessage(botMsg);

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

        const botMsg1 = {
          sender: "bot",
          text: `✅ ${selected.productDisplayName} added to your cart! 🛒`,
        };
        const botMsg2 = {
          sender: "bot",
          text: "Would you like to go to the checkout page? (Yes/No)",
        };
        setHistory((h) => [...h, botMsg1, botMsg2]);
        if (isLoggedIn) saveChatMessage(botMsg1);
        if (isLoggedIn) saveChatMessage(botMsg2);

        setAwaitingProductNumber(false);
        setAwaitingCheckoutChoice(true);
        setTopProducts([]);
        setLoading(false);
        return;
      }

      // ── Regular backend call ────────────────────────────────────────────
      const res = await fetch(`${BASE_URL}/api/chatbot/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userInput }),
      });

      const data = await res.json();
      setTopProducts(data.topProducts || []);

      const botMsg = {
        sender: "bot",
        text: data.answer || "No answer received",
        products: data.topProducts || [],
      };
      setHistory((h) => [...h, botMsg]);
      if (isLoggedIn) saveChatMessage(botMsg);

      if (data.topProducts?.length > 0) {
        const botMsg2 = {
          sender: "bot",
          text: "Would you like to add one of these to your cart? (Yes/No)",
        };
        setHistory((h) => [...h, botMsg2]);
        if (isLoggedIn) saveChatMessage(botMsg2);

        setAwaitingCartChoice(true);
      }
    } catch (err) {
      console.error("Chatbot error:", err);
      const botMsg = {
        sender: "bot",
        text: "Sorry, I encountered an error. Please try again.",
      };
      setHistory((h) => [...h, botMsg]);
      if (isLoggedIn) saveChatMessage(botMsg);
    } finally {
      setLoading(false);
    }
  }

  const handleKeyPress = (e) => e.key === "Enter" && !loading && send();

  // Render 
  return (
    <ChatbotUI
      // State
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      isLoggedIn={isLoggedIn}
      history={history}
      input={input}
      setInput={setInput}
      loading={loading}
      imageErrors={imageErrors}
      // Voice
      listening={listening}
      voiceReady={voiceReady}
      voiceLoading={voiceLoading}
      // Handlers
      send={send}
      handleKeyPress={handleKeyPress}
      toggleListening={toggleListening}
      getMicButtonTitle={getMicButtonTitle}
      handleImageError={handleImageError}
      // Refs
      messagesEndRef={messagesEndRef}
    />
  );
}