// 🚫 DISABLED - OLD CLICK EFFECTS (replaced by firework effects)
if (false) { // Vô hiệu hóa hoàn toàn
(function() {
    'use strict';
    
    // 🌊 Ocean Blue Ripple Effect - Hiệu ứng sóng tròn
    function createRipple(x, y) {
        const ripple = document.createElement('div');
        ripple.className = 'click-ripple';
        
        ripple.style.cssText = `
            position: fixed;
            left: ${x - 15}px;
            top: ${y - 15}px;
            width: 30px;
            height: 30px;
            background: radial-gradient(circle, rgba(0, 212, 255, 0.4) 0%, rgba(0, 212, 255, 0.2) 50%, transparent 100%);
            border-radius: 50%;
            pointer-events: none;
            z-index: 9999;
            animation: rippleEffect 0.4s ease-out forwards;
            transform: scale(0);
        `;
        
        document.body.appendChild(ripple);
        
        // Xóa ripple sau khi animation kết thúc
        setTimeout(() => {
            if (ripple && ripple.parentNode) {
                ripple.parentNode.removeChild(ripple);
            }
        }, 400);
    }
    
    // 🌊 Ocean Blue Particle Effect - Hiệu ứng hạt bay
    function createParticles(x, y) {
        const particleCount = 4;
        const colors = ['#00D4FF', '#0099CC', '#66FFCC', '#0088FF'];
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'click-particle';
            
            const angle = (360 / particleCount) * i;
            const velocity = 30 + Math.random() * 30; // Giảm velocity
            const size = 2 + Math.random() * 2; // Giảm kích thước
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            const endX = x + Math.cos(angle * Math.PI / 180) * velocity;
            const endY = y + Math.sin(angle * Math.PI / 180) * velocity;
            
            particle.style.cssText = `
                position: fixed;
                left: ${x}px;
                top: ${y}px;
                width: ${size}px;
                height: ${size}px;
                background: ${color};
                border-radius: 50%;
                pointer-events: none;
                z-index: 9998;
                box-shadow: 0 0 3px ${color}; // Giảm shadow
                animation: particleMove 0.6s ease-out forwards;
                --end-x: ${endX}px;
                --end-y: ${endY}px;
            `;
            
            document.body.appendChild(particle);
            
            // Xóa particle sau khi animation kết thúc
            setTimeout(() => {
                if (particle && particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 600);
        }
    }
    
    // 🌟 Enhanced Cursor Trail with Falling Particles - Hiệu ứng đuôi chuột và hạt rơi
    const trail = [];
    const trailLength = 35; // Tăng số lượng trail dots
    const fallingParticles = [];
    
    function createTrailDot(x, y) {
        // Tạo nhiều loại ocean particle khác nhau
        const particleTypes = [
            { size: 6, color: 'rgba(0, 212, 255, 0.8)', glow: '0 0 8px rgba(0, 212, 255, 0.6)' },
            { size: 4, color: 'rgba(0, 153, 204, 0.7)', glow: '0 0 6px rgba(0, 153, 204, 0.5)' },
            { size: 5, color: 'rgba(102, 255, 204, 0.6)', glow: '0 0 5px rgba(102, 255, 204, 0.4)' },
            { size: 3, color: 'rgba(0, 170, 230, 0.9)', glow: '0 0 4px rgba(0, 170, 230, 0.7)' }
        ];
        
        // Tạo ít particles hơn để tăng performance
        const numParticles = Math.random() > 0.8 ? 2 : 1;
        
        for (let i = 0; i < numParticles; i++) {
            const particleType = particleTypes[Math.floor(Math.random() * particleTypes.length)];
            const dot = document.createElement('div');
            dot.className = 'cursor-trail-enhanced';
            
            // Random offset để tạo hiệu ứng tản
            const offsetX = (Math.random() - 0.5) * 10;
            const offsetY = (Math.random() - 0.5) * 10;
            
            dot.style.cssText = `
                position: fixed;
                left: ${x + offsetX}px;
                top: ${y + offsetY}px;
                width: ${particleType.size}px;
                height: ${particleType.size}px;
                background: ${particleType.color};
                border-radius: 50%;
                pointer-events: none;
                z-index: 9997;
                box-shadow: ${particleType.glow};
                animation: fallingTrail ${0.8 + Math.random() * 1}s ease-out forwards;
                --fall-distance: ${30 + Math.random() * 60}px;
            `;
            
            document.body.appendChild(dot);
            fallingParticles.push({
                element: dot,
                createdAt: Date.now(),
                lifetime: 800 + Math.random() * 400 // Giảm lifetime
            });
        }
        
        // Dọn dẹp các particle cũ
        fallingParticles.forEach((particle, index) => {
            if (Date.now() - particle.createdAt > particle.lifetime) {
                if (particle.element && particle.element.parentNode) {
                    particle.element.parentNode.removeChild(particle.element);
                }
                fallingParticles.splice(index, 1);
            }
        });
        
        // Giữ số lượng particle thấp để tăng performance
        if (fallingParticles.length > 50) { // Giảm từ 100 xuống 50
            const oldParticles = fallingParticles.splice(0, 10); // Xóa 10 particles cũ nhất
            oldParticles.forEach(particle => {
                if (particle.element && particle.element.parentNode) {
                    particle.element.parentNode.removeChild(particle.element);
                }
            });
        }
    }
    
    // 🎯 Event Listeners with Performance Optimization
    let isMouseDown = false;
    let trailEnabled = true;
    let lastTrailTime = 0;
    let lastClickTime = 0;
    const TRAIL_THROTTLE = 16; // ~60fps
    const CLICK_THROTTLE = 100; // Prevent spam clicks
    
    // Click Effects (throttled)
    document.addEventListener('click', function(e) {
        const now = Date.now();
        if (now - lastClickTime < CLICK_THROTTLE) return;
        lastClickTime = now;
        
        // Bỏ qua nếu click vào input/textarea
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        
        const x = e.clientX;
        const y = e.clientY;
        
        createRipple(x, y);
        createParticles(x, y);
    });
    
    // Mouse trail (heavily optimized)
    document.addEventListener('mousemove', function(e) {
        if (!trailEnabled) return;
        
        // Skip on mobile/touch devices
        if (window.innerWidth < 768 || 'ontouchstart' in window) return;
        
        const now = Date.now();
        if (now - lastTrailTime < TRAIL_THROTTLE) return;
        lastTrailTime = now;
        
        // Use requestAnimationFrame for better performance
        requestAnimationFrame(() => {
            const x = e.clientX - 2;
            const y = e.clientY - 2;
            createTrailDot(x, y);
        });
    });
    
    // Toggle trail on/off khi nhấn phím 'T'
    document.addEventListener('keydown', function(e) {
        if (e.key.toLowerCase() === 't' && e.ctrlKey) {
            e.preventDefault();
            trailEnabled = !trailEnabled;
            
            if (!trailEnabled) {
                // Xóa tất cả trail dots
                trail.forEach(dot => {
                    if (dot && dot.parentNode) {
                        dot.parentNode.removeChild(dot);
                    }
                });
                trail.length = 0;
            }
            
            console.log(`🌟 Cursor trail ${trailEnabled ? 'enabled' : 'disabled'}`);
        }
    });
    
    // Xóa trail khi rời khỏi window
    document.addEventListener('mouseleave', function() {
        trail.forEach(dot => {
            if (dot && dot.parentNode) {
                dot.style.opacity = '0';
            }
        });
    });
    
    console.log('✨ Click Effects initialized! Press Ctrl+T to toggle cursor trail');
})();
} // End disabled block
