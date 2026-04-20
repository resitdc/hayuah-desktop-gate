import { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
    const [barcode, setBarcode] = useState<string>("Belum ada data");
    
    const buffer = useRef<string>(""); 
    const lastKeyTime = useRef<number>(Date.now());

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const currentTime = Date.now();
            const timeDiff = currentTime - lastKeyTime.current; 
            
            if (timeDiff > 50) {
                buffer.current = "";
            }

            if (e.key.length === 1) {
                buffer.current += e.key;
            }

            if (e.key === "Enter" && buffer.current.length > 3) {
                const finalBarcode = buffer.current;
                console.log("Scanner berhasil membaca:", finalBarcode);
                
                setBarcode(finalBarcode);
                
                
                buffer.current = "";
            }

            lastKeyTime.current = currentTime;
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    return (
        <div id="App">
            <h1>Sistem Operator Scanner (Mode Keyboard)</h1>
            <div className="status-box">
                <h2>Data Masuk:</h2>
                <h1 style={{ color: '#00ff00', fontSize: '40px' }}>{barcode}</h1>
            </div>
        </div>
    )
}

export default App;