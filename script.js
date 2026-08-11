/*******************************************************
 * ⚠️ SECURITY: Restrict this key to willyportfolio.website
 * in Google Cloud Console → APIs & Services → Credentials → API key → HTTP referrers.
 * Never expose unrestricted keys on the client side.
 *******************************************************/
const API_KEY = 'AIzaSyDV2w8sbKnhb1hft2a9_3wpw_Mz7wwtt4E';

const videoUrls = [
    'https://www.youtube.com/shorts/cVYEcTzZrgs',
    'https://www.youtube.com/shorts/FIcmMqB2K2U',
    'https://www.youtube.com/watch?v=z8zjfcbJf44',
    'https://www.youtube.com/watch?v=gEPE9coINeU',
    'https://www.youtube.com/watch?v=P2hRQ2v9QoY',
    'https://www.youtube.com/watch?v=xq6oybZt7Qg',
    'https://www.youtube.com/watch?v=fVjjMqtC0Os',
    'https://www.youtube.com/watch?v=hOoiLAh32DU',
    'https://www.youtube.com/watch?v=jZH4Ux1m8V8',
    'https://www.youtube.com/watch?v=EfVowScXhTo',
    'https://www.youtube.com/watch?v=bGsyYhupshY',
    'https://www.youtube.com/watch?v=FwjgmckaZj0',
    'https://www.youtube.com/watch?v=lWFzShuhWgU',
    'https://www.youtube.com/watch?v=29CGFkBWcIQ',
    'https://www.youtube.com/watch?v=Gstwel6Aq0Q',
    'https://www.youtube.com/watch?v=p1qSG9vNkl8',
    'https://www.youtube.com/watch?v=B9d5HPqkgQ0'
];

// Custom badges (optional) – video ID → badge text
const videoBadges = {
    '': '100k+ Views',
    '': 'Viral Short',
    '': 'Trending'
};

// Client feedback data
const feedbackData = [
    {
        text: "Willy is a great editor and very good with subtitles mainly. If you ask him to add something or do something specific he will do his best to do it and succeeds at that task. I use him for most of my videos and I am very happy with the results every single time. Very nice and cooperative and gets the job done as fast as he can, usually when you give him a due date his does it in time, 10/10!!",
        author: "– CasualBrock (YouTube)"
    }
];

document.addEventListener('DOMContentLoaded', () => {
    // DOM refs
    const videoGrid = document.getElementById('videoGrid');
    const clientsGrid = document.getElementById('clientsGrid');
    const clientsEmpty = document.getElementById('clientsEmpty');
    const statsContainer = document.getElementById('statsContainer');
    const loadingMessage = document.getElementById('loadingMessage');
    const modal = document.getElementById('videoModal');
    const modalClose = document.getElementById('modalClose');
    const modalBackdrop = document.getElementById('modalBackdrop');
    const modalVideoWrapper = document.getElementById('modalVideoWrapper');
    const modalTitle = document.getElementById('modalTitle');
    const modalCategory = document.getElementById('modalCategory');
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');
    const currentYearSpan = document.getElementById('currentYear');
    const feedbackCarousel = document.getElementById('feedbackCarousel');
    const estimatorResult = document.getElementById('estimatorResult');
    const estimatorPrice = document.getElementById('estimatorPrice');
    const estimatorSend = document.getElementById('estimatorSend');
    const formMessage = document.getElementById('formMessage');

    let allVideos = [];
    let channelCache = {};
    let activeFilter = 'all';

    if (currentYearSpan) currentYearSpan.textContent = new Date().getFullYear();

    // ========== UTILS ==========
    function getVideoId(url) {
        const patterns = [
            /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/,
            /(?:https?:\/\/)?youtu\.be\/([^?]+)/,
            /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^/?]+)/,
            /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([^/?]+)/
        ];
        for (const p of patterns) {
            const match = url.match(p);
            if (match) return match[1];
        }
        return null;
    }

    function parseDuration(iso) {
        const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        const h = parseInt(match[1] || 0);
        const m = parseInt(match[2] || 0);
        const s = parseInt(match[3] || 0);
        return h * 3600 + m * 60 + s;
    }

    // ========== API ==========
    async function fetchVideoDetails(videoId) {
        const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoId}&key=${API_KEY}`;
        const res = await fetch(url);
        const data = await res.json();
        if (!data.items || data.items.length === 0) return null;
        const item = data.items[0];
        const snippet = item.snippet;
        const durationSec = parseDuration(item.contentDetails.duration);
        const viewCount = parseInt(item.statistics.viewCount || '0');
        const isShort = videoUrls.some(u => u.includes('/shorts/') && getVideoId(u) === videoId);
        const category = (durationSec <= 60 || isShort) ? 'short' : 'long';

        return {
            id: videoId,
            title: snippet.title,
            thumbnail: snippet.thumbnails.medium.url,
            channelId: snippet.channelId,
            channelTitle: snippet.channelTitle,
            durationSec,
            category,
            viewCount,
            embedUrl: `https://www.youtube.com/embed/${videoId}`
        };
    }

    async function fetchChannelDetails(channelId) {
        if (channelCache[channelId]) return channelCache[channelId];
        const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${API_KEY}`;
        const res = await fetch(url);
        const data = await res.json();
        if (!data.items || data.items.length === 0) return null;
        const item = data.items[0];
        const channel = {
            name: item.snippet.title,
            logo: item.snippet.thumbnails.default.url,
            subCount: parseInt(item.statistics.subscriberCount || '0')
        };
        channelCache[channelId] = channel;
        return channel;
    }

    async function loadAllVideos() {
        allVideos = [];
        channelCache = {};
        if (!API_KEY || API_KEY === 'YOUR_YOUTUBE_API_KEY') {
            loadingMessage.textContent = '⚠️ Please add your YouTube API key in script.js';
            return;
        }
        if (videoUrls.length === 0) {
            loadingMessage.textContent = 'No videos yet – add links to the videoUrls array.';
            return;
        }
        loadingMessage.style.display = 'block';
        const promises = videoUrls.map(url => {
            const vidId = getVideoId(url);
            if (!vidId) return Promise.resolve(null);
            return fetchVideoDetails(vidId);
        });
        const results = await Promise.all(promises);
        allVideos = results.filter(v => v !== null);
        loadingMessage.style.display = 'none';

        const uniqueChannelIds = [...new Set(allVideos.map(v => v.channelId))];
        await Promise.all(uniqueChannelIds.map(id => fetchChannelDetails(id)));

        renderAll();
    }

    // ========== RENDER ==========
    function renderStats() {
        if (allVideos.length === 0) return;
        statsContainer.innerHTML = `
            <span>🎬 ${allVideos.length} edits</span>
            <span>👀 ${allVideos.reduce((s,v)=>s+v.viewCount,0).toLocaleString()} views</span>
        `;
    }

    function renderFilters() {
        document.querySelectorAll('.filter-pill').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                activeFilter = e.target.dataset.filter;
                renderVideoGrid();
            });
        });
    }

    function renderVideoGrid() {
        if (allVideos.length === 0) {
            videoGrid.innerHTML = '<p style="color:var(--text-muted);">No videos yet.</p>';
            return;
        }
        let filtered = allVideos;
        if (activeFilter === 'short') filtered = allVideos.filter(v => v.category === 'short');
        else if (activeFilter === 'long') filtered = allVideos.filter(v => v.category === 'long');

        videoGrid.innerHTML = filtered.map(v => {
            const badge = videoBadges[v.id] || '';
            return `
                <div class="video-card reveal" data-videoid="${v.id}">
                    ${badge ? `<span class="video-card__badge">${badge}</span>` : ''}
                    <div class="video-card__thumbnail">
                        <img src="${v.thumbnail}" alt="${v.title}" loading="lazy">
                        <div class="video-card__play"></div>
                    </div>
                    <div class="video-card__info">
                        <h3 class="video-card__title">${v.title}</h3>
                        <span class="video-card__category">${v.category === 'short' ? '🎞️ Short' : '🎥 Long'}</span>
                    </div>
                </div>
            `;
        }).join('');

        document.querySelectorAll('.video-card').forEach(card => {
            card.addEventListener('click', () => {
                const vidId = card.dataset.videoid;
                const video = allVideos.find(v => v.id === vidId);
                if (video) openModal(video);
            });
        });

        // Observe newly added cards for animation
        observeReveal();
    }

    function renderClients() {
        const uniqueChannels = [...new Set(allVideos.map(v => v.channelId))];
        if (uniqueChannels.length === 0) {
            clientsGrid.innerHTML = '';
            clientsEmpty.style.display = 'block';
            return;
        }
        clientsEmpty.style.display = 'none';
        clientsGrid.innerHTML = uniqueChannels.map(cid => {
            const ch = channelCache[cid];
            if (!ch) return '';
            return `
                <div class="client-card reveal">
                    <img class="client-card__logo" src="${ch.logo}" alt="${ch.name} logo" loading="lazy">
                    <div>
                        <div class="client-card__name">${ch.name}</div>
                        <div class="client-card__subs">${ch.subCount ? ch.subCount.toLocaleString() + ' subs' : ''}</div>
                    </div>
                </div>
            `;
        }).join('');
        observeReveal();
    }

    function renderFeedback() {
        if (!feedbackCarousel) return;
        feedbackCarousel.innerHTML = feedbackData.map(f => `
            <div class="feedback__card reveal">
                <p class="feedback__text">"${f.text}"</p>
                <span class="feedback__author">${f.author}</span>
            </div>
        `).join('');
        observeReveal();
    }

    // ========== SCROLL ANIMATION (IntersectionObserver) ==========
    function observeReveal() {
        const reveals = document.querySelectorAll('.reveal');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        reveals.forEach(el => observer.observe(el));
    }

    // ========== MODAL ==========
    function openModal(video) {
        modalVideoWrapper.innerHTML = `<iframe src="${video.embedUrl}" allowfullscreen allow="autoplay; encrypted-media"></iframe>`;
        modalTitle.textContent = video.title;
        modalCategory.textContent = video.category === 'short' ? 'Short (<1 min)' : 'Long video';
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        modal.classList.remove('active');
        modalVideoWrapper.innerHTML = '';
        document.body.style.overflow = '';
    }

    modalClose.addEventListener('click', closeModal);
    modalBackdrop.addEventListener('click', closeModal);
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && modal.classList.contains('active')) closeModal();
    });

    // ========== MOBILE NAV ==========
    hamburger.addEventListener('click', () => navLinks.classList.toggle('active'));
    navLinks.querySelectorAll('a').forEach(link => link.addEventListener('click', () => navLinks.classList.remove('active')));

    // ========== QUOTE ESTIMATOR ==========
    const selections = { format: null, footage: null, addons: [] };

    document.querySelectorAll('.estimator__options').forEach(group => {
        group.addEventListener('click', (e) => {
            if (!e.target.classList.contains('estimator__option')) return;
            const key = group.dataset.estimator;
            const value = e.target.dataset.value;

            if (key === 'addons') {
                // Toggle multi-select
                e.target.classList.toggle('selected');
                if (e.target.classList.contains('selected')) {
                    selections.addons.push(value);
                } else {
                    selections.addons = selections.addons.filter(v => v !== value);
                }
            } else {
                // Single select
                group.querySelectorAll('.estimator__option').forEach(btn => btn.classList.remove('selected'));
                e.target.classList.add('selected');
                selections[key] = value;
            }
            updateEstimate();
        });
    });

    function updateEstimate() {
        const { format, footage, addons } = selections;
        if (!format || !footage) {
            estimatorResult.style.display = 'none';
            return;
        }

        // Base price calculation (simplified)
        let minPrice = 0, maxPrice = 0;
        if (format === 'short') { minPrice = 25; maxPrice = 40; }
        else if (format === 'long') { minPrice = 35; maxPrice = 100; }
        else if (format === 'twitch') { minPrice = 50; maxPrice = 120; }

        if (footage === '<30') { /* no change */ }
        else if (footage === '30-60') { minPrice += 10; maxPrice += 20; }
        else if (footage === '60+') { minPrice += 20; maxPrice += 40; }

        if (addons.includes('thumbnail')) { minPrice += 10; maxPrice += 20; }
        if (addons.includes('motion')) { minPrice += 15; maxPrice += 30; }
        if (addons.includes('rush')) { minPrice += 20; maxPrice += 35; }

        estimatorPrice.textContent = `$${minPrice} – $${maxPrice}`;
        estimatorResult.style.display = 'block';
    }

    estimatorSend.addEventListener('click', () => {
        const { format, footage, addons } = selections;
        if (!format || !footage) return;
        const formatMap = { short: 'Short-form', long: 'Long-form YouTube', twitch: 'Twitch Highlights' };
        const footageMap = { '<30': '<30 min', '30-60': '30-60 min', '60+': '60+ min' };
        const addonMap = { thumbnail: 'Thumbnail Design', motion: 'Motion Graphics', rush: 'Fast Turnaround' };

        const summary = `Project Estimate:\n- Format: ${formatMap[format]}\n- Footage: ${footageMap[footage]}\n- Add-ons: ${addons.length ? addons.map(a => addonMap[a]).join(', ') : 'None'}\n- Estimated Range: ${estimatorPrice.textContent}`;

        formMessage.value = summary;
        document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
    });

    // ========== INIT ==========
    renderFeedback();
    loadAllVideos();
    renderFilters();
    // Initial observe after video load is triggered inside render functions
});