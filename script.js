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
    'https://www.youtube.com/watch?v=B9d5HPqkgQ0',
    'https://www.youtube.com/watch?v=WfyaKa0Vumo'
];

const feedbackData = [
    {
        text: "Willy is a great editor and very good with subtitles mainly. If you ask him to add something or do something specific he will do his best to do it and succeeds at that task. I use him for most of my videos and I am very happy with the results every single time. Very nice and cooperative and gets the job done as fast as he can, usually when you give him a due date his does it in time, 10/10!!",
        author: "CasualBrock (YouTube)"
    }
];

document.addEventListener('DOMContentLoaded', () => {
    // ========== MOBILE NAV TOGGLE ==========
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.querySelector('.nav__links');
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => navLinks.classList.remove('active'));
        });
    }

    // ========== SMOOTH SAME-PAGE ANCHOR SCROLLING ==========
    document.querySelectorAll('a[href*="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (!href) return;

            // Split into path and hash
            const [path, hash] = href.split('#');

            // If it's a pure hash (same page)
            if (!path) {
                if (hash) {
                    e.preventDefault();
                    const target = document.getElementById(hash);
                    if (target) {
                        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }
                return;
            }

            // If it's a cross-page link but current page is index.html and target is also index.html
            const currentPath = window.location.pathname.split('/').pop() || 'index.html';
            if ((path === currentPath || (path === 'index.html' && currentPath === ''))) {
                e.preventDefault();
                const target = document.getElementById(hash);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                } else {
                    // If target doesn't exist, navigate normally
                    window.location.href = href;
                }
            }
            // Otherwise, allow default navigation
        });
    });

    // ========== CURRENT YEAR ==========
    const currentYearSpan = document.getElementById('currentYear');
    if (currentYearSpan) currentYearSpan.textContent = new Date().getFullYear();

    // ========== WORK SECTION ==========
    const videoGrid = document.getElementById('videoGrid');
    const clientsGrid = document.getElementById('clientsGrid');
    const statsContainer = document.getElementById('statsContainer');
    const loadingMessage = document.getElementById('loadingMessage');
    const filterContainer = document.querySelector('.work__filters');
    const clientsEmpty = document.getElementById('clientsEmpty');

    let allVideos = [];
    let channelCache = {};
    let activeFilter = 'all';

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

    async function fetchVideoDetails(videoId) {
        const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoId}&key=${API_KEY}`;
        const res = await fetch(url);
        const data = await res.json();
        if (!data.items || data.items.length === 0) return null;
        const item = data.items[0];
        const durationSec = parseDuration(item.contentDetails.duration);
        const viewCount = parseInt(item.statistics.viewCount || '0');
        const isShort = videoUrls.some(u => u.includes('/shorts/') && getVideoId(u) === videoId);
        const category = (durationSec <= 60 || isShort) ? 'short' : 'long';
        return {
            id: videoId,
            title: item.snippet.title,
            thumbnail: item.snippet.thumbnails.medium.url,
            channelId: item.snippet.channelId,
            channelTitle: item.snippet.channelTitle,
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
        const channel = {
            name: data.items[0].snippet.title,
            logo: data.items[0].snippet.thumbnails.default.url,
            subCount: parseInt(data.items[0].statistics.subscriberCount || '0')
        };
        channelCache[channelId] = channel;
        return channel;
    }

    async function loadAllVideos() {
        allVideos = [];
        channelCache = {};
        if (!videoUrls.length) {
            if (loadingMessage) loadingMessage.textContent = 'No videos added yet.';
            return;
        }
        if (loadingMessage) loadingMessage.style.display = 'block';
        const promises = videoUrls.map(url => {
            const vidId = getVideoId(url);
            return vidId ? fetchVideoDetails(vidId) : Promise.resolve(null);
        });
        const results = await Promise.all(promises);
        allVideos = results.filter(v => v !== null);
        if (loadingMessage) loadingMessage.style.display = 'none';

        const uniqueChannelIds = [...new Set(allVideos.map(v => v.channelId))];
        await Promise.all(uniqueChannelIds.map(id => fetchChannelDetails(id)));

        if (videoGrid) renderVideoGrid();
        if (clientsGrid) renderClients();
        if (statsContainer) renderStats();
    }

    function renderStats() {
        if (!statsContainer || allVideos.length === 0) return;
        statsContainer.innerHTML = `<span>${allVideos.length} edits</span><span>${allVideos.reduce((s,v)=>s+v.viewCount,0).toLocaleString()} views</span>`;
    }

    function renderFilters() {
        if (!filterContainer) return;
        filterContainer.addEventListener('click', (e) => {
            if (!e.target.classList.contains('filter-pill')) return;
            filterContainer.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            activeFilter = e.target.dataset.filter;
            renderVideoGrid();
        });
    }

    function renderVideoGrid() {
        if (!videoGrid) return;
        if (allVideos.length === 0) {
            videoGrid.innerHTML = '<p>No videos found.</p>';
            return;
        }
        let filtered = allVideos;
        if (activeFilter === 'short') filtered = allVideos.filter(v => v.category === 'short');
        else if (activeFilter === 'long') filtered = allVideos.filter(v => v.category === 'long');

        videoGrid.innerHTML = filtered.map(v => `
            <div class="video-card" data-videoid="${v.id}">
                <div class="video-card__thumbnail">
                    <img src="${v.thumbnail}" alt="${v.title}" loading="lazy">
                    <div class="video-card__play"></div>
                </div>
                <div class="video-card__info">
                    <h3>${v.title}</h3>
                    <span>${v.category === 'short' ? 'Short' : 'Long'}</span>
                </div>
            </div>
        `).join('');

        document.querySelectorAll('.video-card').forEach(card => {
            card.addEventListener('click', () => {
                const vidId = card.dataset.videoid;
                const video = allVideos.find(v => v.id === vidId);
                if (video) openModal(video);
            });
        });
    }

    function renderClients() {
        if (!clientsGrid) return;
        const uniqueChannels = [...new Set(allVideos.map(v => v.channelId))];
        if (uniqueChannels.length === 0) {
            if (clientsEmpty) clientsEmpty.style.display = 'block';
            return;
        }
        if (clientsEmpty) clientsEmpty.style.display = 'none';
        clientsGrid.innerHTML = uniqueChannels.map(cid => {
            const ch = channelCache[cid];
            if (!ch) return '';
            return `
                <div class="client-card">
                    <img class="client-card__logo" src="${ch.logo}" alt="${ch.name}">
                    <div>
                        <div class="client-card__name">${ch.name}</div>
                        <div class="client-card__subs">${ch.subCount ? ch.subCount.toLocaleString() + ' subs' : ''}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // ========== FEEDBACK ==========
    const feedbackCarousel = document.getElementById('feedbackCarousel');
    if (feedbackCarousel) {
        feedbackCarousel.innerHTML = feedbackData.map(f => `
            <div class="feedback__card">
                <p class="feedback__text">"${f.text}"</p>
                <span class="feedback__author">${f.author}</span>
            </div>
        `).join('');
    }

    // ========== MODAL ==========
    const modal = document.getElementById('videoModal');
    const modalClose = document.querySelector('.modal__close');
    const modalVideoWrapper = document.querySelector('.modal__video-wrapper');
    const modalTitle = document.getElementById('modalTitle');
    const modalCategory = document.getElementById('modalCategory');

    function openModal(video) {
        if (!modal || !modalVideoWrapper) return;
        modalVideoWrapper.innerHTML = `<iframe src="${video.embedUrl}" allowfullscreen></iframe>`;
        if (modalTitle) modalTitle.textContent = video.title;
        if (modalCategory) modalCategory.textContent = video.category === 'short' ? 'Short' : 'Long video';
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        if (!modal) return;
        modal.classList.remove('active');
        modalVideoWrapper.innerHTML = '';
        document.body.style.overflow = '';
    }

    if (modalClose) modalClose.addEventListener('click', closeModal);
    if (modal) modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && modal && modal.classList.contains('active')) closeModal();
    });

    // ========== ESTIMATOR ==========
    const estimatorResult = document.getElementById('estimatorResult');
    const estimatorPrice = document.getElementById('estimatorPrice');
    const estimatorSend = document.getElementById('estimatorSend');

    if (document.querySelector('.estimator__steps')) {
        const selections = { format: null, footage: null, addons: [], payment: null };
        document.querySelectorAll('.estimator__options').forEach(group => {
            group.addEventListener('click', (e) => {
                if (!e.target.classList.contains('estimator__option')) return;
                const key = group.dataset.estimator;
                const value = e.target.dataset.value;

                if (key === 'addons') {
                    e.target.classList.toggle('selected');
                    if (e.target.classList.contains('selected')) selections.addons.push(value);
                    else selections.addons = selections.addons.filter(v => v !== value);
                } else {
                    group.querySelectorAll('.estimator__option').forEach(btn => btn.classList.remove('selected'));
                    e.target.classList.add('selected');
                    selections[key] = value;
                }
                updateEstimate();
            });
        });

        function updateEstimate() {
            if (!selections.format || !selections.footage) {
                if (estimatorResult) estimatorResult.style.display = 'none';
                return;
            }
            let min = 0, max = 0;
            if (selections.format === 'short') { min = 25; max = 40; }
            else if (selections.format === 'long') { min = 35; max = 100; }
            else if (selections.format === 'twitch') { min = 50; max = 120; }

            if (selections.footage === '30-60') { min += 10; max += 20; }
            else if (selections.footage === '60+') { min += 20; max += 40; }

            if (selections.addons.includes('thumbnail')) { min += 10; max += 20; }
            if (selections.addons.includes('motion')) { min += 15; max += 30; }
            if (selections.addons.includes('rush')) { min += 20; max += 35; }

            if (estimatorPrice) estimatorPrice.textContent = `$${min} - $${max}`;
            if (estimatorResult) estimatorResult.style.display = 'block';
        }

        if (estimatorSend) estimatorSend.addEventListener('click', () => {
            if (!selections.format || !selections.footage) return;
            const formatMap = { short: 'Short-form', long: 'Long-form YouTube', twitch: 'Twitch Highlights' };
            const footageMap = { '<30': '<30 min', '30-60': '30-60 min', '60+': '60+ min' };
            const addonMap = { thumbnail: 'Thumbnail', motion: 'Motion Graphics', rush: 'Fast Turnaround' };
            const paymentMap = { paypal: 'PayPal', bank: 'Bank Transfer (EU)', crypto: 'Crypto', giftcards: 'Giftcards' };

            const summary = `Project Estimate:\nFormat: ${formatMap[selections.format]}\nFootage: ${footageMap[selections.footage]}\nAdd-ons: ${selections.addons.length ? selections.addons.map(a => addonMap[a]).join(', ') : 'None'}\nPayment Method: ${selections.payment ? paymentMap[selections.payment] : 'Not specified'}\nRange: ${estimatorPrice.textContent}`;

            // Redirect to contact page with estimate as query parameter
            const encodedSummary = encodeURIComponent(summary);
            window.location.href = `contact.html?estimate=${encodedSummary}`;
        });
    }

    // ========== CONTACT PAGE: Retrieve estimate from URL ==========
    const formMessage = document.getElementById('formMessage');
    if (formMessage) {
        const urlParams = new URLSearchParams(window.location.search);
        const estimate = urlParams.get('estimate');
        if (estimate) {
            formMessage.value = decodeURIComponent(estimate);
            // Remove the query parameter from URL (optional)
            history.replaceState(null, '', 'contact.html');
        }
    }

    // ========== INIT ==========
    renderFilters();
    loadAllVideos();
});