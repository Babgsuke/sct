### ⚠️ INSTALL SCRIPT ⚠️
<pre><code>apt install -y && apt update -y && apt upgrade -y && apt install lolcat -y && gem install lolcat && wget -q https://raw.githubusercontent.com/Babgsuke/sct/main/main.sh && chmod +x main.sh && ./main.sh</code></pre>

### ⚠️ UPDATE SCRIPT ⚠️
<pre><code>wget -q https://raw.githubusercontent.com/Babgsuke/sct/main/update.sh && chmod +x update.sh && ./update.sh</code></pre>

### 🔑 GitHub Token (Cegah 429 Rate Limit)
Jika install gagal karena *GitHub 429 Too Many Requests*, export token dulu:

<pre><code>export GH_TOKEN="ghp_xxxxxxxxxxxx"</code></pre>

Atau inline:
<pre><code>GH_TOKEN="ghp_xxxxxxxxxxxx" bash main.sh</code></pre>

Token bisa dibuat di **GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens** (akses public repo doang).

Semua script (`main.sh`, `update.sh`, `fixlimit.sh`, menu, vpn, dll) otomatis pake token kalau `GH_TOKEN` terisi.
