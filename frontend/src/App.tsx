import React, { useState, useEffect, useRef } from "react";
import useAPI from "./plugins/api";
import { Quit } from "../wailsjs/runtime/runtime";
import "./App.css";

interface Guest {
  id: string;
  name: string;
  email: string | null;
  whatsapp: string | null;
  qrcode: string | null;
  isVip: boolean | null;
}

interface AlertState {
  show: boolean;
  message: string;
  type: "success" | "error";
}

export default function App() {
  const { getListGuests, guestCheckin } = useAPI();

  const [guestDatabase, setGuestDatabase] = useState<Guest[]>([]);
  const [isFetchingGuests, setIsFetchingGuests] = useState<boolean>(true);
  const [inputValue, setInputValue] = useState<string>("");
  const [suggestions, setSuggestions] = useState<Guest[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [alert, setAlert] = useState<AlertState>({ show: false, message: "", type: "success" });
  const [vipGuest, setVipGuest] = useState<Guest | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteWrapperRef = useRef<HTMLDivElement>(null);
  const buffer = useRef<string>("");
  const lastKeyTime = useRef<number>(Date.now());
  const lastScanRef = useRef<{ code: string; time: number }>({ code: "", time: 0 });

  const eventId = "RESTUSALWA";

  useEffect(() => {
    const fetchGuests = async () => {
      try {
        setIsFetchingGuests(true);
        const response = await getListGuests(eventId, { limit: 1000 });
        if (response?.data?.success) {
          setGuestDatabase(response.data.results || []);
        }
      } catch (error) {
        showAlert("Failed to load guest database from server.", "error");
      } finally {
        setIsFetchingGuests(false);
      }
    };

    fetchGuests();
  }, []); 

  const handleQuit = () => {
		Quit();
  };

  const processCheckIn = async (guestIdOrName: string, type: "SCAN" | "MANUAL") => {
    if (vipGuest !== null) return;

    const val = guestIdOrName.trim();
    if (!val) {
      showAlert("Input is empty! Please scan or type manually.", "error");
      return;
    }

    let targetGuestId = val;
    if (type === "MANUAL") {
      const foundLocal = guestDatabase.find(
        (g) =>
          (g.id || "").toLowerCase() === val.toLowerCase() ||
          (g.name || "").toLowerCase() === val.toLowerCase()
      );
      if (foundLocal) {
        targetGuestId = foundLocal.id;
      }
    }

    setIsProcessing(true);
    setShowSuggestions(false);

    try {
      const response = await guestCheckin(targetGuestId, type);
      const resData = response.data;

      if (resData?.success) {
        const checkedInGuest = resData.results.guest;

        if (checkedInGuest?.isVip === true) {
          setVipGuest(checkedInGuest);
        } else {
          showAlert(`Success! Guest [${checkedInGuest.name}] checked in.`, "success");
        }
      }
    } catch (error: any) {
			console.log("ERROR ====>", error);
      const errorMessage = error.response?.data?.message || "An error occurred during check-in.";
      showAlert(errorMessage, "error");
    } finally {
      setInputValue("");
      setIsProcessing(false);

      if (!vipGuest && inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);

    if (!val) {
      setShowSuggestions(false);
      return;
    }

    const filtered = guestDatabase.filter(
      (guest) =>
        (guest.name || "").toLowerCase().includes(val.toLowerCase()) ||
        (guest.id || "").toLowerCase().includes(val.toLowerCase())
    );

    setSuggestions(filtered);
    setShowSuggestions(filtered.length > 0);
  };

  const handleSuggestionClick = (guest: Guest) => {
    setInputValue(guest.id);
    setShowSuggestions(false);
    if (inputRef.current) inputRef.current.focus();
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processCheckIn(inputValue, "MANUAL");
  };

  const closeVipAlert = () => {
    setVipGuest(null);
    setTimeout(() => {
      if (inputRef.current) inputRef.current.focus();
    }, 100);
  };

  const showAlert = (message: string, type: "success" | "error") => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: "", type: "success" }), 3500);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        autocompleteWrapperRef.current &&
        !autocompleteWrapperRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        if (!vipGuest && inputRef.current) inputRef.current.focus();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [vipGuest]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (vipGuest) return; 
      if (document.activeElement === inputRef.current) return;
      if (["Shift", "Control", "Alt", "Meta", "CapsLock", "Tab"].includes(e.key)) return;

      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTime.current;

      if (timeDiff > 50) {
        buffer.current = "";
      }

      if (e.key.length === 1) {
        buffer.current += e.key;
      }

      if (e.key === "Enter" && buffer.current.length > 2) {
        const finalBarcode = buffer.current.trim();
				console.log("FINAL BARCODE ===>", finalBarcode);

        const isValidFormat = /^[a-zA-Z0-9]+$/.test(finalBarcode);
        if (!isValidFormat) {
          buffer.current = "";
          return;
        }

        const timeSinceLastScan = currentTime - lastScanRef.current.time;
        if (lastScanRef.current.code === finalBarcode && timeSinceLastScan < 3000) {
          buffer.current = "";
          return;
        }

        lastScanRef.current = { code: finalBarcode, time: currentTime };

        processCheckIn(finalBarcode, "SCAN");
        buffer.current = "";
      }

      lastKeyTime.current = currentTime;
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [vipGuest]); 

  useEffect(() => {
    const lockFocus = () => {
      if (!vipGuest && inputRef.current && document.activeElement !== inputRef.current) {
        inputRef.current.focus();
      }
    };

    document.addEventListener("click", lockFocus);
    window.addEventListener("focus", lockFocus);
    const intervalId = setInterval(lockFocus, 500);

    return () => {
      document.removeEventListener("click", lockFocus);
      window.removeEventListener("focus", lockFocus);
      clearInterval(intervalId);
    };
  }, [vipGuest]);

  return (
    <div className="app-wrapper">
      <button className="btn-quit" onClick={handleQuit}>
        EXIT
      </button>

      {vipGuest && (
        <div className="vip-overlay">
          <div className="vip-card">
            <div className="vip-badge">👑</div>
            <h1>VIP GUEST</h1>
            <h2>{vipGuest.name}</h2>
            <button className="btn-vip-close" onClick={closeVipAlert} autoFocus>
              Welcome Guest & Continue
            </button>
          </div>
        </div>
      )}

      <div className="checkin-container">
        <div className="logo-container">
          <svg width="120" height="85" viewBox="0 0 130 93" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M81 25L43 92.5H27L0 46L27 0H42.5L16 46L34.5 79.5L65.5 25H81Z" fill="#19F8FF" />
            <path d="M50 14L57.5 0H102.5L129.5 46L102.5 92.5H87.5L72.5 67L80 54L95 79.5L114 46L95 14H50Z" fill="white" />
          </svg>
        </div>

        <h1>Guest Check-In</h1>
        <p className="subtitle">Point the scanner at the guest's barcode or type manually to search for a name.</p>

        <div className="status-badge" id="scannerStatus">
          {isFetchingGuests ? (
            <span style={{ color: "#f1c40f" }}>⏳ Loading Data...</span>
          ) : (
            <>
              <span style={{ marginRight: "5px" }}>🟢</span> System Ready To Scan
            </>
          )}
        </div>

        <form onSubmit={handleFormSubmit}>
          <div className="form-group">
            <div className="autocomplete-wrapper" ref={autocompleteWrapperRef}>
              <input
                ref={inputRef}
                type="text"
                className="form-control"
                placeholder="Scan Barcode / Type Name..."
                autoFocus
                autoComplete="off"
                value={inputValue}
                onChange={handleInputChange}
                disabled={isProcessing || isFetchingGuests || vipGuest !== null}
              />

              {showSuggestions && (
                <div className="suggestions-list" style={{ display: "block" }}>
                  {suggestions.map((guest) => (
                    <div
                      key={guest.id}
                      className="suggestion-item"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSuggestionClick(guest);
                      }}
                    >
                      <span className="suggestion-name">
                        {guest.isVip && <span style={{ color: "#FFD700", marginRight: "5px" }}>👑</span>}
                        {guest.name}
                      </span>
                      <span className="suggestion-id">
                        ID: {guest.id} {guest.whatsapp && `| 📞 ${guest.whatsapp}`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <button type="submit" className="btn-submit" disabled={isProcessing || isFetchingGuests || vipGuest !== null}>
            {isProcessing ? "PROCESSING..." : "SUBMIT"}
          </button>
        </form>

        {alert.show && (
          <div className={`alert ${alert.type}`}>
            {alert.message}
          </div>
        )}
      </div>
    </div>
  );
}