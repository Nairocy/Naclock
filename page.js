let menuStack = [];

let tomatoInterval;
let tomatoTimer = 0;
let currentTomatoCount = 0;
let totalTomatoes = 4;
let focusTime = 25;
let restTime = 5;
let isFocusPhase = true;
let isPaused = true;
let playSound = true;
let audioPlayer = new Audio();
let audioPreloaded = false;
let audioFileUrl = 'res/music/music.ogg';
let soundPlayed = false;
let vibrateEnabled = true;

let wakeLock = null;
let isWakeLockSupported = 'wakeLock' in navigator;

let db = null;
const DB_NAME = 'NaaClockDB';
const DB_VERSION = 1;
const SETTINGS_STORE = 'settings';
const AUDIO_STORE = 'audio';
const IMAGE_STORE = 'images';

let clockNumbersCreated = false;

let last = {
    seconds: null,
    minutes: null,
    hours: null
};

let showSeconds = true;

function initDB() {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error('数据库初始化超时'));
        }, 5000);
        
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => {
            clearTimeout(timeout);
            reject(request.error);
        };
        
        request.onsuccess = () => {
            clearTimeout(timeout);
            db = request.result;
            resolve(db);
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
                db.createObjectStore(SETTINGS_STORE, { keyPath: 'id' });
            }
            
            if (!db.objectStoreNames.contains(AUDIO_STORE)) {
                db.createObjectStore(AUDIO_STORE, { keyPath: 'id' });
            }
            
            if (!db.objectStoreNames.contains(IMAGE_STORE)) {
                db.createObjectStore(IMAGE_STORE, { keyPath: 'id' });
            }
        };
        
        request.onblocked = () => {
            clearTimeout(timeout);
            reject(new Error('数据库被其他页面阻塞'));
        };
    });
}

async function saveSettingsToDB(settings) {
    if (!db) await initDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([SETTINGS_STORE], 'readwrite');
        const store = transaction.objectStore(SETTINGS_STORE);
        const request = store.put({ id: 'clockSettings', data: settings });
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
}

async function loadSettingsFromDB() {
    if (!db) await initDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([SETTINGS_STORE], 'readonly');
        const store = transaction.objectStore(SETTINGS_STORE);
        const request = store.get('clockSettings');
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result ? request.result.data : null);
    });
}

async function saveAudioFile(audioBlob) {
    if (!db) await initDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([AUDIO_STORE], 'readwrite');
        const store = transaction.objectStore(AUDIO_STORE);
        const request = store.put({ id: 'tomatoAudio', data: audioBlob });
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
}

async function loadAudioFile() {
    if (!db) await initDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([AUDIO_STORE], 'readonly');
        const store = transaction.objectStore(AUDIO_STORE);
        const request = store.get('tomatoAudio');
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            if (request.result) {
                const audioBlob = request.result.data;
                const audioUrl = URL.createObjectURL(audioBlob);
                resolve(audioUrl);
            } else {
                resolve(null);
            }
        };
    });
}

async function saveBackgroundImage(imageBlob) {
    if (!db) await initDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([IMAGE_STORE], 'readwrite');
        const store = transaction.objectStore(IMAGE_STORE);
        const request = store.put({ id: 'backgroundImage', data: imageBlob });
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
}

async function loadBackgroundImage() {
    if (!db) await initDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([IMAGE_STORE], 'readonly');
        const store = transaction.objectStore(IMAGE_STORE);
        const request = store.get('backgroundImage');
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            if (request.result) {
                const imageBlob = request.result.data;
                const imageUrl = URL.createObjectURL(imageBlob);
                resolve(imageUrl);
            } else {
                resolve(null);
            }
        };
    });
}

async function saveTomatoStateToDB(state) {
    if (!db) await initDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([SETTINGS_STORE], 'readwrite');
        const store = transaction.objectStore(SETTINGS_STORE);
        const request = store.put({ id: 'tomatoState', data: state });
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
}

async function loadTomatoStateFromDB() {
    if (!db) await initDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([SETTINGS_STORE], 'readonly');
        const store = transaction.objectStore(SETTINGS_STORE);
        const request = store.get('tomatoState');
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result ? request.result.data : null);
    });
}

async function saveNotificationSettingsToDB(notifications) {
    if (!db) await initDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([SETTINGS_STORE], 'readwrite');
        const store = transaction.objectStore(SETTINGS_STORE);
        const request = store.put({ 
            id: 'notificationSettings', 
            data: notifications 
        });
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
}

async function loadNotificationSettingsFromDB() {
    if (!db) await initDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([SETTINGS_STORE], 'readonly');
        const store = transaction.objectStore(SETTINGS_STORE);
        const request = store.get('notificationSettings');
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            if (request.result) {
                resolve(request.result.data);
            } else {
                resolve(null);
            }
        };
    });
}

async function requestWakeLock() {
    if (!isWakeLockSupported) {
        
        if (typeof plus !== 'undefined' && plus.device && plus.device.setWakelock) {
            try {
                plus.device.setWakelock(true);
                console.log("使用HBuilderX屏幕常亮功能");
                return;
            } catch (err) {
                console.warn("HBuilderX屏幕常亮设置失败:", err);
            }
        }
        return;
    }
    
    try {
        wakeLock = await navigator.wakeLock.request('screen');
        
        wakeLock.addEventListener('release', () => {
            if (document.visibilityState === 'visible') {
                setTimeout(requestWakeLock, 1000);
            }
        });
    } catch (err) {
        setTimeout(requestWakeLock, 5000);
    }
}

function releaseWakeLock() {
    if (wakeLock !== null) {
        wakeLock.release();
        wakeLock = null;
    } else if (typeof plus !== 'undefined' && plus.device && plus.device.setWakelock) {
        
        try {
            plus.device.setWakelock(false);
        } catch (err) {
            console.warn("关闭HBuilderX屏幕常亮失败:", err);
        }
    }
}

function openNairocyWebsite() {
    
    if (typeof plus !== 'undefined' && plus.runtime && plus.runtime.openURL) {
        plus.runtime.openURL("https://nairocy.com");
        
        if (plus.nativeUI && plus.nativeUI.toast) {
            plus.nativeUI.toast("正在打开浏览器...");
        }
    } 
    
    else if (typeof websApp !== 'undefined' && websApp.openURLInBrowser) {
        websApp.openURLInBrowser("https://nairocy.com");
    } 
    
    else {
        window.open("https://nairocy.com", "_blank");
    }
}

function handleBackButton() {
    
    if (typeof plus !== 'undefined' && plus.runtime && plus.runtime.quit) {
        plus.runtime.quit();
    } 
    
    else if (typeof websApp !== 'undefined' && websApp.exitApp) {
        websApp.exitApp();
    } 
    
    else {
        window.close();
    }
}

function initBackButtonHandler() {
    window.addEventListener('popstate', function(event) {
        handleBackButton();
        history.pushState(null, null, document.URL);
    });

    history.pushState(null, null, document.URL);
}

let tomatoContainer, tomatoDisplay, tomatoCountDisplay, tomatoControlBtn, tomatoPlayIcon;
let tomatoNotification, notificationMessage, notificationConfirm, tomatoCountSlider;
let focusTimeSlider, restTimeSlider, playSoundCheckbox, openTomatoSettings, closeTomatoSettings;
let tomatoSettings, showTomatoCheckbox, tomatoCountValue, focusTimeValue, restTimeValue;
let audioUpload, audioFileName;
let timeDisplay, dateDisplay, weekDisplay, sloganDisplay, dateWeekContainer, menuButton;
let menuOverlay, bgPreview, largeBgPreview, opacitySlider, opacityValue, timeFontSelect;
let clockContainer, digitalTime, mainContainer, fullscreenHint;
let fontSizeSlider, fontSizeValue, clockNoneRadio, clockLeftRadio, clockRightRadio;
let showDateCheckbox, showYearCheckbox, showWeekCheckbox, showMonthDayCheckbox, showSloganCheckbox;
let colorArea, colorPointer, currentColorElem, hSlider, sSlider, vSlider, hValue, sValue, vValue;
let resetColorButton, confirmColorButton, bgFileInput, resetBgButton, applyBgButton;
let fileTooLarge, closeFileError, sloganInput, resetSloganBtn, confirmSloganBtn;
let openSloganPicker, closeSloganPicker, sloganPicker;
let mainMenu, displaySettings, colorSettings, bgSettings, colorPicker, bgPicker;
let openDisplaySettings, openColorSettings, openBgSettings, openBgPicker;
let closeMainMenu, closeDisplaySettings, closeColorSettings, closeBgSettings;
let closeColorPicker, closeBgPicker;
let openMoreSettings, moreSettings, closeMoreSettings;
let openHelpQues, openVersionCheck, versionInfoModal, closeVersionModal;
let vibrateSwitch;
let openNotificationSettings, closeNotificationPicker, notificationPicker;
let phaseCompleteNotificationInput, allCompleteNotificationInput, restEndNotificationInput;
let resetNotificationBtn, confirmNotificationBtn;

let openClockPositionPicker, closeClockPositionPicker, clockPositionPicker;
let openFontPicker, closeFontPicker, fontPicker;
let clockPositionStatus, fontStatus;

let showSecondsCheckbox;

const weekDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const colors = {
    time: "#FFFFFF",
    date: "#a3d5ff",
    week: "#a3d5ff",
    slogan: "#a3d5ff",
    background: "#12121e"
};

const defaultFont = 'Arial, sans-serif';
let currentFont = defaultFont;

let currentColorTarget = null;
let isDragging = false;
let targetInitialColor = null;
let activeMenu = null;
let selectedBgImage = 'res/pic/nano.webp';
let sloganText = "https://nairocy.com";
let clockPosition = "none";

let phaseCompleteText = "本次专注已结束！剩余番茄钟：{X}个，接下来是绿色休息时间～";
let allCompleteText = "太棒了！已完成所有番茄钟任务！";
let restEndText = "休息结束，请点击开始继续专注！";

function createClockNumbers() {
    if (clockNumbersCreated) return;
    
    const numbersArray = ['XII','I','II','III','IV','V','VI','VII','VIII','IX','X','XI'];
    const clock = document.querySelector('.clock');
    const clockRadius = 100;
    
    const existingNumbers = document.querySelectorAll('.number');
    existingNumbers.forEach(num => num.remove());
    
    numbersArray.forEach((num, index) => {
        const number = document.createElement('div');
        number.className = 'number';
        number.textContent = num;
        
        const angle = index * 30 - 90;
        const textRadius = clockRadius - 56;
        const radian = angle * Math.PI / 180;
        
        const x = Math.cos(radian) * textRadius;
        const y = Math.sin(radian) * textRadius;
        
        number.style.cssText = `
            left: ${50 + x}%;
            top: ${50 + y}%;
            transform: rotate(${angle + 90}deg);
        `;
        clock.appendChild(number);
    });
    
    clockNumbersCreated = true;
}

function updateAnalogClock(now) {
    if (clockPosition === "none") return;
    
    const ms = now.getMilliseconds();
    const seconds = now.getSeconds() + ms/1000;
    const minutes = now.getMinutes() + seconds/60;
    const hours = (now.getHours() % 12) + minutes/60;
    const angles = {
        seconds: seconds * 6,
        minutes: minutes * 6,
        hours: hours * 30
    };
    
    angles.seconds = smoothAngle(angles.seconds, last.seconds);
    angles.minutes = smoothAngle(angles.minutes, last.minutes);
    angles.hours = smoothAngle(angles.hours, last.hours);
    
    document.getElementById('second').style.transform = `rotate(${angles.seconds}deg)`;
    document.getElementById('minute').style.transform = `rotate(${angles.minutes}deg)`;
    document.getElementById('hour').style.transform = `rotate(${angles.hours}deg)`;
    
    last = angles;
}

function smoothAngle(current, lastValue) {
    if (lastValue === null) return current;
    let delta = current - lastValue;
    delta = ((delta % 360) + 360) % 360;
    if (delta > 180) {
        delta -= 360;
    }
    return lastValue + delta;
}

function initDOMElements() {
    tomatoContainer = document.getElementById('tomato-container');
    tomatoDisplay = document.getElementById('tomato-display');
    tomatoCountDisplay = document.getElementById('tomato-count-display');
    tomatoControlBtn = document.getElementById('tomato-control-btn');
    tomatoPlayIcon = document.getElementById('tomato-play-icon');
    tomatoNotification = document.getElementById('tomato-notification');
    notificationMessage = tomatoNotification.querySelector('.notification-message');
    notificationConfirm = tomatoNotification.querySelector('.notification-confirm');
    tomatoCountSlider = document.getElementById('tomato-count-slider');
    focusTimeSlider = document.getElementById('focus-time-slider');
    restTimeSlider = document.getElementById('rest-time-slider');
    playSoundCheckbox = document.getElementById('play-sound');
    openTomatoSettings = document.getElementById('open-tomato-settings');
    closeTomatoSettings = document.getElementById('close-tomato-settings');
    tomatoSettings = document.getElementById('tomato-settings');
    showTomatoCheckbox = document.getElementById('show-tomato');
    tomatoCountValue = document.getElementById('tomato-count-value');
    focusTimeValue = document.getElementById('focus-time-value');
    restTimeValue = document.getElementById('rest-time-value');
    audioUpload = document.getElementById('audio-upload');
    audioFileName = document.getElementById('audio-file-name');
    vibrateSwitch = document.getElementById('vibrate-switch');

    timeDisplay = document.getElementById('time-display');
    dateDisplay = document.getElementById('date-display');
    weekDisplay = document.getElementById('week-display');
    sloganDisplay = document.getElementById('slogan-container');
    dateWeekContainer = document.getElementById('date-week-container');
    menuButton = document.getElementById('menu-button');
    menuOverlay = document.getElementById('menu-overlay');
    bgPreview = document.getElementById('bg-preview');
    largeBgPreview = document.getElementById('large-bg-preview');
    opacitySlider = document.getElementById('opacity-slider');
    opacityValue = document.getElementById('opacity-value');
    clockContainer = document.querySelector('.clock-container');
    digitalTime = document.querySelector('.digital-time');
    mainContainer = document.querySelector('.main-container');
    fullscreenHint = document.getElementById('fullscreen-hint');

    fontSizeSlider = document.getElementById('font-size-slider');
    fontSizeValue = document.getElementById('font-size-value');

    showDateCheckbox = document.getElementById('show-date');
    showYearCheckbox = document.getElementById('show-year');
    showWeekCheckbox = document.getElementById('show-week');
    showMonthDayCheckbox = document.getElementById('show-month-day');
    showSloganCheckbox = document.getElementById('show-slogan');

    showSecondsCheckbox = document.getElementById('show-seconds');

    colorArea = document.getElementById('color-area');
    colorPointer = document.getElementById('color-pointer');
    currentColorElem = document.getElementById('current-color');
    hSlider = document.getElementById('h-slider');
    sSlider = document.getElementById('s-slider');
    vSlider = document.getElementById('v-slider');
    hValue = document.getElementById('h-value');
    sValue = document.getElementById('s-value');
    vValue = document.getElementById('v-value');
    resetColorButton = document.getElementById('reset-color');
    confirmColorButton = document.getElementById('confirm-color');

    bgFileInput = document.getElementById('bg-file');
    resetBgButton = document.getElementById('reset-bg');
    applyBgButton = document.getElementById('apply-bg');

    sloganInput = document.getElementById('slogan-input');
    resetSloganBtn = document.getElementById('reset-slogan');
    confirmSloganBtn = document.getElementById('confirm-slogan');
    openSloganPicker = document.getElementById('open-slogan-picker');
    closeSloganPicker = document.getElementById('close-slogan-picker');
    sloganPicker = document.getElementById('slogan-picker');

    mainMenu = document.getElementById('main-menu');
    displaySettings = document.getElementById('display-settings');
    colorSettings = document.getElementById('color-settings');
    bgSettings = document.getElementById('bg-settings');
    colorPicker = document.getElementById('color-picker');
    bgPicker = document.getElementById('bg-picker');

    openDisplaySettings = document.getElementById('open-display-settings');
    openColorSettings = document.getElementById('open-color-settings');
    openBgSettings = document.getElementById('open-bg-settings');
    openBgPicker = document.getElementById('open-bg-picker');

    closeMainMenu = document.getElementById('close-main-menu');
    closeDisplaySettings = document.getElementById('close-display-settings');
    closeColorSettings = document.getElementById('close-color-settings');
    closeBgSettings = document.getElementById('close-bg-settings');
    closeColorPicker = document.getElementById('close-color-picker');
    closeBgPicker = document.getElementById('close-bg-picker');

    openMoreSettings = document.getElementById('open-more-settings');
    moreSettings = document.getElementById('more-settings');
    closeMoreSettings = document.getElementById('close-more-settings');
    
    openHelpQues = document.getElementById('open-help-ques');
    openVersionCheck = document.getElementById('open-version-check');
    versionInfoModal = document.getElementById('version-info-modal');
    closeVersionModal = document.getElementById('close-version-modal');
    
    openNotificationSettings = document.getElementById('open-notification-settings');
    closeNotificationPicker = document.getElementById('close-notification-picker');
    notificationPicker = document.getElementById('notification-picker');
    phaseCompleteNotificationInput = document.getElementById('phase-complete-notification');
    allCompleteNotificationInput = document.getElementById('all-complete-notification');
    restEndNotificationInput = document.getElementById('rest-end-notification');
    resetNotificationBtn = document.getElementById('reset-notification');
    confirmNotificationBtn = document.getElementById('confirm-notification');
    
    openClockPositionPicker = document.getElementById('open-clock-position-picker');
    closeClockPositionPicker = document.getElementById('close-clock-position-picker');
    clockPositionPicker = document.getElementById('clock-position-picker');
    clockPositionStatus = document.getElementById('clock-position-status');
    
    openFontPicker = document.getElementById('open-font-picker');
    closeFontPicker = document.getElementById('close-font-picker');
    fontPicker = document.getElementById('font-picker');
    fontStatus = document.getElementById('font-status');
}

function updateColorPreviews() {
    document.querySelectorAll('.color-option').forEach(option => {
        const target = option.dataset.target;
        const colorPreview = option.querySelector('.color-preview');
        if (colorPreview && colors[target]) {
            colorPreview.style.backgroundColor = colors[target];
        }
    });
}

async function initTomatoTimer() {
    try {
        await initDB();
        
        const savedSettings = await loadSettingsFromDB();
        if (savedSettings && savedSettings.tomatoSettings) {
            const settings = savedSettings.tomatoSettings;
            totalTomatoes = settings.totalTomatoes || 4;
            focusTime = settings.focusTime || 25;
            restTime = settings.restTime || 5;
            playSound = settings.playSound !== undefined ? settings.playSound : true;
            vibrateEnabled = settings.vibrateEnabled !== undefined ? settings.vibrateEnabled : true;
            showTomatoCheckbox.checked = settings.showTomato !== undefined ? settings.showTomato : true;
            
            updateTomatoVisibility();
        }
        
        const tomatoState = await loadTomatoStateFromDB();
        if (tomatoState) {
            currentTomatoCount = tomatoState.currentTomatoCount || 0;
            tomatoTimer = tomatoState.tomatoTimer || focusTime * 60;
            isFocusPhase = tomatoState.isFocusPhase !== undefined ? tomatoState.isFocusPhase : true;
            isPaused = tomatoState.isPaused !== undefined ? tomatoState.isPaused : true;
        } else {
            resetTimer();
        }
        
        const userAudioUrl = await loadAudioFile();
        if (userAudioUrl) {
            audioFileUrl = userAudioUrl;
            audioFileName.textContent = '已选择音频';
        } else {
            audioFileUrl = 'res/music/music.ogg';
            audioFileName.textContent = '使用默认音频';
        }
        
        try {
            const notificationSettings = await loadNotificationSettingsFromDB();
            if (notificationSettings) {
                phaseCompleteText = notificationSettings.phaseComplete || phaseCompleteText;
                allCompleteText = notificationSettings.allComplete || allCompleteText;
                restEndText = notificationSettings.restEnd || restEndText;
            }
        } catch (e) {
            console.log("加载通知设置失败:", e);
        }
        
        tomatoCountSlider.value = totalTomatoes;
        focusTimeSlider.value = focusTime;
        restTimeSlider.value = restTime;
        playSoundCheckbox.checked = playSound;
        vibrateSwitch.checked = vibrateEnabled;
        tomatoCountDisplay.textContent = `${currentTomatoCount}/${totalTomatoes}`;
        
        tomatoCountValue.textContent = totalTomatoes;
        focusTimeValue.textContent = focusTime;
        restTimeValue.textContent = restTime;
        
        updateDisplay();
        
        tomatoPlayIcon.className = isPaused ? "fas fa-play" : "fas fa-pause";
    } catch (error) {
        console.error("初始化番茄钟失败:", error);
        resetTimer();
    }
}

async function saveTomatoSettings() {
    try {
        const settings = await loadSettingsFromDB() || {};
        settings.tomatoSettings = {
            totalTomatoes: totalTomatoes,
            focusTime: focusTime,
            restTime: restTime,
            playSound: playSound,
            vibrateEnabled: vibrateEnabled,
            showTomato: showTomatoCheckbox.checked
        };
        await saveSettingsToDB(settings);
    } catch (error) {
        console.error("保存番茄设置失败:", error);
    }
}

async function saveTomatoState() {
    try {
        const state = {
            currentTomatoCount: currentTomatoCount,
            tomatoTimer: tomatoTimer,
            isFocusPhase: isFocusPhase,
            isPaused: isPaused
        };
        await saveTomatoStateToDB(state);
    } catch (error) {
        console.error("保存番茄状态失败:", error);
    }
}

function startTimer() {
    if (isPaused) {
        isPaused = false;
        tomatoPlayIcon.className = "fas fa-pause";
        soundPlayed = false;
        
        if (!audioPreloaded && playSound) {
            audioPlayer.src = audioFileUrl;
            audioPlayer.volume = 0;
            audioPlayer.loop = true;
            audioPlayer.play().then(() => {
                audioPlayer.pause();
                audioPlayer.currentTime = 0;
                audioPlayer.volume = 1;
                audioPreloaded = true;
            }).catch(e => {
                console.log("音频预加载失败:", e);
                audioPlayer.volume = 1;
            });
        }
        
        tomatoInterval = setInterval(async () => {
            if (tomatoTimer > 0) {
                tomatoTimer--;
                updateDisplay();
                await saveTomatoState();
            } else {
                clearInterval(tomatoInterval);
                nextPhase();
            }
        }, 1000);
    }
}

function pauseTimer() {
    isPaused = true;
    clearInterval(tomatoInterval);
    tomatoPlayIcon.className = "fas fa-play";
    saveTomatoState();
}

function resetTimer() {
    clearInterval(tomatoInterval);
    isPaused = true;
    tomatoPlayIcon.className = "fas fa-play";
    isFocusPhase = true;
    currentTomatoCount = 0;
    tomatoCountDisplay.textContent = `0/${totalTomatoes}`;
    
    tomatoTimer = focusTime * 60;
    updateDisplay();
    saveTomatoState();
}

async function nextPhase() {
    soundPlayed = false;
    
    if (isFocusPhase) {
        currentTomatoCount++;
        tomatoCountDisplay.textContent = `${currentTomatoCount}/${totalTomatoes}`;
        
        if (currentTomatoCount < totalTomatoes) {
            showNotification({ type: 'phaseComplete' }, true);
            
            isFocusPhase = false;
            tomatoTimer = restTime * 60;
            pauseTimer();
        } else {
            showNotification({ type: 'allComplete' }, true);
            resetTimer();
            return;
        }
    } else {
        showNotification({ type: 'restEnd' }, true);
        
        isFocusPhase = true;
        tomatoTimer = focusTime * 60;
        pauseTimer();
    }
    
    updateDisplay();
    await saveTomatoState();
}

function updateDisplay() {
    const minutes = Math.floor(tomatoTimer / 60);
    const seconds = tomatoTimer % 60;
    tomatoDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    if (isFocusPhase) {
        tomatoDisplay.style.color = '#ff6b6b';
        tomatoCountDisplay.style.color = '#a3d5ff';
    } else {
        tomatoDisplay.style.color = '#4ecdc4';
        tomatoCountDisplay.style.color = '#a3d5ff';
    }
}

function showNotification(message, playAudio = false) {
    let finalMessage = '';
    
    if (typeof message === 'object') {
        const type = message.type;
        
        switch(type) {
            case 'phaseComplete':
                const remaining = totalTomatoes - currentTomatoCount;
                finalMessage = phaseCompleteText.replace(/{X}/g, remaining);
                break;
            case 'allComplete':
                finalMessage = allCompleteText;
                break;
            case 'restEnd':
                finalMessage = restEndText;
                break;
            default:
                finalMessage = String(message);
        }
    } else {
        finalMessage = String(message);
    }
    
    notificationMessage.textContent = finalMessage;
    tomatoNotification.style.display = 'flex';

    if (vibrateEnabled) {
        try {
            
            if (typeof plus !== 'undefined' && plus.device && plus.device.vibrate) {
                plus.device.vibrate(2000);
                setTimeout(() => {
                    plus.device.vibrate(2000);
                }, 100);
            } 
            
            else if (navigator.vibrate) {
                navigator.vibrate([2000, 200, 2000]);
            }
        } catch (e) {
            console.log("震动功能不可用:", e);
        }
    }
    
    if (playAudio && playSound) {
        audioPlayer.src = audioFileUrl;
        audioPlayer.currentTime = 0;
        audioPlayer.loop = true;
        audioPlayer.play().catch(e => {
            console.log("播放音频失败:", e);
        });
    }
}

function hideNotification() {
    tomatoNotification.style.display = 'none';

    try {
        
        if (typeof plus !== 'undefined' && plus.device && plus.device.vibrate) {
            plus.device.vibrate(0);
        } 
        
        else if (navigator.vibrate) {
            navigator.vibrate(0);
        }
    } catch (e) {
        console.log("停止震动失败:", e);
    }

    audioPlayer.pause();
    audioPlayer.currentTime = 0;
}

function updateTomatoVisibility() {
    if (showTomatoCheckbox.checked) {
        tomatoContainer.style.display = 'flex';
    } else {
        tomatoContainer.style.display = 'none';
    }
}

function updateClockPositionStatus() {
    let statusText = "关闭";
    switch (clockPosition) {
        case "left": statusText = "左侧"; break;
        case "right": statusText = "右侧"; break;
    }
    clockPositionStatus.textContent = statusText;
}

function updateFontStatus() {
    const fontMap = {
        'Arial, sans-serif': '系统字体',
        "'Microsoft YaHei', sans-serif": '微软雅黑',
        "'SimHei', sans-serif": '纯正黑体',
        "'SimSun', serif": '标准宋体',
        "'Courier New', monospace": '等宽萌体',
        "'Times New Roman', serif": '衬线怡体'
    };
    fontStatus.textContent = fontMap[currentFont] || '系统字体';
}

async function saveSettings() {
    try {
        const currentSettings = await loadSettingsFromDB() || {};
        const settings = {
            ...currentSettings,
            colors: { ...colors },
            background: {
                image: selectedBgImage,
                opacity: parseFloat(opacitySlider.value)
            },
            display: {
                showSeconds: showSeconds, 
                showDate: showDateCheckbox.checked,
                showYear: showYearCheckbox.checked,
                showWeek: showWeekCheckbox.checked,
                showMonthDay: showMonthDayCheckbox.checked,
                showSlogan: showSloganCheckbox.checked,
                timeFont: currentFont,
                clockPosition: clockPosition,
                timeScale: parseFloat(fontSizeSlider.value)
            },
            sloganText: sloganText
        };
        
        await saveSettingsToDB(settings);
    } catch (error) {
        console.error("保存设置失败:", error);
    }
}

async function loadSettings() {
    try {
        const settings = await loadSettingsFromDB();
        if (!settings) {
            selectedBgImage = 'res/pic/nano.webp';
            updateBgPreview(selectedBgImage);
            applyColorSettings();
            return;
        }
        
        if (settings.colors) {
            colors.time = settings.colors.time || colors.time;
            colors.date = settings.colors.date || colors.date;
            colors.week = settings.colors.week || colors.week;
            colors.slogan = settings.colors.slogan || colors.slogan;
        }

        if (settings.background) {
            selectedBgImage = settings.background.image || 'res/pic/nano.webp';
            opacitySlider.value = settings.background.opacity || 1;
            updateOpacityValueText();
            document.documentElement.style.setProperty('--bg-opacity', opacitySlider.value);
            updateBgPreview(selectedBgImage);
        } else {
            selectedBgImage = 'res/pic/nano.webp';
            updateBgPreview(selectedBgImage);
        }
        
        if (settings.display) {
            
            showSeconds = settings.display.showSeconds !== undefined ? settings.display.showSeconds : true;
            if (showSecondsCheckbox) {
                showSecondsCheckbox.checked = showSeconds;
            }
            
            showDateCheckbox.checked = settings.display.showDate ?? true;
            showYearCheckbox.checked = settings.display.showYear ?? true;
            showWeekCheckbox.checked = settings.display.showWeek ?? true;
            showMonthDayCheckbox.checked = settings.display.showMonthDay ?? true;
            showSloganCheckbox.checked = settings.display.showSlogan ?? true;
            currentFont = settings.display.timeFont || defaultFont;
            clockPosition = settings.display.clockPosition || "none";
          
            if (settings.display.timeScale) {
                fontSizeSlider.value = settings.display.timeScale;
                updateFontSizeValue();
                document.documentElement.style.setProperty('--time-scale', settings.display.timeScale);
            }
            
            updateClockPosition();
            updateFontStatus();
        }
       
        if (settings.sloganText) {
            sloganText = settings.sloganText;
            sloganDisplay.textContent = sloganText;
        }
        
        if (settings.tomatoSettings && settings.tomatoSettings.vibrateEnabled !== undefined) {
            vibrateEnabled = settings.tomatoSettings.vibrateEnabled;
            if (vibrateSwitch) {
                vibrateSwitch.checked = vibrateEnabled;
            }
        }
        
        try {
            const notificationSettings = await loadNotificationSettingsFromDB();
            if (notificationSettings) {
                phaseCompleteText = notificationSettings.phaseComplete || phaseCompleteText;
                allCompleteText = notificationSettings.allComplete || allCompleteText;
                restEndText = notificationSettings.restEnd || restEndText;
            }
        } catch (e) {
            console.log("加载通知设置失败:", e);
        }
        
        applyColorSettings();
        updateClock();
    } catch (e) {
        console.error("加载设置失败:", e);
        selectedBgImage = 'res/pic/nano.webp';
        updateBgPreview(selectedBgImage);
        applyColorSettings();
    }
}

function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    if (showSeconds) {
        timeDisplay.textContent = `${hours}:${minutes}:${seconds}`;
    } else {
        timeDisplay.textContent = `${hours}:${minutes}`;
    }
    
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const weekDay = weekDays[now.getDay()];
    
    let dateParts = [];
    if (showYearCheckbox.checked) dateParts.push(year);
    if (showMonthDayCheckbox.checked) dateParts.push(`${month}/${day}`);
    
    dateDisplay.textContent = dateParts.join('/');
    weekDisplay.textContent = weekDay;
    
    dateDisplay.style.display = showDateCheckbox.checked ? 'block' : 'none';
    weekDisplay.style.display = showWeekCheckbox.checked ? 'block' : 'none';
    
    if (!showDateCheckbox.checked && !showWeekCheckbox.checked) {
        dateWeekContainer.style.display = 'none';
    } else {
        dateWeekContainer.style.display = 'flex';
    }
    
    sloganDisplay.textContent = sloganText;
    sloganDisplay.style.display = showSloganCheckbox.checked ? 'block' : 'none';
    
    applyColorSettings();
    
    updateAnalogClock(now);
}

function updateClockPosition() {
    mainContainer.classList.remove('layout-center', 'layout-left', 'layout-right');
    
    switch (clockPosition) {
        case "left":
            mainContainer.classList.add('layout-left');
            clockContainer.style.display = 'block';
            break;
        case "right":
            mainContainer.classList.add('layout-right');
            clockContainer.style.display = 'block';
            break;
        default:
            mainContainer.classList.add('layout-center');
            clockContainer.style.display = 'none';
    }
    
    document.querySelectorAll('.clock-position-option').forEach(option => {
        const radioInput = option.querySelector('input[type="radio"]');
        if (radioInput && radioInput.value === clockPosition) {
            radioInput.checked = true;
        }
    });
    
    updateClockPositionStatus();
}

function applyColorSettings() {
    timeDisplay.style.color = colors.time;
    timeDisplay.style.fontFamily = currentFont;
    dateDisplay.style.color = colors.date;
    weekDisplay.style.color = colors.week;
    sloganDisplay.style.color = colors.slogan;
   
    if (selectedBgImage) {
        document.body.style.setProperty('--bg-image', `url(${selectedBgImage})`);
    } else {
        document.body.style.setProperty('--bg-image', 'none');
    }
 
    updateOpacityValueText();
    updateColorPreviews();
}

function updateOpacityValueText() {
    const opacity = opacitySlider.value * 100;
    opacityValue.textContent = `${Math.round(opacity)}%`;
}

function updateFontSizeValue() {
    const scale = fontSizeSlider.value * 100;
    fontSizeValue.textContent = `${Math.round(scale)}%`;
}

function showMenu(menu) {
    if (activeMenu) {
        menuStack.push(activeMenu);
        activeMenu.classList.remove('active');
    }
    
    activeMenu = menu;
    menu.classList.add('active');
    menuOverlay.classList.add('active');
    
    document.body.style.overflow = 'hidden';
}

function hideMenu(menu) {
    if (!menu) return;
    
    menu.classList.remove('active');
    
    if (menuStack.length > 0) {
        const previousMenu = menuStack.pop();
        previousMenu.classList.add('active');
        activeMenu = previousMenu;
    } else {
        menuOverlay.classList.remove('active');
        activeMenu = null;
        document.body.style.overflow = '';
    }
}

function hsvToHex(h, s, v) {
    h = parseInt(h);
    s = parseInt(s) / 100;
    v = parseInt(v) / 100;
    
    let r, g, b, i, f, p, q, t;
    i = Math.floor(h / 60);
    f = h / 60 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    
    const toHex = x => {
        const hex = Math.round(x * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToHsv(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    
    const rNorm = r / 255;
    const gNorm = g / 255;
    const bNorm = b / 255;
    
    const cmax = Math.max(rNorm, gNorm, bNorm);
    const cmin = Math.min(rNorm, gNorm, bNorm);
    const delta = cmax - cmin;
    
    let h = 0;
    let s = 0;
    let v = cmax;
    
    if (delta !== 0) {
        s = delta / cmax;
        
        switch (cmax) {
            case rNorm: h = ((gNorm - bNorm) / delta) % 6; break;
            case gNorm: h = (bNorm - rNorm) / delta + 2; break;
            case bNorm: h = (rNorm - gNorm) / delta + 4; break;
        }
        
        h = Math.round(h * 60);
        if (h < 0) h += 360;
    }
    
    s = Math.round(s * 100);
    v = Math.round(v * 100);
    
    return { h, s, v };
}

function initColorPicker() {
    if (currentColorTarget) {
        let initialColor = "#FFFFFF";
        if (currentColorTarget === 'time') initialColor = colors.time;
        if (currentColorTarget === 'date') initialColor = colors.date;
        if (currentColorTarget === 'week') initialColor = colors.week;
        if (currentColorTarget === 'slogan') initialColor = colors.slogan;
        
        targetInitialColor = initialColor;
        
        const { h, s, v } = hexToHsv(initialColor);
        hSlider.value = h;
        sSlider.value = s;
        vSlider.value = v;
        hValue.textContent = h;
        sValue.textContent = s;
        vValue.textContent = v;
        
        updateColorPointerPosition(h, s);
        updateColorPreview(h, s, v);
    }
}

function updateColorPointerPosition(h, s) {
    const rect = colorArea.getBoundingClientRect();
    const x = (h / 360) * rect.width;
    const y = ((100 - s) / 100) * rect.height;
    colorPointer.style.left = `${x}px`;
    colorPointer.style.top = `${y}px`;
}

function updateColorPreview(h, s, v) {
    const color = hsvToHex(h, s, v);
    currentColorElem.style.backgroundColor = color;
}

function handleColorInteraction(x, y) {
    const rect = colorArea.getBoundingClientRect();
    x = Math.max(0, Math.min(rect.width, x - rect.left));
    y = Math.max(0, Math.min(rect.height, y - rect.top));
    
    const h = Math.floor((x / rect.width) * 360);
    const s = Math.floor(100 - (y / rect.height) * 100);
    
    hSlider.value = h;
    sSlider.value = s;
    hValue.textContent = h;
    sValue.textContent = s;
    
    updateColorPointerPosition(h, s);
    updateColorPreview(h, s, vSlider.value);
}

function updateBgPreview(src) {
    while (largeBgPreview.firstChild) {
        largeBgPreview.removeChild(largeBgPreview.firstChild);
    }
    while (bgPreview.firstChild) {
        bgPreview.removeChild(bgPreview.firstChild);
    }
    
    if (src) {
        const largeImg = document.createElement('img');
        largeImg.src = src;
        largeImg.alt = '背景预览';
        largeBgPreview.appendChild(largeImg);
        
        const smallImg = document.createElement('img');
        smallImg.src = src;
        smallImg.alt = '背景预览';
        bgPreview.appendChild(smallImg);
    } else {
        const largePlaceholder = document.createElement('div');
        largePlaceholder.className = 'bg-placeholder';
        largePlaceholder.textContent = '背景预览';
        largeBgPreview.appendChild(largePlaceholder);
        
        const smallPlaceholder = document.createElement('div');
        smallPlaceholder.className = 'bg-placeholder';
        smallPlaceholder.textContent = '背景预览';
        bgPreview.appendChild(smallPlaceholder);
    }
}

async function resetBackground() {
    selectedBgImage = 'res/pic/nano.webp';
    updateBgPreview(selectedBgImage);
    opacitySlider.value = 1;
    updateOpacityValueText();
    document.documentElement.style.setProperty('--bg-opacity', 1);
    applyColorSettings();

    if (db) {
        const transaction = db.transaction([IMAGE_STORE], 'readwrite');
        const store = transaction.objectStore(IMAGE_STORE);
        store.delete('backgroundImage');
    }
    
    await saveSettings();
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log("全屏请求失败:", err);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

function updateColorFromSlider() {
    const h = hSlider.value;
    const s = sSlider.value;
    const v = vSlider.value;
    hValue.textContent = h;
    sValue.textContent = s;
    vValue.textContent = v;
    
    updateColorPointerPosition(h, s);
    updateColorPreview(h, s, v);
}

function initEventListeners() {
    tomatoControlBtn.addEventListener('click', async function() {
        if (isPaused) {
            startTimer();
        } else {
            pauseTimer();
        }
        await saveTomatoState();
    });

    notificationConfirm.addEventListener('click', hideNotification);

    tomatoCountSlider.addEventListener('input', function() {
        totalTomatoes = parseInt(this.value);
        tomatoCountValue.textContent = totalTomatoes;
        tomatoCountDisplay.textContent = `${currentTomatoCount}/${totalTomatoes}`;
        saveTomatoSettings();
    });

    focusTimeSlider.addEventListener('input', function() {
        focusTime = parseInt(this.value);
        focusTimeValue.textContent = focusTime;
        saveTomatoSettings();
        if (isFocusPhase) {
            tomatoTimer = focusTime * 60;
            updateDisplay();
        }
        saveTomatoState();
    });

    restTimeSlider.addEventListener('input', function() {
        restTime = parseInt(this.value);
        restTimeValue.textContent = restTime;
        saveTomatoSettings();
        if (!isFocusPhase) {
            tomatoTimer = restTime * 60;
            updateDisplay();
        }
        saveTomatoState();
    });

    playSoundCheckbox.addEventListener('change', function() {
        playSound = this.checked;
        saveTomatoSettings();
    });

    vibrateSwitch.addEventListener('change', function() {
        vibrateEnabled = this.checked;
        saveTomatoSettings();
    });

    showTomatoCheckbox.addEventListener('change', function() {
        updateTomatoVisibility();
        saveTomatoSettings();
    });

    if (showSecondsCheckbox) {
        showSecondsCheckbox.addEventListener('change', function() {
            showSeconds = this.checked;
            updateClock(); 
            saveSettings();
        });
    }

    audioUpload.addEventListener('change', async function(e) {
        const file = e.target.files[0];
        if (file) {
            try {
                await saveAudioFile(file);
                audioFileUrl = await loadAudioFile();
                audioFileName.textContent = file.name;
                await saveTomatoSettings();
            } catch (error) {
                alert('音频文件保存失败，请重试');
            }
        }
    });

    menuOverlay.addEventListener('click', () => {
        hideMenu(activeMenu);
    });

    menuButton.addEventListener('click', () => {
        showMenu(mainMenu);
    });

    closeMainMenu.addEventListener('click', () => hideMenu(mainMenu));
    closeDisplaySettings.addEventListener('click', () => hideMenu(displaySettings));
    closeColorSettings.addEventListener('click', () => hideMenu(colorSettings));
    closeBgSettings.addEventListener('click', () => hideMenu(bgSettings));
    closeColorPicker.addEventListener('click', () => hideMenu(colorPicker));
    closeBgPicker.addEventListener('click', () => hideMenu(bgPicker));
    closeTomatoSettings.addEventListener('click', () => hideMenu(tomatoSettings));
    closeSloganPicker.addEventListener('click', () => hideMenu(sloganPicker));
    closeNotificationPicker.addEventListener('click', () => hideMenu(notificationPicker));
    closeMoreSettings.addEventListener('click', () => hideMenu(moreSettings));
    closeVersionModal.addEventListener('click', () => hideMenu(versionInfoModal));
    
    closeClockPositionPicker.addEventListener('click', () => hideMenu(clockPositionPicker));
    closeFontPicker.addEventListener('click', () => hideMenu(fontPicker));

    openDisplaySettings.addEventListener('click', () => {
        menuStack = [mainMenu];
        hideMenu(mainMenu);
        setTimeout(() => showMenu(displaySettings), 50);
    });

    openColorSettings.addEventListener('click', () => {
        menuStack = [mainMenu];
        hideMenu(mainMenu);
        setTimeout(() => showMenu(colorSettings), 50);
    });

    openBgSettings.addEventListener('click', () => {
        menuStack = [mainMenu];
        hideMenu(mainMenu);
        setTimeout(() => showMenu(bgSettings), 50);
    });

    openBgPicker.addEventListener('click', () => {
        menuStack.push(bgSettings);
        hideMenu(bgSettings);
        setTimeout(() => showMenu(bgPicker), 50);
    });

    openTomatoSettings.addEventListener('click', () => {
        menuStack = [mainMenu];
        hideMenu(mainMenu);
        setTimeout(() => showMenu(tomatoSettings), 50);
    });

    openSloganPicker.addEventListener('click', () => {
        menuStack.push(displaySettings);
        hideMenu(displaySettings);
        setTimeout(() => {
            showMenu(sloganPicker);
            sloganInput.value = sloganText;
        }, 50);
    });
    
    openMoreSettings.addEventListener('click', () => {
        menuStack = [mainMenu];
        hideMenu(mainMenu);
        setTimeout(() => showMenu(moreSettings), 50);
    });
    
    openHelpQues.addEventListener('click', () => {
        window.location.href = 'ques.html';
    });
    
    openVersionCheck.addEventListener('click', () => {
        menuStack.push(moreSettings);
        hideMenu(moreSettings);
        setTimeout(() => {
            showMenu(versionInfoModal);
            if (window.versionChecker) {
                window.versionChecker.openVersionModal();
            }
        }, 50);
    });

    resetSloganBtn.addEventListener('click', function() {
        sloganInput.value = "https://nairocy.com";
    });

    confirmSloganBtn.addEventListener('click', async function() {
        sloganText = sloganInput.value;
        sloganDisplay.textContent = sloganText;
        hideMenu(sloganPicker);
        await saveSettings();
    });

    document.querySelectorAll('.color-option').forEach(option => {
        option.addEventListener('click', () => {
            currentColorTarget = option.dataset.target;
            menuStack.push(colorSettings);
            hideMenu(colorSettings);
            setTimeout(() => {
                showMenu(colorPicker);
                initColorPicker();
            }, 50);
        });
    });

    document.getElementById('qrcode-image').addEventListener('click', openNairocyWebsite);

    bgFileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async (event) => {
                selectedBgImage = event.target.result;
                updateBgPreview(selectedBgImage);
                
                try {
                    await saveBackgroundImage(file);
                } catch (error) {
                    console.error("保存背景图片失败:", error);
                }
            };
            reader.readAsDataURL(file);
        }
    });

    resetBgButton.addEventListener('click', resetBackground);

    applyBgButton.addEventListener('click', async () => {
        hideMenu(bgPicker);
        applyColorSettings();
        await saveSettings();
    });

    opacitySlider.addEventListener('input', function() {
        const opacity = this.value;
        updateOpacityValueText();
        document.documentElement.style.setProperty('--bg-opacity', opacity);
        saveSettings();
    });

    fontSizeSlider.addEventListener('input', function() {
        const scale = this.value;
        updateFontSizeValue();
        document.documentElement.style.setProperty('--time-scale', scale);
        saveSettings();
    });

    openClockPositionPicker.addEventListener('click', () => {
        menuStack.push(displaySettings);
        hideMenu(displaySettings);
        setTimeout(() => {
            showMenu(clockPositionPicker);
            document.querySelectorAll('.clock-position-option').forEach(option => {
                const radioInput = option.querySelector('input[type="radio"]');
                if (radioInput && radioInput.value === clockPosition) {
                    radioInput.checked = true;
                }
            });
        }, 50);
    });

    document.querySelectorAll('.clock-position-option').forEach(option => {
        option.addEventListener('click', function() {
            const radioInput = this.querySelector('input[type="radio"]');
            if (radioInput) {
                radioInput.checked = true;
                clockPosition = radioInput.value;
                updateClockPosition();
                saveSettings();
            }
        });
    });
    
    openFontPicker.addEventListener('click', () => {
        menuStack.push(displaySettings);
        hideMenu(displaySettings);
        setTimeout(() => {
            showMenu(fontPicker);
            document.querySelectorAll('.font-option').forEach(option => {
                const radioInput = option.querySelector('input[type="radio"]');
                if (radioInput && radioInput.value === currentFont) {
                    radioInput.checked = true;
                }
            });
        }, 50);
    });

    document.querySelectorAll('.font-option').forEach(option => {
        option.addEventListener('click', function() {
            const fontValue = this.dataset.font;
            const radioInput = this.querySelector('input[type="radio"]');
            if (radioInput && fontValue) {
                radioInput.checked = true;
                currentFont = fontValue;
                updateFontStatus();
                applyColorSettings();
                saveSettings();
            }
        });
    });

    colorArea.addEventListener('mousedown', (e) => {
        isDragging = true;
        handleColorInteraction(e.clientX, e.clientY);
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            handleColorInteraction(e.clientX, e.clientY);
        }
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
        }
    });

    colorArea.addEventListener('touchstart', (e) => {
        isDragging = true;
        handleColorInteraction(e.touches[0].clientX, e.touches[0].clientY);
        e.preventDefault();
    }, { passive: false });

    document.addEventListener('touchmove', (e) => {
        if (isDragging) {
            handleColorInteraction(e.touches[0].clientX, e.touches[0].clientY);
            e.preventDefault();
        }
    }, { passive: false });

    document.addEventListener('touchend', () => {
        if (isDragging) {
            isDragging = false;
        }
    });

    hSlider.addEventListener('input', updateColorFromSlider);
    sSlider.addEventListener('input', updateColorFromSlider);
    vSlider.addEventListener('input', updateColorFromSlider);

    resetColorButton.addEventListener('click', () => {
        if (currentColorTarget) {
            switch (currentColorTarget) {
                case 'time': hSlider.value = 0; sSlider.value = 0; vSlider.value = 100; break;
                case 'date': case 'week': case 'slogan': hSlider.value = 200; sSlider.value = 70; vSlider.value = 90; break;
            }
            updateColorFromSlider();
        }
    });

    confirmColorButton.addEventListener('click', async () => {
        if (currentColorTarget) {
            const color = hsvToHex(hSlider.value, sSlider.value, vSlider.value);
            colors[currentColorTarget] = color;
            hideMenu(colorPicker);
            applyColorSettings();
            await saveSettings();
        }
    });

    const displayCheckboxes = [
        showDateCheckbox,
        showYearCheckbox,
        showWeekCheckbox,
        showMonthDayCheckbox,
        showSloganCheckbox
    ];

    displayCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            updateClock();
            saveSettings();
        });
    });

    openNotificationSettings.addEventListener('click', () => {
        menuStack.push(tomatoSettings);
        hideMenu(tomatoSettings);
        setTimeout(() => {
            showMenu(notificationPicker);
            phaseCompleteNotificationInput.value = phaseCompleteText;
            allCompleteNotificationInput.value = allCompleteText;
            restEndNotificationInput.value = restEndText;
        }, 50);
    });

    resetNotificationBtn.addEventListener('click', function() {
        phaseCompleteNotificationInput.value = "本次专注已结束！剩余番茄钟：{X}个，接下来是绿色休息时间～";
        allCompleteNotificationInput.value = "太棒了！已完成所有番茄钟任务！";
        restEndNotificationInput.value = "休息结束，请点击开始继续专注！";
    });

    confirmNotificationBtn.addEventListener('click', async function() {
        phaseCompleteText = phaseCompleteNotificationInput.value;
        allCompleteText = allCompleteNotificationInput.value;
        restEndText = restEndNotificationInput.value;
        
        const notificationSettings = {
            phaseComplete: phaseCompleteText,
            allComplete: allCompleteText,
            restEnd: restEndText
        };
        
        try {
            await saveNotificationSettingsToDB(notificationSettings);
            hideMenu(notificationPicker);
        } catch (error) {
            alert('保存失败，请重试');
        }
    });

    document.body.addEventListener('dblclick', toggleFullscreen);

    document.addEventListener('wheel', function(e) {
        if (e.ctrlKey) {
            e.preventDefault();
        }
    }, { passive: false });

    document.addEventListener('touchmove', function(event) {
        if (event.touches.length > 1) {
            let target = event.target;
            let isInMenuContent = false;
            while (target) {
                if (target.classList && target.classList.contains('menu-content')) {
                    isInMenuContent = true;
                    break;
                }
                target = target.parentElement;
            }
            if (!isInMenuContent) {
                event.preventDefault();
            }
        }
    }, { passive: false });

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            requestWakeLock();
        }
    });

    window.addEventListener('beforeunload', async () => {
        await saveTomatoState();
        releaseWakeLock();
    });
}

function fallbackToDefaultSettings() {
    try {
        selectedBgImage = 'res/pic/nano.webp';
        updateBgPreview(selectedBgImage);
        updateClock();
        
        if (typeof initEventListeners === 'function') {
            initEventListeners();
        }
        
        setInterval(updateClock, 1000);
        
        setTimeout(() => {
            if (fullscreenHint) {
                fullscreenHint.style.opacity = 0;
                setTimeout(() => {
                    if (fullscreenHint) fullscreenHint.style.display = 'none';
                }, 500);
            }
        }, 3000);
    } catch (e) {
        console.error("回退到默认设置失败:", e);
    }
}

let appStartRetries = 0;
const MAX_RETRIES = 3;

function safeStartApp() {
    try {
        initDOMElements();
        
        setTimeout(async () => {
            try {
                await initDB();
                
                createClockNumbers();
                
                updateClock();
                updateOpacityValueText();
                updateFontSizeValue();
                currentFont = defaultFont;
                
                await loadSettings();
                
                if (!selectedBgImage) {
                    selectedBgImage = 'res/pic/nano.webp';
                    updateBgPreview(selectedBgImage);
                    applyColorSettings();
                }
                
                const bgImageUrl = await loadBackgroundImage();
                if (bgImageUrl) {
                    selectedBgImage = bgImageUrl;
                    updateBgPreview(selectedBgImage);
                    applyColorSettings();
                }
                
                await initTomatoTimer();
                
                updateClockPosition();
                updateFontStatus();
                
                initEventListeners();
                
                initBackButtonHandler();
                
                setTimeout(() => {
                    if (isWakeLockSupported) {
                        requestWakeLock();
                    } else if (typeof plus !== 'undefined' && plus.device && plus.device.setWakelock) {
                        
                        try {
                            plus.device.setWakelock(true);
                            console.log("HBuilderX屏幕常亮已开启");
                        } catch (err) {
                            console.warn("HBuilderX屏幕常亮设置失败:", err);
                        }
                    }
                }, 1000);
                
                setInterval(updateClock, 1000);
                
                setTimeout(() => {
                    if (fullscreenHint) {
                        fullscreenHint.style.opacity = 0;
                        setTimeout(() => {
                            if (fullscreenHint) fullscreenHint.style.display = 'none';
                        }, 500);
                    }
                }, 3000);
                
                document.querySelectorAll('.menu-panel').forEach(panel => {
                    panel.classList.remove('active');
                });
                if (menuOverlay) {
                    menuOverlay.classList.remove('active');
                }
                
                updateColorPreviews();

                try {
                    if (typeof plus !== 'undefined') {
                        
                        plus.screen.lockOrientation('landscape-primary');
                        
                        plus.navigator.setFullscreen(true);
                        console.log("HBuilderX横屏和全屏设置成功");
                    }
                } catch (e) {
                    console.warn("HBuilderX横屏全屏设置失败:", e);
                }
                
                console.log("NAA Clock应用初始化完成");
                
            } catch (dbError) {
                console.error("数据库初始化失败，使用回退设置:", dbError);
                fallbackToDefaultSettings();
            }
        }, 300);
    } catch (error) {
        console.error("应用启动失败:", error);
        appStartRetries++;
        
        if (appStartRetries < MAX_RETRIES) {
            setTimeout(safeStartApp, 1000 * appStartRetries);
        } else {
            console.error("应用启动失败，达到最大重试次数");
            fallbackToDefaultSettings();
        }
    }
}

window.addEventListener('error', function(e) {
    console.error("全局错误:", e.error);

    if (e.message && (e.message.includes('database') || e.message.includes('initialize'))) {
        setTimeout(() => {
            console.log("检测到数据库错误，重新加载页面...");
            location.reload();
        }, 2000);
    }
});

window.addEventListener('unhandledrejection', function(e) {
    console.error("未处理的Promise拒绝:", e.reason);
});

document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM加载完成，开始启动应用...");
    safeStartApp();
});

window.hideMenu = hideMenu;
window.showMenu = showMenu;
window.mainMenu = null;