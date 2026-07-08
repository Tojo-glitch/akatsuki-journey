# TradeLog — Premium Portfolio & Performance Diagnostics

TradeLog is an enterprise-grade, high-performance trading journal and statistical expectation dashboard built using **Vite, React, PostgreSQL (Supabase)**, and **Deno Edge Functions with Google Gemini 1.5 Flash**. 

It is designed strictly for professional portfolio managers and prop-firm traders who require absolute data-first visual clarity, minimal cognitive load, and zero visual clutter.

---

## 🛠️ Architecture and Stack

- **Frontend Core**: React 18, Vite, Recharts, Tabular Monospace font integration.
- **Backend & Database**: Supabase (PostgreSQL with `pgcrypto` cryptographic extensions).
- **Edge Run-time**: Deno Edge Functions securely calling Gemini Multimodal Vision API.
- **Hosting Boundary**: Cloudflare Pages (enforcing non-spoofable client IP lookups).
- **Security Paradigm**: Bcrypt-salted PIN access, rate-limiting lockout, and session-token isolation.

---

## 🚀 One-Time Production Setup Instructions

### Step 1: Execute Database Schema Migrations
1. Open your **Supabase Dashboard** ➡️ **SQL Editor**.
2. Click **New Query**, copy the entire contents of `db/schema.sql` and `db/reviewer_setup_v2.sql` (if applying updates) into the text pane.
3. Click **Run**. Verify that all views, triggers, and RPC functions compile with success.

### Step 2: Configure Supabase Storage Bucket for Chart Uploads
1. Go to **Supabase Dashboard** ➡️ **Storage** (Bucket Icon).
2. Click **New Bucket**. Name it exactly: `trade-charts`.
3. Set the bucket privacy toggle to **Public** so generated charts are accessible on the ledger.

### Step 3: Configure Cloud Secrets for Google Gemini Vision
1. Go to Google AI Studio at [aistudio.google.com](https://aistudio.google.com/) and register for a free multimodal API Key.
2. In your **Supabase Dashboard**, navigate to **Project Settings** ➡️ **Edge Functions** ➡️ **Secrets** (or click Manage Secrets).
3. Add a new secret:
   - **Name**: `GEMINI_API_KEY`
   - **Value**: *[Your Google AI Studio API Key]*

### Step 4: Deploy the Multimodal OCR Edge Function
1. In your project workspace, ensure you save the secure, type-safe TypeScript code inside `supabase/functions/analyze-chart/index.ts`.
2. Deploy the Deno function directly via the browser in **Supabase Dashboard** ➡️ **Edge Functions** ➡️ **Via Editor** ➡️ click **Open Editor** (Name the folder exactly: `analyze-chart`), paste the TypeScript code, and click **Save & Deploy**.

---

## 💻 Local Workspace Development

1. Ensure your terminal directory points to the root `/app` folder:
   ```bash
   cd app


   UI design 
  📁 1. ไฟล์: src/index.css (พิมพ์เขียวดีไซน์ทั้งหมด - แนะนำจุดนี้อันดับแรก 🌟)
เป็นศูนย์กลางควบคุมแผงทัศนศิลป์ (The Design System) หากต้องการเปลี่ยนบรรยากาศแอป ให้มาปรับแต่งที่นี่จุดเดียวจบครับ:
เปลี่ยนชุดสีหลัก (Brand Colors):
แก้ไขที่ :root และ [data-theme="light"] ช่วงบรรทัดแรก ๆ
เช่น หากต้องการเปลี่ยนแบรนด์จากสีเขียวมิ้นต์เป็นสีฟ้าพรีเมียมเกรดกองทุน ให้เปลี่ยนค่าพารามิเตอร์ของ --green และสี Glassmorphism ย่อยของกรีนออกเป็นสีฟ้า
เปลี่ยนแบบอักษร (Typography):
ปรับแต่งที่คำว่า --font-sans และ --font-mono เพื่อดึงฟอนต์หรูหราที่คุณชอบมาครอบระบบ
ปรับแต่งเงาและการ์ด:
แก้ไขสไตล์ของคลาส .card, .stat-card และแถบเลื่อนความคมชัด (Scrollbar) ได้ทันที
📁 2. ไฟล์: src/components/UI.jsx (รูปโฉมป๊อปอัพและปุ่มแจ้งเตือน)
ควบคุมรูปทรงของชิ้นส่วนประกอบหน้าจอ (UI Components) ทั้งหมด:
ปรับระดับมุมมนของปุ่ม / Badge:
ตกแต่งที่ฟังก์ชัน Badge ปรับขนาดความโปร่งแสง หรือความโค้งมนของขอบ Badge
ความโปร่งแสงของป๊อปอัพยืนยัน (PIN Modal / Confirm Dialog):
ตกแต่งความกว้าง รอยเว้นขอบ (Padding) หรือลักษณะเงาฟุ้ง (Box Shadow) ของกล่องสีดำตัวกลางจอ
📁 3. ไฟล์: src/pages/Dashboard.jsx (มิติการจัดหน้าตาและแผนภูมิกราฟ)
ควบคุมทัศนวิสัยของตัวเปรียบเทียบสถิติและดีไซน์แผนภูมิ Recharts:
สีกราฟและเฉดสีไหลพริ้ว (Chart Gradients & Colors):
ตกแต่งลักษณะขอบเส้นและเฉดความโปร่งแสงของแผนภูมิ AreaChart และ BarChart เช่น ปรับความหนาเส้นหลัก (strokeWidth) หรือเปลี่ยนความสูงความกว้างของตัวแผนภูมิ
สเปซการวางคอลัมน์:
ตกแต่งระบบการหดของกริดย่อยและการแบ่งคอลัมน์ซ้ายขวาของตัวแดชบอร์ด
📁 4. ไฟล์: src/components/history/TradeTable.jsx (หน้ากากตารางรายการและการ์ดมือถือ)
ควบคุมมิติความหนาแน่น (Density) ของ Ledger และดีไซน์การ์ดบนสมาร์ตโฟน:
ขนาดตัวหนังสือรายแถว:
ปรับแต่งสเปซความกว้างคอลัมน์ และความห่างรอยเย็บตาราง (padding ของเซลล์ <td>)
ความสวยงามของการ์ดบนมือถือ:
ปรับปรุงเฉดขอบสี ระยะจัดสเปซสถิติด้านในของการ์ดขนาดพกพา (Compact Cards) ตอนเปิดในเบราว์เซอร์สมาร์ตโฟน
📁 5. ไฟล์: src/components/history/CommentSection.jsx (สีหมุดและความนิ่งของหน้าสนทนา)
ควบคุมทัศนศิลป์ของกล่องวิจารณ์และการปักหมุดความเห็น:
สีกระบอกหมุดตัวเลข:
ตกแต่งขนาดความสว่าง ขนาดของหมุดปักตัวเลข และเงาเรืองแสงรอบหมุดบนภาพชาร์ตเทรดเดอร์ (boxShadow ของหมุด)
กล่องคีย์ข้อความอาจารย์:
ปรับแต่งขนาดความโค้งมนของช่องพิมพ์วิจารณ์ (textarea) และขนาดตัวหนังสือพิมพ์ตอบกลับ