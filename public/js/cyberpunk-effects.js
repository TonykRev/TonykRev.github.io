// 🚫 DISABLED - CYBERPUNK TECH EFFECTS (causing performance issues)
if (false) { // Vô hiệu hóa hoàn toàn
(function() {
    'use strict';
    
    // 🌐 Initialize Cyberpunk Effects
    function initCyberpunkEffects() {
        createGridOverlay();
        createMatrixRain();
        createFloatingTechParticles();
        createTechIcons();
        createGeometricShapes();
        createDataStream();
        applyCyberpunkStyles();
        
        console.log('🚀 Cyberpunk Tech Effects initialized!');
    }
    
    // 🌐 Animated Grid Background
    function createGridOverlay() {
        const gridOverlay = document.createElement('div');
        gridOverlay.className = 'cyber-grid-overlay';
        document.body.appendChild(gridOverlay);
    }
    
    // 🔗 Optimized Matrix Rain Effect
    function createMatrixRain() {
        // Reduce particles on mobile or low-end devices
        const isMobile = window.innerWidth < 768;
        const isLowEnd = navigator.hardwareConcurrency < 4;
        
        if (isMobile || isLowEnd) {
            return; // Skip matrix rain on mobile/low-end devices
        }
        
        const matrixContainer = document.createElement('div');
        matrixContainer.className = 'matrix-rain';
        document.body.appendChild(matrixContainer);
        
        const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
        const columns = Math.min(Math.floor(window.innerWidth / 30), 20); // Reduce max columns
        
        // Create fewer initial columns
        for (let i = 0; i < columns; i++) {
            if (Math.random() > 0.85) { // Reduce to 15% chance
                createMatrixColumn(i * 30, chars);
            }
        }
        
        // Less frequent updates
        setInterval(() => {
            if (Math.random() > 0.9) { // Reduce frequency
                const randomColumn = Math.floor(Math.random() * columns);
                createMatrixColumn(randomColumn * 30, chars);
            }
        }, 4000); // Increase interval
    }
    
    function createMatrixColumn(x, chars) {
        const column = document.createElement('div');
        column.className = 'matrix-column';
        column.style.left = x + 'px';
        column.style.animationDuration = (Math.random() * 3 + 2) + 's';
        
        // Create random character string
        const length = Math.floor(Math.random() * 20) + 10;
        let text = '';
        for (let i = 0; i < length; i++) {
            text += chars[Math.floor(Math.random() * chars.length)] + '<br>';
        }
        column.innerHTML = text;
        
        document.querySelector('.matrix-rain').appendChild(column);
        
        // Remove after animation
        setTimeout(() => {
            if (column && column.parentNode) {
                column.parentNode.removeChild(column);
            }
        }, parseFloat(column.style.animationDuration) * 1000);
    }
    
    // 🌟 Optimized Floating Tech Particles
    function createFloatingTechParticles() {
        const isMobile = window.innerWidth < 768;
        const isLowEnd = navigator.hardwareConcurrency < 4;
        
        if (isMobile) return; // Skip on mobile
        
        const interval = isLowEnd ? 3000 : 2000; // Less frequent on low-end devices
        
        setInterval(() => {
            if (Math.random() > 0.85) { // Reduce frequency
                createTechParticle();
            }
        }, interval);
    }
    
    function createTechParticle() {
        const particle = document.createElement('div');
        particle.className = 'tech-particle';
        particle.style.left = Math.random() * window.innerWidth + 'px';
        particle.style.animationDuration = (Math.random() * 10 + 10) + 's';
        particle.style.animationDelay = Math.random() * 2 + 's';
        
        document.body.appendChild(particle);
        
        setTimeout(() => {
            if (particle && particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        }, 20000);
    }
    
    // 🔮 Optimized Tech Icons
    function createTechIcons() {
        const isMobile = window.innerWidth < 768;
        if (isMobile) return; // Skip on mobile
        
        const icons = ['⚡', '🔬', '🛸', '🔋', '📡', '🛰️', '⚙️', '🔌', '📎', '🌐', '⭐', '🔺'];
        
        setInterval(() => {
            if (Math.random() > 0.92) { // Much less frequent
                createTechIcon(icons);
            }
        }, 6000); // Longer interval
    }
    
    function createTechIcon(icons) {
        const icon = document.createElement('div');
        icon.className = 'tech-icon';
        icon.textContent = icons[Math.floor(Math.random() * icons.length)];
        icon.style.left = Math.random() * window.innerWidth + 'px';
        icon.style.animationDuration = (Math.random() * 15 + 15) + 's';
        icon.style.animationDelay = Math.random() * 3 + 's';
        
        document.body.appendChild(icon);
        
        setTimeout(() => {
            if (icon && icon.parentNode) {
                icon.parentNode.removeChild(icon);
            }
        }, 25000);
    }
    
    // 🔺 Geometric Tech Shapes
    function createGeometricShapes() {
        setInterval(() => {
            if (Math.random() > 0.85) {
                createRandomShape();
            }
        }, 4000);
    }
    
    function createRandomShape() {
        const shapes = ['tech-triangle', 'tech-diamond', 'tech-hexagon'];
        const randomShape = shapes[Math.floor(Math.random() * shapes.length)];
        
        const shape = document.createElement('div');
        shape.className = 'tech-shape ' + randomShape;
        shape.style.left = Math.random() * window.innerWidth + 'px';
        shape.style.top = Math.random() * window.innerHeight + 'px';
        
        document.body.appendChild(shape);
        
        setTimeout(() => {
            if (shape && shape.parentNode) {
                shape.parentNode.removeChild(shape);
            }
        }, 25000);
    }
    
    // 💫 Data Stream Effect
    function createDataStream() {
        const dataContainer = document.createElement('div');
        dataContainer.className = 'data-stream';
        document.body.appendChild(dataContainer);
        
        setInterval(() => {
            if (Math.random() > 0.6) {
                createDataBit();
            }
        }, 1500);
    }
    
    function createDataBit() {
        const dataBits = ['01001001', '11000011', '10101010', '11110000', '00001111', 'ERROR', 'LOADING...', 'ACCESS GRANTED', 'CONNECTING...'];
        
        const bit = document.createElement('div');
        bit.className = 'data-bit';
        bit.textContent = dataBits[Math.floor(Math.random() * dataBits.length)];
        bit.style.top = Math.random() * window.innerHeight + 'px';
        bit.style.animationDuration = (Math.random() * 5 + 5) + 's';
        bit.style.animationDelay = Math.random() * 2 + 's';
        
        document.querySelector('.data-stream').appendChild(bit);
        
        setTimeout(() => {
            if (bit && bit.parentNode) {
                bit.parentNode.removeChild(bit);
            }
        }, 10000);
    }
    
    // 🎨 Apply Cyberpunk Styles to Existing Elements
    function applyCyberpunkStyles() {
        // Apply cyber container to sidebar
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.classList.add('cyber-container');
        }
        
        // Apply cyber music player style
        const musicPlayer = document.querySelector('#aplayer-sidebar');
        if (musicPlayer) {
            musicPlayer.classList.add('cyber-music-player');
        }
        
        // Apply cyber nav to top navigation
        const topNav = document.querySelector('.top-nav');
        if (topNav) {
            topNav.classList.add('cyber-nav');
        }
        
        // Apply holographic text to site title
        const siteTitle = document.querySelector('h1, .site-title');
        if (siteTitle) {
            siteTitle.classList.add('holo-text');
        }
        
        // Add glitch effect to category titles randomly
        const categoryTitles = document.querySelectorAll('h2, h3, .category-title');
        categoryTitles.forEach((title, index) => {
            if (Math.random() > 0.7) {
                title.classList.add('glitch-text');
                title.setAttribute('data-text', title.textContent);
            }
        });
        
        // Add circuit lines to containers
        const containers = document.querySelectorAll('.post-card, .widget');
        containers.forEach(container => {
            if (Math.random() > 0.6) {
                addCircuitLines(container);
            }
        });
    }
    
    // ⚡ Add Circuit Lines to Containers
    function addCircuitLines(container) {
        const numLines = Math.floor(Math.random() * 3) + 1;
        
        for (let i = 0; i < numLines; i++) {
            const line = document.createElement('div');
            line.className = 'circuit-line';
            line.style.top = Math.random() * 100 + '%';
            line.style.left = '0';
            line.style.right = '0';
            line.style.animationDelay = Math.random() * 2 + 's';
            
            container.style.position = 'relative';
            container.appendChild(line);
        }
    }
    
    // 🌟 Glitch Effect for Text on Hover
    function addGlitchEffects() {
        const glitchElements = document.querySelectorAll('.glitch-text');
        
        glitchElements.forEach(element => {
            element.addEventListener('mouseenter', () => {
                element.style.animation = 'none';
                element.offsetHeight; // Trigger reflow
                element.style.animation = null;
            });
        });
    }
    
    // 🎯 Particle Burst on Click (Enhanced)
    function enhanceClickEffects() {
        document.addEventListener('click', (e) => {
            if (Math.random() > 0.7) {
                createCyberBurst(e.clientX, e.clientY);
            }
        });
    }
    
    function createCyberBurst(x, y) {
        const symbols = ['⚡', '💫', '🔷', '🔶', '⭐', '💎'];
        const numSymbols = 8;
        
        for (let i = 0; i < numSymbols; i++) {
            const symbol = document.createElement('div');
            symbol.textContent = symbols[Math.floor(Math.random() * symbols.length)];
            symbol.style.cssText = `
                position: fixed;
                left: ${x}px;
                top: ${y}px;
                color: #FF006B;
                font-size: 16px;
                pointer-events: none;
                z-index: 9999;
                text-shadow: 0 0 10px currentColor;
                animation: cyberBurst 1s ease-out forwards;
                --angle: ${(360 / numSymbols) * i}deg;
            `;
            
            document.body.appendChild(symbol);
            
            setTimeout(() => {
                if (symbol && symbol.parentNode) {
                    symbol.parentNode.removeChild(symbol);
                }
            }, 1000);
        }
    }
    
    // Add CSS for cyber burst
    const cyberBurstCSS = `
        @keyframes cyberBurst {
            0% {
                transform: rotate(var(--angle)) translateX(0) scale(1);
                opacity: 1;
            }
            100% {
                transform: rotate(var(--angle)) translateX(100px) scale(0.2);
                opacity: 0;
            }
        }
    `;
    
    const style = document.createElement('style');
    style.textContent = cyberBurstCSS;
    document.head.appendChild(style);
    
    // 🎮 Initialize Everything
    window.addEventListener('load', () => {
        setTimeout(() => {
            initCyberpunkEffects();
            addGlitchEffects();
            enhanceClickEffects();
        }, 1000);
    });
    
    // 📱 Handle Resize
    window.addEventListener('resize', () => {
        // Recreate matrix rain on resize
        const matrixRain = document.querySelector('.matrix-rain');
        if (matrixRain) {
            matrixRain.innerHTML = '';
        }
    });
    
    console.log('🌟 Cyberpunk Effects Script Loaded!');
    
});
} // End disabled block
