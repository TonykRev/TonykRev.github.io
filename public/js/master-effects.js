// 🌸 MASTER EFFECTS SYSTEM - Tận dụng sức mạnh tối đa AI
// Advanced Particle System with Beautiful Visual Effects

(function() {
    'use strict';
    
    // 🎨 Configuration - Tối ưu cho hiệu suất
    const CONFIG = {
        // Falling petals config
        PETAL_COUNT: 8,
        PETAL_COLORS: [
            'rgba(255, 182, 193, 0.8)',  // Light pink
            'rgba(255, 218, 185, 0.8)',  // Peach  
            'rgba(230, 230, 250, 0.8)',  // Lavender
            'rgba(245, 245, 220, 0.8)',  // Beige
            'rgba(255, 240, 245, 0.8)',  // Lavender blush
            'rgba(255, 228, 225, 0.8)',  // Misty rose
        ],
        
        // Firework Click effects config
        FIREWORK_PARTICLES: 20, // Số lượng hạt pháo hoa
        FIREWORK_COLORS: [
            '#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', 
            '#96CEB4', '#FFEAA7', '#DDA0DD', '#FF7675',
            '#00D4FF', '#66FFCC', '#FF9FF3', '#54A0FF'
        ],
        
        // Performance settings
        MAX_PETALS: 25,
        MAX_PARTICLES: 40,
        CLEANUP_INTERVAL: 100,
    };
    
    // 🌸 Advanced Petal Class
    class FloatingPetal {
        constructor() {
            this.element = document.createElement('div');
            this.init();
        }
        
        init() {
            // Random properties
            this.size = Math.random() * 8 + 6;
            this.x = Math.random() * window.innerWidth;
            this.y = -this.size;
            this.rotation = Math.random() * 360;
            this.rotationSpeed = (Math.random() - 0.5) * 4;
            this.fallSpeed = Math.random() * 2 + 1;
            this.swaySpeed = Math.random() * 0.02 + 0.01;
            this.swayAmount = Math.random() * 50 + 20;
            this.color = CONFIG.PETAL_COLORS[Math.floor(Math.random() * CONFIG.PETAL_COLORS.length)];
            
            // Create beautiful petal shape
            this.element.className = 'master-petal';
            this.element.style.cssText = `
                position: fixed;
                width: ${this.size}px;
                height: ${this.size}px;
                background: ${this.color};
                border-radius: 50% 0 50% 0;
                transform-origin: center;
                pointer-events: none;
                z-index: 1000;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                filter: blur(0.5px);
                opacity: 0.9;
                will-change: transform;
            `;
            
            document.body.appendChild(this.element);
            this.animate();
        }
        
        animate() {
            const animate = () => {
                if (!this.element.parentNode) return;
                
                // Update position
                this.y += this.fallSpeed;
                this.x += Math.sin(this.y * this.swaySpeed) * this.swayAmount * 0.01;
                this.rotation += this.rotationSpeed;
                
                // Apply transform
                this.element.style.transform = `
                    translate3d(${this.x}px, ${this.y}px, 0)
                    rotate(${this.rotation}deg)
                `;
                
                // Remove if off screen
                if (this.y > window.innerHeight + this.size) {
                    this.destroy();
                    return;
                }
                
                requestAnimationFrame(animate);
            };
            animate();
        }
        
        destroy() {
            if (this.element && this.element.parentNode) {
                this.element.parentNode.removeChild(this.element);
            }
        }
    }
    
    
    // 🎆 Firework Click Effect Class
    class ClickEffect {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.createFirework();
        }
        
        createFirework() {
            // Tạo firework burst effect
            const particleCount = 15 + Math.floor(Math.random() * 10); // 15-25 particles
            const colors = [
                '#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', 
                '#96CEB4', '#FFEAA7', '#DDA0DD', '#FF7675',
                '#00D4FF', '#66FFCC', '#FF9FF3', '#54A0FF'
            ];
            
            for (let i = 0; i < particleCount; i++) {
                const particle = document.createElement('div');
                
                // Random properties cho firework effect
                const angle = (360 / particleCount) * i + (Math.random() - 0.5) * 60;
                const velocity = 40 + Math.random() * 80;
                const size = 3 + Math.random() * 4;
                const color = colors[Math.floor(Math.random() * colors.length)];
                const gravity = 0.5 + Math.random() * 0.3;
                const life = 1.0 + Math.random() * 0.8;
                
                particle.className = 'firework-particle';
                particle.style.cssText = `
                    position: fixed;
                    left: ${this.x}px;
                    top: ${this.y}px;
                    width: ${size}px;
                    height: ${size}px;
                    background: ${color};
                    border-radius: 50%;
                    pointer-events: none;
                    z-index: 10000;
                    box-shadow: 0 0 8px ${color};
                    animation: fireworkExplode ${life}s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
                    --angle: ${angle}deg;
                    --velocity: ${velocity}px;
                    --gravity: ${gravity};
                    will-change: transform, opacity;
                `;
                
                document.body.appendChild(particle);
                setTimeout(() => particle.remove(), life * 1000);
            }
            
            // Thêm burst flash effect
            this.createBurstFlash();
        }
        
        createBurstFlash() {
            const flash = document.createElement('div');
            flash.className = 'firework-flash';
            flash.style.cssText = `
                position: fixed;
                left: ${this.x - 15}px;
                top: ${this.y - 15}px;
                width: 30px;
                height: 30px;
                background: radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, transparent 70%);
                border-radius: 50%;
                pointer-events: none;
                z-index: 10001;
                animation: fireworkFlash 0.2s ease-out forwards;
            `;
            
            document.body.appendChild(flash);
            setTimeout(() => flash.remove(), 200);
        }
    }
    
    
    // 🎪 Master Effects Manager
    class MasterEffectsManager {
        constructor() {
            this.petals = [];
            this.lastPetalTime = 0;
            this.init();
        }
        
        init() {
            this.addCSS();
            this.setupEventListeners();
            this.startPetalSystem();
            
            console.log('🎆✨ Master Effects System Initialized! Click for fireworks, Ctrl+Shift+E to toggle');
        }
        
        addCSS() {
            const css = `
                @keyframes fireworkExplode {
                    0% { 
                        transform: translate(0, 0) scale(1);
                        opacity: 1;
                    }
                    50% {
                        opacity: 1;
                    }
                    100% { 
                        transform: translate(
                            calc(cos(var(--angle) * 3.14159 / 180) * var(--velocity)), 
                            calc(sin(var(--angle) * 3.14159 / 180) * var(--velocity) + var(--gravity) * 100px)
                        ) scale(0.3);
                        opacity: 0;
                    }
                }
                
                @keyframes fireworkFlash {
                    0% { 
                        transform: scale(0);
                        opacity: 1;
                    }
                    50% {
                        transform: scale(1.5);
                        opacity: 0.8;
                    }
                    100% { 
                        transform: scale(3);
                        opacity: 0;
                    }
                }
                
                .master-petal {
                    transition: filter 0.3s ease;
                }
                
                .master-petal:hover {
                    filter: blur(0px) brightness(1.2);
                }
            `;
            
            const style = document.createElement('style');
            style.textContent = css;
            document.head.appendChild(style);
        }
        
        setupEventListeners() {
            // Click effects
            document.addEventListener('click', (e) => {
                // Skip if clicking on inputs
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
                
                new ClickEffect(e.clientX, e.clientY);
            });
            
            
            // Keyboard controls
            document.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.shiftKey && e.key === 'E') {
                    e.preventDefault();
                    this.toggleEffects();
                }
            });
            
            // Window visibility optimization
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    this.pauseEffects();
                } else {
                    this.resumeEffects();
                }
            });
        }
        
        startPetalSystem() {
            const createPetal = () => {
                if (this.petals.length < CONFIG.MAX_PETALS) {
                    const petal = new FloatingPetal();
                    this.petals.push(petal);
                }
                
                // Cleanup destroyed petals
                this.petals = this.petals.filter(petal => petal.element.parentNode);
                
                // Schedule next petal
                const delay = 800 + Math.random() * 2000; // 0.8-2.8s interval
                setTimeout(createPetal, delay);
            };
            
            // Start the petal system
            createPetal();
        }
        
        
        toggleEffects() {
            const isHidden = document.body.dataset.effectsHidden === 'true';
            document.body.dataset.effectsHidden = !isHidden;
            
            const petals = document.querySelectorAll('.master-petal');
            
            petals.forEach(petal => {
                petal.style.display = isHidden ? 'block' : 'none';
            });
            
            console.log(`🎪 Effects ${isHidden ? 'enabled' : 'disabled'}`);
        }
        
        pauseEffects() {
            // Pause animations when tab is not visible
            const petals = document.querySelectorAll('.master-petal');
            petals.forEach(petal => {
                petal.style.animationPlayState = 'paused';
            });
        }
        
        resumeEffects() {
            // Resume animations when tab becomes visible
            const petals = document.querySelectorAll('.master-petal');
            petals.forEach(petal => {
                petal.style.animationPlayState = 'running';
            });
        }
    }
    
    // 🚀 Initialize Master Effects System
    window.addEventListener('load', () => {
        setTimeout(() => {
            new MasterEffectsManager();
        }, 1000);
    });
    
    console.log('🎆 Firework Effects System Ready! Click anywhere for beautiful fireworks!');
    
})();