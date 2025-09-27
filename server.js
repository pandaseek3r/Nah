require('dotenv').config();
const express=require('express');
const bodyParser=require('body-parser');
const bcrypt=require('bcrypt');
const Database=require('better-sqlite3');
const path=require('path');
const app=express();
const db=new Database('data.db');

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

db.prepare(`CREATE TABLE IF NOT EXISTS entries (
  id TEXT PRIMARY KEY,
  userAgent TEXT,
  screenWidth INTEGER,
  screenHeight INTEGER,
  timestamp TEXT
)`).run();

const VAULT_HASH=process.env.VAULT_HASH||'';

app.post('/api/store',(req,res)=>{
  try{
    const {id,userAgent,screenWidth,screenHeight,timestamp}=req.body;
    if(!id||!userAgent||!timestamp)return res.status(400).send('invalid');
    db.prepare('INSERT OR REPLACE INTO entries (id,userAgent,screenWidth,screenHeight,timestamp) VALUES (?,?,?,?,?)')
      .run(id,userAgent,screenWidth||0,screenHeight||0,timestamp);
    res.status(200).send('ok');
  }catch(e){console.error(e);res.status(500).send('server error');}
});

app.post('/api/vault',async (req,res)=>{
  const {password}=req.body;
  if(!password) return res.status(400).send('no password');
  if(!VAULT_HASH) return res.status(500).send('vault not configured');
  const ok=await bcrypt.compare(password,VAULT_HASH);
  if(!ok) return res.status(403).send('wrong password');
  const rows=db.prepare('SELECT id,userAgent,screenWidth,screenHeight,timestamp FROM entries ORDER BY timestamp DESC').all();
  res.json(rows);
});

const PORT=process.env.PORT||3000;
app.listen(PORT,()=>console.log('listening',PORT));