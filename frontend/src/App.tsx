import { useState, useEffect } from "react";
import { EventsOn } from "../wailsjs/runtime/runtime";
import "./App.css";

const App = () => {
	const [barcode, setBarcode] = useState<string>("Belum ada data");
	const [scanCount, setScanCount] = useState<number>(0);

	useEffect(() => {
		EventsOn("on-barcode-scanned", (data: string) => {
			setBarcode(data);
			setScanCount((prev) => prev + 1);
		});
	}, []);

	return (
		<div id="App">
			<h1>Guest Barcode Scanner</h1>
			<div className="status-box">
				<h2>Data Masuk:</h2>
				<h1 style={{ color: "#00ff00", fontSize: "40px" }}>{barcode}</h1>
				<p>Total Barcode Discan: {scanCount}</p>
			</div>
		</div>
	)
}

export default App;