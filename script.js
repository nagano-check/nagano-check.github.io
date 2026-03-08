/* ============================================================
   농담곰 콜렉션 — script.js
   ============================================================ */

const SHEET_ID    = '1hTPuwTZkRnPVoo5GUUC1fhuxbscwJrLdWVG-eHPWaIM';
const STORAGE_KEY = 'nongdam_kenshistyle_owned';

let productData        = [];
let currentDisplayData = [];
let ownedItems = new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'));

// 기본 필터: 농담곰 캐릭터 선택 상태로 시작
let activeFilters = { country: 'all', character: '농담곰', group: 'all' };

// DOM 참조
const listContainer    = document.getElementById('listContainer');
const previewContainer = document.getElementById('previewContainer');
const navMenuContainer = document.getElementById('navMenuContainer');
const sidebarContent   = document.getElementById('sidebarContent');

// 미리보기 옵션 입력 요소
const optTitleCheck  = document.getElementById('optTitleCheck');
const optTitleInput  = document.getElementById('optTitleInput');
const optNameKoCheck = document.getElementById('optNameKoCheck');
const optNameJpCheck = document.getElementById('optNameJpCheck');
const optPriceCheck  = document.getElementById('optPriceCheck');

/* ============================================================
   초기화
   ============================================================ */
async function init() {
    setupEventListeners();
    await fetchData();
    if (productData.length > 0) {
        renderFilters();   // nav + sidebar에 필터 렌더링
        applyMultiFilters();
        updateProgress();
    }
}

/* ============================================================
   미리보기 옵션 이벤트
   ============================================================ */
function setupEventListeners() {
    optTitleInput.addEventListener('input', () => {
        if (optTitleInput.value.trim()) optTitleCheck.checked = true;
        updateCollectionPreview();
    });
    optTitleCheck.addEventListener('change', updateCollectionPreview);
    optPriceCheck.addEventListener('change',  updateCollectionPreview);

    // 한글/일본어 체크박스는 하나만 선택 가능
    optNameKoCheck.addEventListener('change', () => {
        if (optNameKoCheck.checked) optNameJpCheck.checked = false;
        updateCollectionPreview();
    });
    optNameJpCheck.addEventListener('change', () => {
        if (optNameJpCheck.checked) optNameKoCheck.checked = false;
        updateCollectionPreview();
    });
}

/* ============================================================
   데이터 fetching
   ============================================================ */
async function fetchData() {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('Network error');
        productData = parseCSV(await res.text());
    } catch (err) {
        console.error(err);
        listContainer.innerHTML = '<div class="status-msg">데이터를 불러오지 못했습니다.</div>';
    }
}

/* ============================================================
   CSV 파싱
   ============================================================ */
function parseCSV(csvText) {
    const rows = csvText.split('\n').map(row => {
        const regex = /(?:^|,)(\"(?:[^\"]+|\"\")*\"|[^,]*)/g;
        const cols = [];
        let match;
        while ((match = regex.exec(row))) {
            cols.push(match[1].replace(/^"|"$/g, '').replace(/""/g, '"').trim());
        }
        return cols;
    });

    const headers = rows[0];
    return rows.slice(1)
        .filter(row => row.length >= headers.length)
        .map(row => {
            const item = {};
            headers.forEach((h, i) => { item[h] = row[i]; });
            return item;
        })
        .filter(item => item.id);
}

/* ============================================================
   필터 렌더링
   - nav와 sidebar에 같은 필터 HTML을 렌더링하고,
     data 속성 기반으로 active 상태를 동기화합니다.
   ============================================================ */
function renderFilters() {
    const html = buildFilterHTML();
    navMenuContainer.innerHTML = html;
    sidebarContent.innerHTML   = html;
    syncFilterUI();
}

function buildFilterHTML() {
    return `
        <div class="filter-bar">
            <div class="filter-group">
                <button class="icon-btn" onclick="resetFilters()" title="필터 초기화">
                    <img src="img/icon/reset.png" alt="초기화">
                </button>
                <div class="flag-btn" data-filter-type="country" data-filter-value="kr"
                     style="background-image:url('img/icon/flag/flag_kr.png')"
                     onclick="setFilter('country','kr')"><div class="overlay">한국</div></div>
                <div class="flag-btn" data-filter-type="country" data-filter-value="jp"
                     style="background-image:url('img/icon/flag/flag_jp.png')"
                     onclick="setFilter('country','jp')"><div class="overlay">일본</div></div>
                <div class="flag-btn" data-filter-type="country" data-filter-value="cn"
                     style="background-image:url('img/icon/flag/flag_cn.png')"
                     onclick="setFilter('country','cn')"><div class="overlay">중국</div></div>
                <div class="flag-btn" data-filter-type="country" data-filter-value="tw"
                     style="background-image:url('img/icon/flag/flag_tw.png')"
                     onclick="setFilter('country','tw')"><div class="overlay">대만</div></div>
            </div>

            <div class="filter-group">
                <div class="char-btn" data-filter-type="character" data-filter-value="농담곰"
                     style="background-image:url('img/icon/characters/icon_kuma.png')"
                     onclick="setFilter('character','농담곰')"><div class="overlay">농담곰</div></div>
                <div class="char-btn" data-filter-type="character" data-filter-value="고로케"
                     style="background-image:url('img/icon/characters/icon_mogukoro.png')"
                     onclick="setFilter('character','고로케')"><div class="overlay">두더지<br>고로케</div></div>
                <div class="char-btn" data-filter-type="character" data-filter-value="퍼그"
                     style="background-image:url('img/icon/characters/icon_pug.png')"
                     onclick="setFilter('character','퍼그')"><div class="overlay">퍼그 상</div></div>
                <div class="char-btn" data-filter-type="character" data-filter-value="기타"
                     style="background-image:url('img/icon/characters/icon_other.png')"
                     onclick="setFilter('character','기타')"><div class="overlay">기타</div></div>
            </div>

            <div class="filter-group">
                <button class="pill-btn" data-filter-type="group" data-filter-value="마스코트"
                        onclick="setFilter('group','마스코트')">마스코트</button>
                <button class="pill-btn" data-filter-type="group" data-filter-value="쿠션"
                        onclick="setFilter('group','쿠션')">쿠션</button>
                <button class="pill-btn" data-filter-type="group" data-filter-value="인형"
                        onclick="setFilter('group','인형')">인형</button>
                <button class="pill-btn" data-filter-type="group" data-filter-value="잡화"
                        onclick="setFilter('group','잡화')">잡화</button>
            </div>

            <div class="filter-group filter-actions">
                <button class="filter-action-btn primary" onclick="generateImage(); closeSidebar()">이미지 저장</button>
                <button class="filter-action-btn ghost"   onclick="resetRecords(); closeSidebar()">기록 초기화</button>
            </div>
        </div>
    `;
}

/**
 * data-filter-type / data-filter-value 속성을 기준으로
 * 모든 필터 버튼의 active 상태를 동기화합니다.
 * nav와 sidebar 양쪽 모두 자동으로 처리됩니다.
 */
function syncFilterUI() {
    document.querySelectorAll('[data-filter-type]').forEach(el => {
        const type  = el.dataset.filterType;
        const value = el.dataset.filterValue;
        el.classList.toggle('active', activeFilters[type] === value);
    });
}

/* ============================================================
   필터 동작
   ============================================================ */
window.setFilter = function(type, value) {
    // 이미 선택된 필터를 다시 누르면 해제
    activeFilters[type] = activeFilters[type] === value ? 'all' : value;
    syncFilterUI();
    applyMultiFilters();
};

window.resetFilters = function() {
    activeFilters = { country: 'all', character: 'all', group: 'all' };
    syncFilterUI();
    applyMultiFilters();
    scrollToTop();
};

function applyMultiFilters() {
    currentDisplayData = productData.filter(item => {
        if (activeFilters.country   !== 'all' && item.country   !== activeFilters.country)   return false;
        if (activeFilters.character !== 'all' && item.character !== activeFilters.character) return false;
        if (activeFilters.group     !== 'all' && item.group     !== activeFilters.group)     return false;
        return true;
    });
    renderList(currentDisplayData);
}

/* ============================================================
   리스트 렌더링
   ============================================================ */
function renderList(items) {
    listContainer.innerHTML = '';

    if (!items.length) {
        listContainer.innerHTML = '<div class="status-msg">해당하는 상품이 없습니다.</div>';
        return;
    }

    // 그룹별로 묶기
    const grouped = new Map();
    items.forEach(item => {
        if (!grouped.has(item.group)) grouped.set(item.group, []);
        grouped.get(item.group).push(item);
    });

    for (const [title, groupItems] of grouped) {
        const ownedCount = groupItems.filter(i => ownedItems.has(i.id)).length;

        const section = document.createElement('div');
        section.className = 'category-section';

        const titleEl = document.createElement('div');
        titleEl.className = 'category-title';
        titleEl.innerHTML = `${title}<span class="category-count">${ownedCount}/${groupItems.length}</span>`;

        const grid = document.createElement('div');
        grid.className = 'items-grid';

        groupItems.forEach(item => {
            const isOwned = ownedItems.has(item.id);
            const card = document.createElement('div');
            card.className = `item-card${isOwned ? ' checked' : ''}`;
            card.onclick = () => toggleCheck(item.id);
            card.innerHTML = `
                <div class="card-img-wrapper">
                    <img src="${item.image || ''}" loading="lazy" alt="${item.nameKo}">
                    <div class="check-badge">✓</div>
                </div>
                <div class="card-info">
                    <div class="card-name">${item.nameKo}</div>
                    <div class="card-price">${item.price || '-'}</div>
                </div>
            `;
            grid.appendChild(card);
        });

        section.appendChild(titleEl);
        section.appendChild(grid);
        listContainer.appendChild(section);
    }
}

/* ============================================================
   체크 토글
   ============================================================ */
function toggleCheck(id) {
    if (ownedItems.has(id)) {
        ownedItems.delete(id);
    } else {
        ownedItems.add(id);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ownedItems]));
    renderList(currentDisplayData);
    updateProgress();
}

/* ============================================================
   수집률 업데이트
   ============================================================ */
function updateProgress() {
    if (!productData.length) return;
    const owned   = productData.filter(item => ownedItems.has(item.id)).length;
    const total   = productData.length;
    const percent = Math.round((owned / total) * 100);
    document.getElementById('progressBar').style.width = `${percent}%`;
    document.getElementById('progressText').textContent = `${owned}/${total} (${percent}%)`;
}

/* ============================================================
   사이드바 토글 (모바일)
   ============================================================ */
function toggleSidebar() {
    const sidebar   = document.getElementById('sidebar');
    const overlay   = document.getElementById('sidebarOverlay');
    const hamburger = document.getElementById('hamburger');
    const isOpen    = sidebar.classList.toggle('open');
    overlay.classList.toggle('open', isOpen);
    hamburger.classList.toggle('open', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
}

function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('open');
    document.getElementById('hamburger').classList.remove('open');
    document.body.style.overflow = '';
}

/* ============================================================
   미리보기 화면 열기 / 닫기
   ============================================================ */
function closePreview() {
    listContainer.style.display    = 'block';
    previewContainer.style.display = 'none';
    document.getElementById('imgCollection').src = '';
}

function goHome() {
    closeSidebar();
    closePreview();
    applyMultiFilters();
    scrollToTop();
}

function scrollToTop() {
    window.scrollTo(0, 0);
}

/* ============================================================
   기록 초기화
   ============================================================ */
window.resetRecords = function() {
    if (!confirm('모든 체크 기록을 삭제하시겠습니까?')) return;
    ownedItems.clear();
    localStorage.removeItem(STORAGE_KEY);
    renderList(currentDisplayData);
    updateProgress();
    alert('초기화되었습니다.');
};

/* ============================================================
   이미지 생성 (미리보기 화면으로 이동)
   ============================================================ */
window.generateImage = async function() {
    await document.fonts.ready;
    const checkedItems = productData.filter(item => ownedItems.has(item.id));
    if (!checkedItems.length) {
        alert('선택된 상품이 없습니다.');
        return;
    }
    updateCollectionPreview();
    listContainer.style.display    = 'none';
    previewContainer.style.display = 'flex';
    previewContainer.style.flexDirection = 'column';
    scrollToTop();
};

async function updateCollectionPreview() {
    const checkedItems = productData.filter(item => ownedItems.has(item.id));
    if (!checkedItems.length) return;
    document.getElementById('imgCollection').src = await drawCollectionCanvas(checkedItems);
}

/* ============================================================
   Canvas 이미지 생성
   ============================================================ */
async function drawCollectionCanvas(items) {
    const cvs = document.createElement('canvas');
    const ctx  = cvs.getContext('2d');

    const showTitle  = optTitleCheck.checked;
    const titleText  = optTitleInput.value;
    const showNameKo = optNameKoCheck.checked;
    const showNameJp = optNameJpCheck.checked;
    const showPrice  = optPriceCheck.checked;
    const showText   = showNameKo || showNameJp;

    const cardWidth      = 200;
    const imgHeight      = 200;
    const nameLineHeight = 20;
    const priceLineHeight= 20;
    const paddingY       = 10;

    let textHeight = 0;
    if (showText)  textHeight += nameLineHeight * 2;
    if (showPrice) textHeight += priceLineHeight;
    if (showText || showPrice) textHeight += paddingY * 2;

    const cardHeight     = imgHeight + textHeight;
    const gap            = 20;
    const colCount       = 5;
    const padding        = 40;
    const titleAreaHeight= showTitle ? 80 : 0;
    const rowCount       = Math.ceil(items.length / colCount);

    cvs.width  = padding * 2 + cardWidth * colCount + gap * (colCount - 1);
    cvs.height = padding * 2 + cardHeight * rowCount + gap * (rowCount - 1) + titleAreaHeight;

    // 배경
    ctx.fillStyle = '#fdf7f0';
    ctx.fillRect(0, 0, cvs.width, cvs.height);

    // 타이틀
    let startY = padding;
    if (showTitle) {
        ctx.font         = "bold 40px 'Paperlogy', sans-serif";
        ctx.fillStyle    = '#182558';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(titleText, cvs.width / 2, padding + 20);
        startY += titleAreaHeight;
    }

    // 이미지 로더
    const loadImage = src => new Promise(resolve => {
        const img       = new Image();
        img.crossOrigin = 'Anonymous';
        img.src         = src;
        img.onload      = () => resolve(img);
        img.onerror     = () => resolve(null);
    });

    // 텍스트 줄바꿈 계산 (한글 글자 단위)
    const getLines = (text, maxWidth) => {
        if (!text) return [];
        const chars = text.split('');
        const lines = [];
        let line    = chars[0];
        for (let i = 1; i < chars.length; i++) {
            if (ctx.measureText(line + chars[i]).width < maxWidth) {
                line += chars[i];
            } else {
                lines.push(line);
                line = chars[i];
            }
        }
        lines.push(line);
        return lines;
    };

    // 카드 그리기
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const col  = i % colCount;
        const row  = Math.floor(i / colCount);
        const x    = padding + col * (cardWidth + gap);
        const y    = startY  + row * (cardHeight + gap);
        const r    = 15;

        // 카드 배경 (그림자)
        ctx.save();
        ctx.shadowColor   = 'rgba(0,0,0,0.08)';
        ctx.shadowBlur    = 12;
        ctx.shadowOffsetY = 4;
        ctx.fillStyle     = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(x, y, cardWidth, cardHeight, r);
        ctx.fill();
        ctx.restore();

        // 이미지
        const img = await loadImage(item.image);
        if (img) {
            ctx.save();
            ctx.beginPath();
            if (showText || showPrice) {
                ctx.roundRect(x, y, cardWidth, imgHeight, [r, r, 0, 0]);
            } else {
                ctx.roundRect(x, y, cardWidth, imgHeight, r);
            }
            ctx.clip();
            const aspect = img.width / img.height;
            let dw = cardWidth, dh = imgHeight;
            if (aspect > 1) dw = imgHeight * aspect; else dh = cardWidth / aspect;
            ctx.drawImage(img, x + (cardWidth - dw) / 2, y + (imgHeight - dh) / 2, dw, dh);
            ctx.restore();
        }

        // 텍스트 영역
        if (showText || showPrice) {
            ctx.textAlign    = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle    = '#333';

            let lines = [];
            if (showText) {
                ctx.font    = "bold 15px 'Pretendard', sans-serif";
                const name  = (showNameJp && item.nameJp?.trim()) ? item.nameJp : item.nameKo;
                lines       = getLines(name, cardWidth - 20);
                if (lines.length > 2) {
                    lines    = lines.slice(0, 2);
                    lines[1] = lines[1].slice(0, -1) + '…';
                }
            }

            const contentH    = lines.length * nameLineHeight + (showPrice ? priceLineHeight + (showText ? 5 : 0) : 0);
            const textCenterY = y + imgHeight + textHeight / 2;
            let drawY         = textCenterY - contentH / 2 + nameLineHeight / 2;

            if (showText) {
                ctx.font      = "bold 15px 'Pretendard', sans-serif";
                ctx.fillStyle = '#333';
                lines.forEach(l => {
                    ctx.fillText(l, x + cardWidth / 2, drawY);
                    drawY += nameLineHeight;
                });
            }
            if (showPrice) {
                if (showText) drawY += 5;
                ctx.font      = "14px 'Pretendard', sans-serif";
                ctx.fillStyle = '#182558';
                ctx.fillText(item.price || '-', x + cardWidth / 2, drawY);
            }
        }
    }

    return cvs.toDataURL('image/jpeg', 0.9);
}

/* ============================================================
   이미지 다운로드
   ============================================================ */
function downloadImage() {
    const img = document.getElementById('imgCollection');
    if (!img?.src) return;
    const a      = document.createElement('a');
    a.download   = 'nongdam_collection.jpg';
    a.href       = img.src;
    a.click();
}

/* ============================================================
   시작
   ============================================================ */
init();
