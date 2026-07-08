import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  
  // กำหนดให้ Vite มองหาโฟลเดอร์สาธารณะลึกลงไปที่ app/public เพื่อเสิร์ฟ PWA ออกมารูทหลัก
  publicDir: 'app/public',
  
  server: { 
    port: 5173 
  },
  build: { 
    outDir: 'dist', 
    sourcemap: true,
    emptyOutDir: true 
  }
})