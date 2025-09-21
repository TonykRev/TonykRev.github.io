// 🎼 SMART MUSIC PLAYER CONTROLLER - AI-Powered Music Experience
// Advanced HTML5 Audio Controller with Premium Features

(function() {
    'use strict';
    
    // 🎵 Configuration and State Management
    const MUSIC_CONFIG = {
        // Player settings
        DEFAULT_VOLUME: 0.7,
        FADE_DURATION: 300,
        PROGRESS_UPDATE_RATE: 100,
        VISUALIZATION_ENABLED: true,
        
        // Playlist and tracks
        DEFAULT_PLAYLIST: [
            {
                title: "Ocean Waves",
                artist: "Nature Sounds",
                src: "/static/audio/ocean-waves.mp3",
                artwork: "🌊"
            },
            {
                title: "Lofi Dreams",
                artist: "Chillhop Collective",
                src: "/static/audio/lofi-dreams.mp3",
                artwork: "🎹"
            },
            {
                title: "Study Session",
                artist: "Ambient Creator",
                src: "/static/audio/study-session.mp3",
                artwork: "📚"
            },
            {
                title: "Rainy Night",
                artist: "Peaceful Sounds",
                src: "/static/audio/rainy-night.mp3",
                artwork: "🌧️"
            }
        ],
        
        // Keyboard shortcuts
        SHORTCUTS: {
            'Space': 'togglePlay',
            'ArrowLeft': 'previousTrack',
            'ArrowRight': 'nextTrack',
            'ArrowUp': 'volumeUp',
            'ArrowDown': 'volumeDown',
            'KeyM': 'toggleMute',
            'KeyL': 'toggleLoop',
            'KeyS': 'toggleShuffle'
        }
    };
    
    // 🎶 Smart Music Player Class
    class SmartMusicPlayer {
        constructor() {
            this.audio = new Audio();
            this.playlist = [...MUSIC_CONFIG.DEFAULT_PLAYLIST];
            this.currentTrackIndex = 0;
            this.isPlaying = false;
            this.isMuted = false;
            this.isLooping = false;
            this.isShuffled = false;
            this.volume = MUSIC_CONFIG.DEFAULT_VOLUME;
            this.isMinimized = false;
            this.progressUpdateTimer = null;
            
            this.init();
        }
        
        init() {
            this.createPlayerHTML();
            this.setupEventListeners();
            this.setupAudioHandlers();
            this.loadTrack(this.currentTrackIndex);
            this.setupKeyboardShortcuts();
            this.setupVisualEffects();
            
            console.log('🎼 Smart Music Player initialized with', this.playlist.length, 'tracks');
        }
        
        createPlayerHTML() {
            const playerHTML = `
                <div class="music-player" id="smartMusicPlayer">
                    <div class="music-player-toggle" onclick="smartPlayer.toggleMinimize()">
                        <span class="toggle-icon">−</span>
                    </div>
                    
                    <div class="music-player-header">
                        <div class="music-player-artwork" id="playerArtwork">🎵</div>
                        <div class="music-player-info">
                            <div class="music-player-title" id="playerTitle">Select a track</div>
                            <div class="music-player-artist" id="playerArtist">No artist</div>
                        </div>
                    </div>
                    
                    <div class="music-player-controls">
                        <div class="music-player-btn" onclick="smartPlayer.previousTrack()" title="Previous (←)">
                            <span>⏮</span>
                        </div>
                        <div class="music-player-btn play-pause" onclick="smartPlayer.togglePlay()" title="Play/Pause (Space)" id="playPauseBtn">
                            <span>▶</span>
                        </div>
                        <div class="music-player-btn" onclick="smartPlayer.nextTrack()" title="Next (→)">
                            <span>⏭</span>
                        </div>
                    </div>
                    
                    <div class="music-player-progress" onclick="smartPlayer.seekTo(event)" title="Seek">
                        <div class="music-player-progress-fill" id="progressFill"></div>
                    </div>
                    
                    <div class="music-player-time">
                        <span id="currentTime">0:00</span>
                        <span id="totalTime">0:00</span>
                    </div>
                    
                    <div class="music-player-volume">
                        <div class="music-player-volume-icon" onclick="smartPlayer.toggleMute()" title="Mute (M)" id="volumeIcon">🔊</div>
                        <div class="music-player-volume-slider" onclick="smartPlayer.setVolume(event)">
                            <div class="music-player-volume-fill" id="volumeFill"></div>
                        </div>
                    </div>
                </div>
            `;
            
            // Insert player into DOM
            document.body.insertAdjacentHTML('beforeend', playerHTML);
            this.playerElement = document.getElementById('smartMusicPlayer');
            this.cacheElements();
        }
        
        cacheElements() {
            // Cache DOM elements for performance
            this.elements = {
                artwork: document.getElementById('playerArtwork'),
                title: document.getElementById('playerTitle'),
                artist: document.getElementById('playerArtist'),
                playPauseBtn: document.getElementById('playPauseBtn'),
                progressFill: document.getElementById('progressFill'),
                currentTime: document.getElementById('currentTime'),
                totalTime: document.getElementById('totalTime'),
                volumeIcon: document.getElementById('volumeIcon'),
                volumeFill: document.getElementById('volumeFill'),
                toggleIcon: this.playerElement.querySelector('.toggle-icon')
            };
        }
        
        setupEventListeners() {
            // Window events
            window.addEventListener('beforeunload', () => {
                this.savePlayerState();
            });
            
            // Page visibility for performance optimization  
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    this.pauseVisualEffects();
                } else {
                    this.resumeVisualEffects();
                }
            });
            
            // Restore player state on load
            this.loadPlayerState();
        }
        
        setupAudioHandlers() {
            const audio = this.audio;
            
            // Core audio events
            audio.addEventListener('loadeddata', () => {
                this.updateTimeDisplay();
                console.log('🎵 Track loaded:', this.getCurrentTrack().title);
            });
            
            audio.addEventListener('canplaythrough', () => {
                this.updateTimeDisplay();
            });
            
            audio.addEventListener('timeupdate', () => {
                this.updateProgress();
            });
            
            audio.addEventListener('ended', () => {
                this.handleTrackEnd();
            });
            
            audio.addEventListener('error', (e) => {
                console.error('🚨 Audio error:', e);
                this.showNotification('Audio error - trying next track', 'error');
                this.nextTrack();
            });
            
            audio.addEventListener('play', () => {
                this.isPlaying = true;
                this.updatePlayButton();
                this.startProgressUpdates();
                this.showNotification(`Playing: ${this.getCurrentTrack().title}`, 'success');
            });
            
            audio.addEventListener('pause', () => {
                this.isPlaying = false;
                this.updatePlayButton();
                this.stopProgressUpdates();
            });
            
            // Set initial volume
            audio.volume = this.volume;
        }
        
        setupKeyboardShortcuts() {
            document.addEventListener('keydown', (e) => {
                // Skip if typing in input fields
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
                
                const action = MUSIC_CONFIG.SHORTCUTS[e.code];
                if (action && this[action]) {
                    e.preventDefault();
                    this[action]();
                }
            });
        }
        
        setupVisualEffects() {
            // Add glow effect when playing
            const addGlowEffect = () => {
                if (this.isPlaying) {
                    this.elements.artwork.style.boxShadow = '0 0 20px rgba(0, 212, 255, 0.6)';
                } else {
                    this.elements.artwork.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
                }
            };
            
            setInterval(addGlowEffect, 500);
        }
        
        // 🎵 Core Player Functions
        loadTrack(index) {
            if (index < 0 || index >= this.playlist.length) return;
            
            const track = this.playlist[index];
            this.currentTrackIndex = index;
            
            // Stop current playback
            this.audio.pause();
            this.audio.currentTime = 0;
            
            // Load new track
            this.audio.src = track.src;
            
            // Update UI
            this.elements.artwork.textContent = track.artwork || '🎵';
            this.elements.title.textContent = track.title;
            this.elements.artist.textContent = track.artist;
            
            // Reset progress
            this.elements.progressFill.style.width = '0%';
            
            console.log('🎼 Loaded track:', track.title);
        }
        
        togglePlay() {
            if (this.isPlaying) {
                this.pause();
            } else {
                this.play();
            }
        }
        
        play() {
            const playPromise = this.audio.play();
            
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    // Playback started successfully
                }).catch(error => {
                    console.error('🚨 Play error:', error);
                    this.showNotification('Playback failed - check audio source', 'error');
                });
            }
        }
        
        pause() {
            this.audio.pause();
        }
        
        nextTrack() {
            let nextIndex;
            
            if (this.isShuffled) {
                nextIndex = Math.floor(Math.random() * this.playlist.length);
            } else {
                nextIndex = (this.currentTrackIndex + 1) % this.playlist.length;
            }
            
            this.loadTrack(nextIndex);
            
            if (this.isPlaying) {
                this.play();
            }
        }
        
        previousTrack() {
            let prevIndex;
            
            if (this.isShuffled) {
                prevIndex = Math.floor(Math.random() * this.playlist.length);
            } else {
                prevIndex = this.currentTrackIndex - 1;
                if (prevIndex < 0) prevIndex = this.playlist.length - 1;
            }
            
            this.loadTrack(prevIndex);
            
            if (this.isPlaying) {
                this.play();
            }
        }
        
        seekTo(event) {
            const progressBar = event.currentTarget;
            const rect = progressBar.getBoundingClientRect();
            const percent = (event.clientX - rect.left) / rect.width;
            const newTime = percent * this.audio.duration;
            
            if (isFinite(newTime)) {
                this.audio.currentTime = newTime;
                this.showNotification(`Seeked to ${this.formatTime(newTime)}`, 'info');
            }
        }
        
        setVolume(event) {
            const volumeBar = event.currentTarget;
            const rect = volumeBar.getBoundingClientRect();
            const percent = (event.clientX - rect.left) / rect.width;
            
            this.volume = Math.max(0, Math.min(1, percent));
            this.audio.volume = this.volume;
            this.isMuted = false;
            
            this.updateVolumeDisplay();
            this.showNotification(`Volume: ${Math.round(this.volume * 100)}%`, 'info');
        }
        
        toggleMute() {
            this.isMuted = !this.isMuted;
            this.audio.volume = this.isMuted ? 0 : this.volume;
            this.updateVolumeDisplay();
            
            this.showNotification(this.isMuted ? 'Muted' : 'Unmuted', 'info');
        }
        
        volumeUp() {
            this.volume = Math.min(1, this.volume + 0.1);
            this.audio.volume = this.volume;
            this.updateVolumeDisplay();
            this.showNotification(`Volume: ${Math.round(this.volume * 100)}%`, 'info');
        }
        
        volumeDown() {
            this.volume = Math.max(0, this.volume - 0.1);
            this.audio.volume = this.volume;
            this.updateVolumeDisplay();
            this.showNotification(`Volume: ${Math.round(this.volume * 100)}%`, 'info');
        }
        
        toggleLoop() {
            this.isLooping = !this.isLooping;
            this.audio.loop = this.isLooping;
            this.showNotification(this.isLooping ? 'Loop enabled' : 'Loop disabled', 'info');
        }
        
        toggleShuffle() {
            this.isShuffled = !this.isShuffled;
            this.showNotification(this.isShuffled ? 'Shuffle enabled' : 'Shuffle disabled', 'info');
        }
        
        toggleMinimize() {
            this.isMinimized = !this.isMinimized;
            this.playerElement.classList.toggle('minimized', this.isMinimized);
            this.elements.toggleIcon.textContent = this.isMinimized ? '+' : '−';
            
            this.showNotification(this.isMinimized ? 'Player minimized' : 'Player expanded', 'info');
        }
        
        // 🔄 Update Functions
        updatePlayButton() {
            const playIcon = this.isPlaying ? '⏸' : '▶';
            this.elements.playPauseBtn.querySelector('span').textContent = playIcon;
        }
        
        updateProgress() {
            if (!isFinite(this.audio.duration)) return;
            
            const percent = (this.audio.currentTime / this.audio.duration) * 100;
            this.elements.progressFill.style.width = `${percent}%`;
            this.updateTimeDisplay();
        }
        
        updateTimeDisplay() {
            const current = this.formatTime(this.audio.currentTime || 0);
            const total = this.formatTime(this.audio.duration || 0);
            
            this.elements.currentTime.textContent = current;
            this.elements.totalTime.textContent = total;
        }
        
        updateVolumeDisplay() {
            const volumePercent = this.isMuted ? 0 : this.volume * 100;
            this.elements.volumeFill.style.width = `${volumePercent}%`;
            
            // Update volume icon
            if (this.isMuted || this.volume === 0) {
                this.elements.volumeIcon.textContent = '🔇';
            } else if (this.volume < 0.5) {
                this.elements.volumeIcon.textContent = '🔉';
            } else {
                this.elements.volumeIcon.textContent = '🔊';
            }
        }
        
        startProgressUpdates() {
            this.stopProgressUpdates();
            this.progressUpdateTimer = setInterval(() => {
                this.updateProgress();
            }, MUSIC_CONFIG.PROGRESS_UPDATE_RATE);
        }
        
        stopProgressUpdates() {
            if (this.progressUpdateTimer) {
                clearInterval(this.progressUpdateTimer);
                this.progressUpdateTimer = null;
            }
        }
        
        // 🛠 Utility Functions
        formatTime(seconds) {
            if (!isFinite(seconds) || seconds < 0) return '0:00';
            
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        }
        
        getCurrentTrack() {
            return this.playlist[this.currentTrackIndex] || {};
        }
        
        handleTrackEnd() {
            if (this.isLooping) {
                this.audio.currentTime = 0;
                this.play();
            } else {
                this.nextTrack();
            }
        }
        
        showNotification(message, type = 'info') {
            // Create notification element
            const notification = document.createElement('div');
            notification.className = `music-notification notification-${type}`;
            notification.textContent = message;
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: rgba(0, 33, 64, 0.95);
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                border: 1px solid rgba(0, 212, 255, 0.3);
                z-index: 10000;
                font-size: 14px;
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
                animation: slideInNotification 0.3s ease;
                max-width: 300px;
                word-wrap: break-word;
            `;
            
            // Add styles for different types
            if (type === 'error') {
                notification.style.borderColor = 'rgba(255, 99, 99, 0.5)';
                notification.style.background = 'rgba(64, 0, 0, 0.95)';
            } else if (type === 'success') {
                notification.style.borderColor = 'rgba(99, 255, 99, 0.5)';
                notification.style.background = 'rgba(0, 64, 0, 0.95)';
            }
            
            document.body.appendChild(notification);
            
            // Auto remove after 3 seconds
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.style.animation = 'slideOutNotification 0.3s ease forwards';
                    setTimeout(() => notification.remove(), 300);
                }
            }, 3000);
        }
        
        // 💾 State Management
        savePlayerState() {
            const state = {
                currentTrackIndex: this.currentTrackIndex,
                volume: this.volume,
                isMuted: this.isMuted,
                isLooping: this.isLooping,
                isShuffled: this.isShuffled,
                isMinimized: this.isMinimized,
                currentTime: this.audio.currentTime
            };
            
            localStorage.setItem('smartMusicPlayerState', JSON.stringify(state));
        }
        
        loadPlayerState() {
            try {
                const savedState = localStorage.getItem('smartMusicPlayerState');
                if (savedState) {
                    const state = JSON.parse(savedState);
                    
                    this.volume = state.volume || MUSIC_CONFIG.DEFAULT_VOLUME;
                    this.isMuted = state.isMuted || false;
                    this.isLooping = state.isLooping || false;
                    this.isShuffled = state.isShuffled || false;
                    this.isMinimized = state.isMinimized || false;
                    
                    // Apply restored state
                    this.audio.volume = this.isMuted ? 0 : this.volume;
                    this.audio.loop = this.isLooping;
                    
                    if (state.isMinimized) {
                        this.toggleMinimize();
                    }
                    
                    this.updateVolumeDisplay();
                    
                    console.log('🔄 Player state restored');
                }
            } catch (error) {
                console.error('🚨 Failed to load player state:', error);
            }
        }
        
        pauseVisualEffects() {
            // Pause resource-intensive effects when tab is hidden
        }
        
        resumeVisualEffects() {
            // Resume effects when tab becomes visible
        }
    }
    
    // 🎪 Add notification animations
    const notificationCSS = `
        @keyframes slideInNotification {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOutNotification {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    
    const style = document.createElement('style');
    style.textContent = notificationCSS;
    document.head.appendChild(style);
    
    // 🚀 Initialize Smart Music Player
    window.addEventListener('load', () => {
        setTimeout(() => {
            window.smartPlayer = new SmartMusicPlayer();
            console.log('🎼✨ Smart Music Player ready! Use keyboard shortcuts: Space, ←→, ↑↓, M, L, S');
        }, 1500);
    });
    
    console.log('🎵 Smart Music Player system loaded!');
    
})();