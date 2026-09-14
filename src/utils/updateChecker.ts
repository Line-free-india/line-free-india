/**
 * Auto-update checker for Line Free India
 * Checks for new versions and prompts users to reload
 */

const APP_VERSION = '1.0.0'; // Update this with each release
const CHECK_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes

let updateCheckInterval: NodeJS.Timeout | null = null;

/**
 * Register service worker for auto-updates (Managed by VitePWA now)
 */
export function registerServiceWorker() {
  // VitePWA handles this automatically, no manual registration needed.
}

/**
 * Show update notification to user
 */
function showUpdateNotification() {
  const notification = document.createElement('div');
  notification.id = 'update-notification';
  notification.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 16px 24px;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      z-index: 99999;
      display: flex;
      align-items: center;
      gap: 12px;
      font-family: 'Inter', sans-serif;
      animation: slideDown 0.3s ease-out;
    ">
      <span style="font-size: 24px;">🎉</span>
      <div style="flex: 1;">
        <p style="margin: 0; font-weight: 700; font-size: 14px;">New Update Available!</p>
        <p style="margin: 0; font-size: 12px; opacity: 0.9;">Click to get the latest features</p>
      </div>
      <button id="update-btn" style="
        background: white;
        color: #667eea;
        border: none;
        padding: 8px 16px;
        border-radius: 8px;
        font-weight: 700;
        font-size: 12px;
        cursor: pointer;
        transition: transform 0.2s;
      ">
        Update Now
      </button>
      <button id="dismiss-btn" style="
        background: transparent;
        color: white;
        border: none;
        padding: 8px;
        cursor: pointer;
        font-size: 20px;
        line-height: 1;
      ">
        ×
      </button>
    </div>
    <style>
      @keyframes slideDown {
        from {
          transform: translateX(-50%) translateY(-100%);
          opacity: 0;
        }
        to {
          transform: translateX(-50%) translateY(0);
          opacity: 1;
        }
      }
      #update-btn:hover {
        transform: scale(1.05);
      }
      #update-btn:active {
        transform: scale(0.95);
      }
    </style>
  `;
  
  document.body.appendChild(notification);
  
  // Update button click
  document.getElementById('update-btn')?.addEventListener('click', () => {
    // Tell service worker to skip waiting
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
    }
    
    // Clear all caches
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => caches.delete(name));
      });
    }
    
    // Reload the page
    window.location.reload();
  });
  
  // Dismiss button click
  document.getElementById('dismiss-btn')?.addEventListener('click', () => {
    notification.remove();
  });
}

/**
 * Check for updates from GitHub
 */
export async function checkForUpdates() {
  try {
    // Check if there's a new deployment
    const response = await fetch('/version.json?t=' + Date.now(), {
      cache: 'no-cache'
    });
    
    if (response.ok) {
      const data = await response.json();
      const latestVersion = data.version;
      
      if (latestVersion !== APP_VERSION) {
        console.log('[Update] New version available:', latestVersion);
        showUpdateNotification();
      }
    }
  } catch (error) {
    console.error('[Update] Failed to check for updates:', error);
  }
}

/**
 * Start periodic update checks
 */
export function startUpdateChecker() {
  // Check immediately
  checkForUpdates();
  
  // Check periodically
  if (updateCheckInterval) {
    clearInterval(updateCheckInterval);
  }
  
  updateCheckInterval = setInterval(() => {
    checkForUpdates();
  }, CHECK_INTERVAL);
}

/**
 * Stop update checker
 */
export function stopUpdateChecker() {
  if (updateCheckInterval) {
    clearInterval(updateCheckInterval);
    updateCheckInterval = null;
  }
}
