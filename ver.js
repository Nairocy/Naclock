class VersionChecker {
    constructor() {
        this.versionJsonUrl = "https://gitee.com/nainoz_naa/naclock/raw/master/version.json";
        this.currentVersion = "3.67"; 
        this.currentVersionCode = 367;
        this.updateData = null;
        this.isChecking = false;
        this.hasUpdate = false;
        this.isForceUpdate = false;
    }

    getCurrentVersionFromPage() {
        try {
            if (typeof plus !== 'undefined' && plus.runtime) {
                this.currentVersion = plus.runtime.version || this.currentVersion;
                this.currentVersionCode = this.versionToCode(this.currentVersion);
                console.log("从plus获取版本:", this.currentVersion);
                return;
            }

            if (typeof websApp !== 'undefined' && websApp.getAppVersion) {
                this.currentVersion = websApp.getAppVersion() || this.currentVersion;
                this.currentVersionCode = this.versionToCode(this.currentVersion);
                console.log("从websApp获取版本:", this.currentVersion);
                return;
            }

            const menuTitle = document.querySelector('.menu-title');
            if (menuTitle) {
                const versionMatch = menuTitle.textContent.match(/v(\d+\.\d+)/);
                if (versionMatch) {
                    this.currentVersion = versionMatch[1];
                    this.currentVersionCode = this.versionToCode(this.currentVersion);
                    console.log("从页面标题获取版本:", this.currentVersion);
                    return;
                }
            }

            const versionMeta = document.querySelector('meta[name="version"]');
            if (versionMeta) {
                this.currentVersion = versionMeta.getAttribute('content') || this.currentVersion;
                this.currentVersionCode = this.versionToCode(this.currentVersion);
                console.log("从meta标签获取版本:", this.currentVersion);
                return;
            }
            
            console.log("使用默认版本:", this.currentVersion);
        } catch (error) {
            console.error("获取当前版本失败:", error);
        }
    }

    versionToCode(version) {
        if (!version) return 0;
        const cleanVersion = version.replace(/[^\d.]/g, '');
        const parts = cleanVersion.split('.');
        let code = 0;
        if (parts[0]) code += parseInt(parts[0]) * 100;
        if (parts[1]) code += parseInt(parts[1]);
        return code * 10;
    }

    async checkForUpdates() {
        if (this.isChecking) return;

        this.isChecking = true;
        this.showCheckingStatus();

        try {
            const timestamp = Date.now();
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);
            
            const response = await fetch(`${this.versionJsonUrl}?t=${timestamp}`, {
                cache: 'no-cache',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache'
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP错误: ${response.status} - ${response.statusText}`);
            }

            this.updateData = await response.json();
            this.processUpdateData();

        } catch (error) {
            if (error.name === 'AbortError') {
                console.error("版本检测超时");
                this.showErrorStatus("检测超时，请检查网络连接");
            } else {
                console.error("版本检测失败:", error);
                this.showErrorStatus("检测失败: " + error.message);
            }
            this.updateUpdateButton(false, false);
        } finally {
            this.isChecking = false;
        }
    }

    processUpdateData() {
        if (!this.updateData) return;

        document.getElementById('current-version-display').textContent = `v${this.currentVersion}`;
        document.getElementById('latest-version-display').textContent = `v${this.updateData.version}`;
        document.getElementById('release-date-display').textContent = this.updateData.releaseDate || '-';
        document.getElementById('file-size-display').textContent = this.updateData.fileSize || '-';

        this.formatReleaseNotes();

        const remoteVersionCode = this.versionToCode(this.updateData.version);
        const minSupportedCode = this.versionToCode(this.updateData.minSupportedVersion);

        console.log(`版本码比较: 当前=${this.currentVersionCode}, 远程=${remoteVersionCode}, 最低支持=${minSupportedCode}`);

        this.hasUpdate = false;
        this.isForceUpdate = false;

        if (this.updateData.forceUpdate === true && this.currentVersionCode < minSupportedCode) {
            console.log('触发强制更新：当前版本低于最低支持版本');
            this.hasUpdate = true;
            this.isForceUpdate = true;
            this.showUpdateStatus("发现强制更新！", "warning");
        } else if (this.currentVersionCode < remoteVersionCode) {
            console.log('发现可用新版本');
            this.hasUpdate = true;
            this.isForceUpdate = false;
            this.showUpdateStatus("发现新版本！", "success");
        } else if (this.currentVersionCode === remoteVersionCode) {
            console.log('当前已是最新版本');
            this.showUpdateStatus("已是最新版本", "info");
        } else {
            console.log('当前版本较新');
            this.showUpdateStatus("当前版本较新", "info");
        }

        const forceUpdateWarning = document.getElementById('force-update-warning');
        if (forceUpdateWarning) {
            forceUpdateWarning.style.display = this.isForceUpdate ? 'block' : 'none';
        }

        this.updateUpdateButton(this.hasUpdate, this.isForceUpdate);
    }

    updateUpdateButton(hasUpdate, isForceUpdate) {
        const updateButton = document.getElementById('update-or-close-btn');
        if (!updateButton) return;

        if (hasUpdate) {
            updateButton.innerHTML = isForceUpdate ? 
                '<i class="fas fa-exclamation-triangle"></i> 必须更新' : 
                '<i class="fas fa-download"></i> 更新';
            updateButton.className = 'action-button confirm-button';
            updateButton.style.flex = '1';

            if (isForceUpdate) {
                updateButton.style.background = '#ff6b6b';
            } else {
                updateButton.style.background = '';
            }

            updateButton.onclick = () => {
                this.downloadUpdate();
            };
        } else {
            updateButton.innerHTML = '<i class="fas fa-times"></i> 关闭';
            updateButton.className = 'action-button reset-button';
            updateButton.style.flex = '1';
            updateButton.style.background = '';

            updateButton.onclick = () => {
                this.closeVersionModal();
            };
        }
    }

    downloadUpdate() {
        if (!this.updateData || !this.updateData.downloadUrl) {
            alert('更新链接无效');
            return;
        }

        if (typeof plus !== 'undefined' && plus.runtime) {
            plus.runtime.openURL(this.updateData.downloadUrl);
            if (plus.nativeUI && plus.nativeUI.toast) {
                plus.nativeUI.toast("正在打开浏览器...");
            }
        } 
        
        else if (typeof websApp !== 'undefined' && websApp.openURLInBrowser) {
            websApp.openURLInBrowser(this.updateData.downloadUrl);
            websApp.toast("正在打开浏览器...");
        } 
        
        else {
            window.open(this.updateData.downloadUrl, '_blank');
        }

        this.closeVersionModal();
    }

    closeVersionModal() {
        const versionModal = document.getElementById('version-info-modal');
        if (versionModal && window.hideMenu) {
            window.hideMenu(versionModal);
        }
    }

    formatReleaseNotes() {
        const notesElement = document.getElementById('release-notes-display');
        if (!this.updateData.releaseNotes) {
            notesElement.innerHTML = "暂无更新说明";
            return;
        }

        let notes = this.updateData.releaseNotes;

        notes = notes
            .replace(/## (.*?)(?:\n|$)/g, '<strong>$1</strong><br>')
            .replace(/### (.*?)(?:\n|$)/g, '<strong>$1</strong><br>')
            .replace(/- (.*?)(?:\n|$)/g, '• $1<br>')
            .replace(/\n\n/g, '<br><br>')
            .replace(/\n/g, ' ')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');

        notesElement.innerHTML = notes;
    }

    showCheckingStatus() {
        const statusElement = document.getElementById('update-status');
        if (statusElement) {
            statusElement.textContent = "正在检测...";
            statusElement.style.color = "#cccccc";
            statusElement.style.background = "rgba(0, 0, 0, 0.3)";
        }
    }

    showUpdateStatus(message, type = "info") {
        const statusElement = document.getElementById('update-status');
        if (!statusElement) return;
        
        statusElement.textContent = message;

        switch (type) {
            case "success":
                statusElement.style.color = "#4ecdc4";
                statusElement.style.background = "rgba(78, 205, 196, 0.1)";
                break;
            case "warning":
                statusElement.style.color = "#ff6b6b";
                statusElement.style.background = "rgba(255, 107, 107, 0.1)";
                break;
            case "info":
            default:
                statusElement.style.color = "#a3d5ff";
                statusElement.style.background = "rgba(163, 213, 255, 0.1)";
        }
    }

    showErrorStatus(message) {
        const statusElement = document.getElementById('update-status');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.style.color = "#ff6b6b";
            statusElement.style.background = "rgba(255, 107, 107, 0.1)";
        }
    }

    openVersionModal() {
        this.getCurrentVersionFromPage();
        this.updateUpdateButton(false, false);
        this.checkForUpdates();
    }

    init() {
        this.getCurrentVersionFromPage();

        document.getElementById('check-version-again')?.addEventListener('click', () => {
            this.checkForUpdates();
        });

        document.getElementById('close-version-modal')?.addEventListener('click', () => {
            this.closeVersionModal();
        });

        const updateButton = document.getElementById('update-or-close-btn');
        if (updateButton) {
            updateButton.onclick = () => {
                this.closeVersionModal();
            };
        }
    }
}

function initVersionCheck() {
    try {
        versionChecker = new VersionChecker();
        versionChecker.init();

        window.versionChecker = versionChecker;

        document.getElementById('open-more-settings')?.addEventListener('click', () => {
            if (window.menuStack && window.mainMenu) {
                window.menuStack = [window.mainMenu];
                if (window.hideMenu) window.hideMenu(window.mainMenu);
                setTimeout(() => {
                    const moreSettings = document.getElementById('more-settings');
                    if (moreSettings && window.showMenu) {
                        window.showMenu(moreSettings);
                    }
                }, 50);
            }
        });

        document.getElementById('close-more-settings')?.addEventListener('click', () => {
            const moreSettings = document.getElementById('more-settings');
            if (moreSettings && window.hideMenu) {
                window.hideMenu(moreSettings);
            }
        });

        document.getElementById('open-help-ques')?.addEventListener('click', () => {
            window.location.href = 'ques.html';
        });

        document.getElementById('open-version-check')?.addEventListener('click', () => {
            const moreSettings = document.getElementById('more-settings');
            if (moreSettings && window.menuStack && window.hideMenu) {
                window.menuStack.push(moreSettings);
                window.hideMenu(moreSettings);
                setTimeout(() => {
                    const versionModal = document.getElementById('version-info-modal');
                    if (versionModal && window.showMenu) {
                        window.showMenu(versionModal);
                        versionChecker.openVersionModal();
                    }
                }, 50);
            }
        });
        
        console.log("版本检查器初始化完成");
    } catch (error) {
        console.error("版本检查器初始化失败:", error);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initVersionCheck);
} else {
    initVersionCheck();
}

window.addEventListener('error', function(e) {
    console.error("全局错误:", e.error);
});

window.addEventListener('unhandledrejection', function(e) {
    console.error("未处理的Promise拒绝:", e.reason);
});