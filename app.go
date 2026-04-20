package main

import (
	"context"
	"fmt"
	"log"
	"strings"

	"github.com/wailsapp/wails/v2/pkg/runtime"
	"go.bug.st/serial"
)

type App struct {
	ctx context.Context
}

func NewApp() *App {
	return &App{}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	go a.listenToScanner()
}

func (a *App) listenToScanner() {
	portName := "COM3" 
	
	mode := &serial.Mode{
		BaudRate: 9600,
	}

	port, err := serial.Open(portName, mode)
	if err != nil {
		log.Printf("Gagal membuka port %s: %v\n", portName, err)
		return
	}
	defer port.Close()

	fmt.Println("Berhasil terhubung ke scanner di", portName)

	buf := make([]byte, 128)
	var barcodeBuilder strings.Builder

	for {
		n, err := port.Read(buf)
		if err != nil {
			log.Println("Error membaca port:", err)
			break
		}

		if n > 0 {
			char := string(buf[:n])
			
			if strings.Contains(char, "\r") || strings.Contains(char, "\n") {
				finalBarcode := strings.TrimSpace(barcodeBuilder.String() + char)
				
				if finalBarcode != "" {
					fmt.Println("Barcode terdeteksi:", finalBarcode)
					
					runtime.EventsEmit(a.ctx, "on-barcode-scanned", finalBarcode)
					

					barcodeBuilder.Reset()
				}
			} else {
				barcodeBuilder.WriteString(char)
			}
		}
	}
}