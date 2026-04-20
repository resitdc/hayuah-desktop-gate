import React, { useState, useEffect, useRef } from "react";
import "./App.css";

interface Guest {
	id: string;
	name: string;
	instansi: string;
}

interface AlertState {
	show: boolean;
	message: string;
	type: "success" | "error";
}

const guestDatabase: Guest[] = [
	{ id: "QR001", name: "Andi Saputra", instansi: "PT Jaya Abadi" },
	{ id: "QR002", name: "Budi Santoso", instansi: "CV Makmur" },
	{ id: "QR003", name: "Citra Kirana", instansi: "Media Nusantara" },
	{ id: "QR004", name: "Diana Putri", instansi: "Kementerian Kominfo" },
	{ id: "QR005", name: "Eko Prasetyo", instansi: "Umum" },
	{ id: "QR006", name: "Fajar Nugraha", instansi: "Sponsor" },
	{ id: "QR007", name: "Gita Wirjawan", instansi: "VIP" }
];

export default function App() {
	const [inputValue, setInputValue] = useState<string>("");
	const [suggestions, setSuggestions] = useState<Guest[]>([]);
	const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
	const [isProcessing, setIsProcessing] = useState<boolean>(false);
	const [alert, setAlert] = useState<AlertState>({ show: false, message: "", type: "success" });

	const inputRef = useRef<HTMLInputElement>(null);
	const autocompleteWrapperRef = useRef<HTMLDivElement>(null);
	const buffer = useRef<string>("");
	const lastKeyTime = useRef<number>(Date.now());
	const lastScanRef = useRef<{ code: string; time: number }>({ code: "", time: 0 });

	const processCheckIn = (codeOrName: string) => {
		const val = codeOrName.trim();
		if (!val) {
			showAlert("Data kosong! Silakan scan atau ketik manual.", "error");
			return;
		}

		setIsProcessing(true);
		setShowSuggestions(false);

		const foundGuest = guestDatabase.find(g => 
			g.id.toLowerCase() === val.toLowerCase() || 
			g.name.toLowerCase() === val.toLowerCase()
		);

		setTimeout(() => {
			if (foundGuest) {
				showAlert(`Sukses! Tamu [${foundGuest.name}] berhasil Check-in.`, "success");
			} else {
				showAlert(`Sukses mencatat data baru: ${val}`, "success");
			}

			setInputValue("");
			setIsProcessing(false);
			
			if (inputRef.current) inputRef.current.focus();
		}, 500);
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const val = e.target.value;
		setInputValue(val);

		if (!val) {
			setShowSuggestions(false);
			return;
		}

		const filtered = guestDatabase.filter(guest =>
			guest.name.toLowerCase().includes(val.toLowerCase()) ||
			guest.id.toLowerCase().includes(val.toLowerCase())
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
		processCheckIn(inputValue);
	};

	const showAlert = (message: string, type: "success" | "error") => {
		setAlert({ show: true, message, type });
		setTimeout(() => setAlert({ show: false, message: "", type: "success" }), 3500);
	};


	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (autocompleteWrapperRef.current && !autocompleteWrapperRef.current.contains(event.target as Node)) {
				setShowSuggestions(false);
				if (inputRef.current) inputRef.current.focus();
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	useEffect(() => {
		const handleGlobalKeyDown = (e: KeyboardEvent) => {
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
				
				const isValidFormat = /^[a-zA-Z0-9]+$/.test(finalBarcode);
				if (!isValidFormat) {
					console.log("Ditolak: Format barcode tidak valid");
					buffer.current = "";
					return; 
				}

				const timeSinceLastScan = currentTime - lastScanRef.current.time;
				if (lastScanRef.current.code === finalBarcode && timeSinceLastScan < 3000) {
					console.log("Ditolak: Mencegah scan ganda (Spam)");
					buffer.current = "";
					return; 
				}

				lastScanRef.current = { code: finalBarcode, time: currentTime };

				processCheckIn(finalBarcode);
				buffer.current = "";
			}

			lastKeyTime.current = currentTime;
		};

		window.addEventListener('keydown', handleGlobalKeyDown);
		return () => window.removeEventListener('keydown', handleGlobalKeyDown);
	}, []);

	useEffect(() => {
		const lockFocus = () => {
			if (inputRef.current && document.activeElement !== inputRef.current) {
				inputRef.current.focus();
			}
		};

		document.addEventListener("click", lockFocus);
		
		window.addEventListener("focus", lockFocus);

		const intervalId = setInterval(lockFocus, 500);

		lockFocus();

		return () => {
			document.removeEventListener("click", lockFocus);
			window.removeEventListener("focus", lockFocus);
			clearInterval(intervalId);
		};
	}, []);

	return (
		<div className="app-wrapper">
			<div className="checkin-container">
				<div className="logo-container">
					<svg width="120" height="85" viewBox="0 0 130 93" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M81 25L43 92.5H27L0 46L27 0H42.5L16 46L34.5 79.5L65.5 25H81Z" fill="#19F8FF" />
						<path d="M50 14L57.5 0H102.5L129.5 46L102.5 92.5H87.5L72.5 67L80 54L95 79.5L114 46L95 14H50Z" fill="white" />
					</svg>
				</div>

				<h1>Penerimaan Tamu</h1>
				<p className="subtitle">Arahkan scanner ke barcode tamu atau ketik manual untuk mencari nama.</p>

				<div className="status-badge" id="scannerStatus">
					<span style={{ marginRight: "5px" }}>🟢</span> Sistem Ready To Scan
				</div>

				<form onSubmit={handleFormSubmit}>
					<div className="form-group">
						<div className="autocomplete-wrapper" ref={autocompleteWrapperRef}>
								<input
									ref={inputRef}
									type="text"
									className="form-control"
									placeholder="Scan Barcode / Ketik Nama..."
									autoFocus
									autoComplete="off"
									value={inputValue}
									onChange={handleInputChange}
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
												<span className="suggestion-name">{guest.name}</span>
												<span className="suggestion-id">ID: {guest.id} | {guest.instansi}</span>
											</div>
										))}
									</div>
								)}
						</div>
					</div>
					<button type="submit" className="btn-submit" disabled={isProcessing}>
						{isProcessing ? "Memproses..." : "Check In Tamu"}
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

