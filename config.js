/* PiAi – cấu hình "Chế độ máy chủ" (multi-user).
   Để trống = chế độ cũ: mỗi người tự nhập API key trong trình duyệt.
   Điền đủ 3 dòng (xem SETUP.md trong repo piai-backend) = đăng nhập + trừ xu trên máy chủ.
   SUPABASE_ANON_KEY là khoá công khai (anon/publishable) – KHÔNG dán service_role/secret key vào đây. */
window.PIAI_CONFIG = {
  /* Máy chủ ĐƠN GIẢN (không cần Supabase): Worker giữ key chung của chủ dự án.
     Điền URL Worker vào đây sau khi deploy (xem piai-backend/worker/HUONG_DAN_WORKER.md). Để trống = gói Cao cấp hiện "sắp có". */
  WORKER_URL: "",        // vd: https://piai-free.<tên-bạn>.workers.dev
  FREE_PER_DAY: 12,      // số lượt ảnh miễn phí mỗi người mỗi ngày (đếm trên máy khách)
  SERVER_URL: "",        // vd: https://piai-api.<tên-bạn>.workers.dev
  SUPABASE_URL: "",      // vd: https://abcd1234.supabase.co
  SUPABASE_ANON_KEY: ""  // Supabase → Project Settings → API → anon / publishable key
};
