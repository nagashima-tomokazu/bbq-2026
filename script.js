/* ========================================
   BBQ 2026 - Password Gate & UI
   ======================================== */

// SHA-256 hash of the password (password itself is NOT stored)
const PASSWORD_HASH = 'c30ba7b24076f8bdf939a7ef1da78d2f299d71ad4b8d6a37c8b23df407d9bd19';

/**
 * SHA-256ハッシュを計算する (Web Crypto API)
 */
async function sha256(text) {
    const data = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * パスワードゲートの初期化
 */
function setupPasswordGate() {
    const gate = document.getElementById('pw-gate');
    if (!gate) return;

    // 認証済みならゲートを即削除
    if (sessionStorage.getItem('bbq2026_auth') === 'true') {
        gate.remove();
        return;
    }

    const form = document.getElementById('pw-form');
    const input = document.getElementById('pw-input');
    const error = document.getElementById('pw-error');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const hash = await sha256(input.value);

        if (hash === PASSWORD_HASH) {
            sessionStorage.setItem('bbq2026_auth', 'true');
            gate.classList.add('unlocked');
            setTimeout(() => gate.remove(), 600);
        } else {
            error.textContent = 'パスワードが違います';
            input.classList.add('shake');
            input.value = '';
            setTimeout(() => input.classList.remove('shake'), 500);
        }
    });
}

/**
 * Smooth scroll for nav links
 */
function setupNav() {
    document.querySelectorAll('.nav a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(link.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav a');

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const top = section.offsetTop - 80;
            if (window.scrollY >= top) {
                current = section.getAttribute('id');
            }
        });
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });
}

/**
 * Scroll-triggered reveal (Intersection Observer)
 */
function setupReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    document.querySelectorAll('[data-reveal]').forEach(el => observer.observe(el));
}

/**
 * 初期化
 */
document.addEventListener('DOMContentLoaded', () => {
    setupPasswordGate();
    setupNav();
    setupReveal();
});
