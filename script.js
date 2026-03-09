const SHEET_ID    = '1hTPuwTZkRnPVoo5GUUC1fhuxbscwJrLdWVG-eHPWaIM';
const STORAGE_KEY = 'nongdam_kenshistyle_owned';

let productData        = [];
let currentDisplayData = [];
let ownedItems = new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'));
let activeFilters      = { country: 'all', character: '농담곰', group: 'all' };

const listContainer    = document.getElementById('listContainer');
const previewContainer = document.getElementById('previewContainer');
const filterNav        = document.getElementById('filterNav');
const filterActions    = document.getElementById('filterActions');
const sheetBody        = document.getElementById('sheetBody');
const optTitleCheck    = document.getElementById('optTitleCheck');
const optTitleInput    = document.getElementById('optTitleInput');
const optNameKoCheck   = document.getElementById('optNameKoCheck');
const optNameJpCheck   = document.getElementById('optNameJpCheck');
const optPriceCheck    = document.getElementById('optPriceCheck');

/* ── 초기화 ── */
async function init() {
    setupPreviewListeners();
    await fetchData();
    if (productData.length > 0) {
        renderFilters();
        applyFilters();
        updateProgress();
    }
}

/* ── 데이터 ── */
async function fetchData() {
    try {
        const res = await fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`);
        if (!res.ok) throw new Error('fetch failed');
        productData = parseCSV(await res.text());
    } catch (e) {
        console.error(e);
        listContainer.innerHTML = '<div class="status-msg"><p>데이터를 불러오지 못했습니다.</p></div>';
    }
}

function parseCSV(text) {
    const rows = text.split('\n').map(row => {
        const re = /(?:^|,)(\"(?:[^\"]+|\"\")*\"|[^,]*)/g;
        const cols = []; let m;
        while ((m = re.exec(row))) cols.push(m[1].replace(/^"|"$/g,'').replace(/""/g,'"').trim());
        return cols;
    });
    const headers = rows[0];
    return rows.slice(1)
        .filter(r => r.length >= headers.length)
        .map(r => { const o = {}; headers.forEach((h,i) => { o[h]=r[i]; }); return o; })
        .filter(o => o.id);
}

/* ── 필터 HTML 빌더 ── */
function flagHTML(v, label) {
    const a = activeFilters.country === v ? ' active' : '';
    return `<div class="flag-btn${a}" data-ft="country" data-fv="${v}"
        style="background-image:url('img/icon/flag/flag_${v}.png')"
        onclick="setFilter('country','${v}')"><div class="tip">${label}</div></div>`;
}
function charHTML(v, img, label) {
    const a = activeFilters.character === v ? ' active' : '';
    return `<div class="char-btn${a}" data-ft="character" data-fv="${v}"
        style="background-image:url('${img}')"
        onclick="setFilter('character','${v}')"><div class="tip">${label}</div></div>`;
}
function tagHTML(v) {
    const a = activeFilters.group === v ? ' active' : '';
    return `<button class="tag-btn${a}" data-ft="group" data-fv="${v}"
        onclick="setFilter('group','${v}')">${v}</button>`;
}

/* 필터 버튼 묶음 (중앙) */
function buildNavHTML() {
    return `
        ${flagHTML('kr','한국')}${flagHTML('jp','일본')}${flagHTML('cn','중국')}${flagHTML('tw','대만')}
        <div class="filter-sep"></div>
        ${charHTML('농담곰','img/icon/characters/icon_kuma.png','농담곰')}
        ${charHTML('고로케','img/icon/characters/icon_mogukoro.png','두더지<br>고로케')}
        ${charHTML('퍼그','img/icon/characters/icon_pug.png','퍼그 상')}
        ${charHTML('기타','img/icon/characters/icon_other.png','기타')}
        <div class="filter-sep"></div>
        ${tagHTML('마스코트')}${tagHTML('쿠션')}${tagHTML('인형')}${tagHTML('잡화')}
    `;
}

/* 우측 액션 버튼 (↺ 🗑 📷) */
function buildActionsHTML() {
    return `
        <!-- 필터 초기화 -->
        <button class="icon-action-btn reset" onclick="resetFilters()" title="필터 초기화">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                <path d="M3 3v5h5"/>
            </svg>
        </button>
        <!-- 기록 초기화 (휴지통) -->
        <button class="icon-action-btn danger" onclick="resetRecords()" title="기록 초기화">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6M14 11v6"/>
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
        </button>
        <!-- 이미지 저장 (카메라) -->
        <button class="icon-action-btn camera" onclick="generateImage()" title="이미지 저장">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
            </svg>
        </button>
    `;
}

/* 모바일 바텀시트 */
function buildSheetHTML() {
    return `
        <div class="sheet-row">
            <div class="sheet-row-label">국가</div>
            <div class="sheet-row-items">
                ${flagHTML('kr','한국')}${flagHTML('jp','일본')}${flagHTML('cn','중국')}${flagHTML('tw','대만')}
            </div>
        </div>
        <div class="sheet-row">
            <div class="sheet-row-label">캐릭터</div>
            <div class="sheet-row-items">
                ${charHTML('농담곰','img/icon/characters/icon_kuma.png','농담곰')}
                ${charHTML('고로케','img/icon/characters/icon_mogukoro.png','두더지<br>고로케')}
                ${charHTML('퍼그','img/icon/characters/icon_pug.png','퍼그 상')}
                ${charHTML('기타','img/icon/characters/icon_other.png','기타')}
            </div>
        </div>
        <div class="sheet-row">
            <div class="sheet-row-label">종류</div>
            <div class="sheet-row-items">
                ${tagHTML('마스코트')}${tagHTML('쿠션')}${tagHTML('인형')}${tagHTML('잡화')}
            </div>
        </div>
        <div class="sheet-actions">
            <button class="sheet-action-btn primary" onclick="generateImage(); closeSheet()">이미지 저장</button>
            <button class="sheet-action-btn" onclick="resetFilters(); closeSheet()">필터 초기화</button>
        </div>
        <div class="sheet-actions" style="padding-top:0;border-top:none;">
            <button class="sheet-action-btn danger" style="flex:1;" onclick="resetRecords(); closeSheet()">기록 초기화</button>
        </div>
    `;
}

function renderFilters() {
    filterNav.innerHTML     = buildNavHTML();
    filterActions.innerHTML = buildActionsHTML();
    sheetBody.innerHTML     = buildSheetHTML();
}

/* ── 필터 동작 ── */
window.setFilter = function(type, value) {
    activeFilters[type] = activeFilters[type] === value ? 'all' : value;
    document.querySelectorAll(`[data-ft="${type}"]`).forEach(el => {
        el.classList.toggle('active', el.dataset.fv === activeFilters[type]);
    });
    applyFilters();
};

window.resetFilters = function() {
    activeFilters = { country: 'all', character: 'all', group: 'all' };
    document.querySelectorAll('[data-ft]').forEach(el => el.classList.remove('active'));
    applyFilters();
    scrollToTop();
};

function applyFilters() {
    currentDisplayData = productData.filter(item => {
        if (activeFilters.country   !== 'all' && item.country   !== activeFilters.country)   return false;
        if (activeFilters.character !== 'all' && item.character !== activeFilters.character) return false;
        if (activeFilters.group     !== 'all' && item.group     !== activeFilters.group)     return false;
        return true;
    });
    renderList(currentDisplayData);
}

/* ── 리스트 렌더링 ── */
function renderList(items) {
    listContainer.innerHTML = '';
    if (!items.length) {
        listContainer.innerHTML = '<div class="status-msg"><p>해당하는 상품이 없습니다.</p></div>';
        return;
    }
    const grouped = new Map();
    items.forEach(item => {
        if (!grouped.has(item.group)) grouped.set(item.group, []);
        grouped.get(item.group).push(item);
    });
    for (const [title, groupItems] of grouped) {
        const owned = groupItems.filter(i => ownedItems.has(i.id)).length;
        const section = document.createElement('div');
        section.className = 'category-section';
        const header = document.createElement('div');
        header.className = 'category-header';
        header.innerHTML = `<span class="category-name">${title}</span><span class="category-stat"><span class="owned">${owned}</span> / ${groupItems.length}</span>`;
        const grid = document.createElement('div');
        grid.className = 'items-grid';
        groupItems.forEach(item => {
            const checked = ownedItems.has(item.id);
            const card = document.createElement('div');
            card.className = `item-card${checked ? ' checked' : ''}`;
            card.onclick = () => toggleCheck(item.id);
            card.innerHTML = `
                <div class="card-img">
                    <img src="${item.image || ''}" loading="lazy" alt="${item.nameKo}">
                    <div class="card-check-overlay"><div class="check-mark">✓</div></div>
                </div>
                <div class="card-info">
                    <div class="card-name">${item.nameKo}</div>
                    <div class="card-price">${item.price || '-'}</div>
                </div>`;
            grid.appendChild(card);
        });
        section.appendChild(header);
        section.appendChild(grid);
        listContainer.appendChild(section);
    }
}

/* ── 체크 토글 ── */
function toggleCheck(id) {
    if (ownedItems.has(id)) ownedItems.delete(id);
    else ownedItems.add(id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ownedItems]));
    renderList(currentDisplayData);
    updateProgress();
}

/* ── 수집률 ── */
function updateProgress() {
    if (!productData.length) return;
    const owned = productData.filter(i => ownedItems.has(i.id)).length;
    const total = productData.length;
    const pct   = Math.round((owned / total) * 100);
    // PC 플로팅 바
    document.getElementById('progressPct').textContent  = `${pct}%`;
    document.getElementById('progressFrac').textContent = `${owned} / ${total}`;
    document.getElementById('progressBar').style.width  = `${pct}%`;
    // 모바일 헤더
    document.getElementById('mProgressPct').textContent  = `${pct}%`;
    document.getElementById('mProgressFrac').textContent = `${owned} / ${total}`;
}

/* ── 바텀시트 ── */
window.openSheet = function() {
    document.getElementById('sheetOverlay').classList.add('open');
    document.getElementById('bottomSheet').classList.add('open');
    document.body.style.overflow = 'hidden';
};
window.closeSheet = function() {
    document.getElementById('sheetOverlay').classList.remove('open');
    document.getElementById('bottomSheet').classList.remove('open');
    document.body.style.overflow = '';
};

/* ── 네비게이션 ── */
function goHome() {
    closeSheet();
    closePreview();
    applyFilters();
    scrollToTop();
}
function scrollToTop() { window.scrollTo(0, 0); }

/* ── 기록 초기화 ── */
window.resetRecords = function() {
    if (!confirm('모든 체크 기록을 삭제하시겠습니까?')) return;
    ownedItems.clear();
    localStorage.removeItem(STORAGE_KEY);
    renderList(currentDisplayData);
    updateProgress();
    alert('초기화되었습니다.');
};

/* ── 미리보기 이벤트 ── */
function setupPreviewListeners() {
    optTitleInput.addEventListener('input', () => {
        if (optTitleInput.value.trim()) optTitleCheck.checked = true;
        updateCollectionPreview();
    });
    optTitleCheck.addEventListener('change', updateCollectionPreview);
    optPriceCheck.addEventListener('change',  updateCollectionPreview);
    optNameKoCheck.addEventListener('change', () => {
        if (optNameKoCheck.checked) optNameJpCheck.checked = false;
        updateCollectionPreview();
    });
    optNameJpCheck.addEventListener('change', () => {
        if (optNameJpCheck.checked) optNameKoCheck.checked = false;
        updateCollectionPreview();
    });
}

/* ── 이미지 생성 ── */
window.generateImage = async function() {
    await document.fonts.ready;
    const checked = productData.filter(i => ownedItems.has(i.id));
    if (!checked.length) { alert('선택된 상품이 없습니다.'); return; }
    await updateCollectionPreview();
    listContainer.style.display    = 'none';
    previewContainer.style.display = 'block';
    scrollToTop();
};

async function updateCollectionPreview() {
    const checked = productData.filter(i => ownedItems.has(i.id));
    if (!checked.length) return;
    document.getElementById('imgCollection').src = await drawCanvas(checked);
}

function closePreview() {
    listContainer.style.display    = 'block';
    previewContainer.style.display = 'none';
    document.getElementById('imgCollection').src = '';
}

/* ── Canvas ── */
async function drawCanvas(items) {
    const cvs = document.createElement('canvas');
    const ctx  = cvs.getContext('2d');

    const showTitle  = optTitleCheck.checked;
    const titleText  = optTitleInput.value || '';
    const showNameKo = optNameKoCheck.checked;
    const showNameJp = optNameJpCheck.checked;
    const showPrice  = optPriceCheck.checked;
    const showText   = showNameKo || showNameJp;

    const COL=5, CARD_W=190, IMG_H=190, GAP=14, PAD=40;
    const TITLE_H = showTitle ? 76 : 0;
    const NAME_LH=19, PRICE_H=18;

    let textH = 0;
    if (showText)  textH += NAME_LH * 2;
    if (showPrice) textH += PRICE_H;
    if (showText || showPrice) textH += 20;

    const CARD_H = IMG_H + textH;
    const ROW    = Math.ceil(items.length / COL);

    cvs.width  = PAD*2 + CARD_W*COL + GAP*(COL-1);
    cvs.height = PAD*2 + CARD_H*ROW + GAP*(ROW-1) + TITLE_H;

    ctx.fillStyle = '#fafafa';
    ctx.fillRect(0, 0, cvs.width, cvs.height);

    let startY = PAD;
    if (showTitle) {
        ctx.font='bold 36px \'Paperlogy\', sans-serif';
        ctx.fillStyle='#182558'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(titleText, cvs.width/2, PAD+20);
        ctx.fillStyle='#e4e4e8';
        ctx.fillRect(PAD, PAD+48, cvs.width-PAD*2, 1);
        startY += TITLE_H;
    }

    const loadImg = src => new Promise(res => {
        const i=new Image(); i.crossOrigin='Anonymous';
        i.src=src; i.onload=()=>res(i); i.onerror=()=>res(null);
    });
    const getLines = (txt, maxW) => {
        if (!txt) return [];
        const chars=txt.split(''); const lines=[]; let line=chars[0]||'';
        for (let i=1;i<chars.length;i++) {
            if (ctx.measureText(line+chars[i]).width<maxW) line+=chars[i];
            else { lines.push(line); line=chars[i]; }
        }
        lines.push(line); return lines;
    };

    for (let i=0;i<items.length;i++) {
        const item=items[i];
        const col=i%COL, row=Math.floor(i/COL);
        const x=PAD+col*(CARD_W+GAP), y=startY+row*(CARD_H+GAP);
        const R=12;

        ctx.save();
        ctx.shadowColor='rgba(0,0,0,0.08)'; ctx.shadowBlur=12; ctx.shadowOffsetY=3;
        ctx.fillStyle='#ffffff';
        ctx.beginPath(); ctx.roundRect(x,y,CARD_W,CARD_H,R); ctx.fill();
        ctx.restore();

        const img=await loadImg(item.image);
        if (img) {
            ctx.save(); ctx.beginPath();
            if (showText||showPrice) ctx.roundRect(x,y,CARD_W,IMG_H,[R,R,0,0]);
            else ctx.roundRect(x,y,CARD_W,IMG_H,R);
            ctx.clip();
            const asp=img.width/img.height; let dw=CARD_W,dh=IMG_H;
            if(asp>1) dw=IMG_H*asp; else dh=CARD_W/asp;
            ctx.drawImage(img,x+(CARD_W-dw)/2,y+(IMG_H-dh)/2,dw,dh);
            ctx.restore();
        }

        if (showText||showPrice) {
            ctx.textAlign='center'; ctx.textBaseline='middle';
            let lines=[];
            if (showText) {
                ctx.font='bold 14px \'Pretendard\', sans-serif';
                const name=(showNameJp&&item.nameJp?.trim())?item.nameJp:item.nameKo;
                lines=getLines(name,CARD_W-16);
                if(lines.length>2){lines=lines.slice(0,2);lines[1]=lines[1].slice(0,-1)+'…';}
            }
            const contentH=lines.length*NAME_LH+(showPrice?PRICE_H+(showText?4:0):0);
            const midY=y+IMG_H+textH/2;
            let drawY=midY-contentH/2+NAME_LH/2;
            if (showText) {
                ctx.font='bold 14px \'Pretendard\', sans-serif'; ctx.fillStyle='#1a1a2e';
                lines.forEach(l=>{ctx.fillText(l,x+CARD_W/2,drawY);drawY+=NAME_LH;});
            }
            if (showPrice) {
                if(showText) drawY+=4;
                ctx.font='13px \'Pretendard\', sans-serif'; ctx.fillStyle='#182558';
                ctx.fillText(item.price||'-',x+CARD_W/2,drawY);
            }
        }
    }
    return cvs.toDataURL('image/jpeg',0.92);
}

function downloadImage() {
    const img=document.getElementById('imgCollection');
    if(!img?.src) return;
    const a=document.createElement('a');
    a.download='nongdam_collection.jpg'; a.href=img.src; a.click();
}

init();
