import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // บอกให้ Vite รู้ว่าโฟลเดอร์โค้ดหลัก (src/main.jsx, index.html) อยู่ในโฟลเดอร์ app
  root: 'app',
  
  plugins: [react()],
  server: { 
    port: 5173 
  },
  build: { 
    // กำหนดให้เซฟไฟล์หลังจาก build ออกไปไว้ที่โฟลเดอร์ dist นอกสุด (ระดับเดียวกับ package.json)
    outDir: '../dist', 
    sourcemap: false,
    emptyOutDir: true // ให้เคลียร์ไฟล์เก่าใน dist ทุกครั้งก่อน build ใหม่
  }
})