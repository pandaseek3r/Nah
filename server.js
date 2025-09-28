const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const LOCKER_PASS = process.env.LOCKER_PASS || "0305"; // 기본 비번
const TTL_HOURS = parseInt(process.env.TTL_HOURS || "3", 10);

// 메모리에 데이터 저장
let reports = [];

// 미들웨어
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// 버튼 누른 사용자 정보 저장
app.post("/report", (req, res) => {
  const info = {
    userAgent: req.headers["user-agent"],
    ip: req.ip,
    time: new Date()
  };

  reports.push(info);

  // TTL 지나면 삭제
  setTimeout(() => {
    reports = reports.filter(r => r !== info);
  }, TTL_HOURS * 60 * 60 * 1000);

  res.json({ ok: true });
});

// 보관함 (비번 필요)
app.post("/locker", (req, res) => {
  const { password } = req.body || {};
  if (password !== LOCKER_PASS) {
    return res.status(401).json({ ok: false, error: "wrong_password" });
  }
  res.json({ ok: true, reports });
});

// 서버 실행
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
