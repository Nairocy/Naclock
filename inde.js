class VersionManager {
    constructor() {
        this.currentVersion = null;
        this.remoteVersionUrl = "https://gitee.com/nainoz_naa/naclock/raw/master/version.json";
        this.updateData = null;
        this.isForceUpdate = false;
        this.hasUpdate = false;
    }

    getCurrentVersion() {
        try {
            if (typeof plus !== 'undefined' && plus.runtime) {
                return plus.runtime.version || null;
            }

            if (typeof websApp !== 'undefined' && websApp.getAppVersion) {
                return websApp.getAppVersion();
            }

            const versionMeta = document.querySelector('meta[name="version"]');
            if (versionMeta) {
                return versionMeta.getAttribute('content');
            }

            const versionMatch = document.title.match(/v(\d+\.\d+)/);
            if (versionMatch) {
                return versionMatch[1];
            }
            
            return null;
        } catch (error) {
            console.error("获取应用版本失败:", error);
            return null;
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

    isVersionSkipped(version) {
        try {
            const skippedVersions = JSON.parse(localStorage.getItem('skippedVersions') || '[]');
            return skippedVersions.includes(version);
        } catch {
            return false;
        }
    }

    skipVersion(version) {
        try {
            const skippedVersions = JSON.parse(localStorage.getItem('skippedVersions') || '[]');
            if (!skippedVersions.includes(version)) {
                skippedVersions.push(version);
                localStorage.setItem('skippedVersions', JSON.stringify(skippedVersions));
                console.log(`已跳过版本: ${version}`);
            }
        } catch (error) {
            console.error("跳过版本失败:", error);
        }
    }

    async checkUpdate() {
        try {
            this.currentVersion = this.getCurrentVersion();
            
            if (!this.currentVersion) {
                console.warn("无法获取当前应用版本，跳过更新检查");
                return null;
            }
            
            const versionDisplay = document.getElementById('currentVersionDisplay');
            if (versionDisplay) {
                versionDisplay.textContent = `v${this.currentVersion}  by Nairocy`;
            }

            console.log('当前版本:', this.currentVersion);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            const response = await fetch(this.remoteVersionUrl + '?t=' + Date.now(), {
                signal: controller.signal,
                cache: 'no-cache',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache'
                }
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP错误! 状态码: ${response.status}`);
            }

            const remoteData = await response.json();
            this.updateData = remoteData;
            
            document.getElementById('fileSizeDisplay').textContent = remoteData.fileSize || '未知';
            document.getElementById('updateDateDisplay').textContent = remoteData.releaseDate || '未知';
            
            this.formatReleaseNotes(remoteData.releaseNotes);
            
            const currentCode = this.versionToCode(this.currentVersion);
            const remoteCode = this.versionToCode(remoteData.version);
            const minSupportedCode = this.versionToCode(remoteData.minSupportedVersion);

            console.log(`版本码比较: 当前=${currentCode}, 远程=${remoteCode}, 最低支持=${minSupportedCode}`);

            if (remoteData.forceUpdate === true && currentCode < minSupportedCode) {
                console.log('触发强制更新：当前版本低于最低支持版本');
                this.isForceUpdate = true;
                this.hasUpdate = true;
                this.showForceUpdateWarning(true);
                return remoteData;
            }

            if (currentCode < remoteCode) {
                console.log('发现可用新版本');
                this.isForceUpdate = false;
                this.hasUpdate = true;
                this.showForceUpdateWarning(false);
                return remoteData;
            }

            console.log('当前已是最新版本或版本更高');
            this.isForceUpdate = false;
            this.hasUpdate = false;
            return null;

        } catch (error) {
            if (error.name === 'AbortError') {
                console.warn('版本检查超时');
            } else {
                console.warn('版本检查失败:', error.message);
            }
            return null;
        }
    }

    showForceUpdateWarning(show) {
        const forceUpdateWarning = document.getElementById('forceUpdateWarning');
        if (forceUpdateWarning) {
            forceUpdateWarning.style.display = show ? 'block' : 'none';
        }
    }

    formatReleaseNotes(notes) {
        const notesElement = document.getElementById('updateNotes');
        if (!notes) {
            notesElement.innerHTML = "<p>暂无更新说明</p>";
            return;
        }
        
        let formattedNotes = notes
            .replace(/## (.*?)(?:\n|$)/g, '<p><strong>$1</strong></p>')
            .replace(/### (.*?)(?:\n|$)/g, '<p><strong>$1</strong></p>')
            .replace(/- (.*?)(?:\n|$)/g, '<p>• $1</p>')
            .replace(/\n\n/g, '<br><br>')
            .replace(/\n/g, ' ')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        notesElement.innerHTML = formattedNotes;
    }

    showUpdateDialog(updateData) {
        const modal = document.getElementById('updateModal');

        document.getElementById('currentVersion').textContent = `v${this.currentVersion}`;
        document.getElementById('newVersionDisplay').textContent = `v${updateData.version}`;
        
        const updateBtn = document.getElementById('updateBtn');
        const laterBtn = document.getElementById('laterBtn');
        const skipCheckboxContainer = document.querySelector('.checkbox-container');
        
        if (this.isForceUpdate) {
            updateBtn.textContent = '必须更新';
            updateBtn.style.backgroundColor = '#ff6b6b';
            updateBtn.style.color = '#fff';
            updateBtn.style.borderColor = '#ff6b6b';
            
            if (laterBtn) laterBtn.style.display = 'none';
            if (skipCheckboxContainer) skipCheckboxContainer.style.display = 'none';
            
            const btnContainer = document.querySelector('.btn-container');
            if (btnContainer) {
                btnContainer.style.flexDirection = 'column';
                btnContainer.style.gap = '0';
            }
            
            updateBtn.style.width = '100%';
            updateBtn.style.margin = '0';
        } else {
            updateBtn.textContent = '开始更新';
            updateBtn.style.backgroundColor = '#4ecdc4';
            updateBtn.style.color = '#000';
            updateBtn.style.borderColor = '#4ecdc4';
            
            if (laterBtn) laterBtn.style.display = 'block';
            if (skipCheckboxContainer) skipCheckboxContainer.style.display = 'flex';
            
            const btnContainer = document.querySelector('.btn-container');
            if (btnContainer) {
                btnContainer.style.flexDirection = 'column';
                btnContainer.style.gap = '0.7rem';
            }
            
            updateBtn.style.width = '';
            updateBtn.style.margin = '';
        }

        updateBtn.onclick = () => {
            if (typeof plus !== 'undefined' && plus.runtime) {
                plus.runtime.openURL(updateData.downloadUrl);
                if (plus.nativeUI && plus.nativeUI.toast) {
                    plus.nativeUI.toast("正在打开浏览器下载新版本...");
                }
            } 
            else if (typeof websApp !== 'undefined' && websApp.openURLInBrowser) {
                websApp.openURLInBrowser(updateData.downloadUrl);
                websApp.toast("正在打开浏览器下载新版本...");
            } 
            else {
                window.open(updateData.downloadUrl, '_blank');
            }

            modal.style.display = 'none';
            this.continueToApp();
        };

        if (!this.isForceUpdate && laterBtn) {
            laterBtn.onclick = () => {
                if (document.getElementById('skipThisVersion').checked) {
                    this.skipVersion(updateData.version);
                }
                modal.style.display = 'none';
                this.continueToApp();
            };
        }

        modal.style.display = 'flex';
    }

    continueToApp() {
        const hasSeenWelcome = localStorage.getItem('naaClockWelcomeSeen');

        if (!hasSeenWelcome) {
            const welcomeModal = document.getElementById('welcomeModal');
            welcomeModal.style.display = 'flex';

            document.getElementById('confirmBtn').onclick = () => {
                if (document.getElementById('dontShowAgain').checked) {
                    localStorage.setItem('naaClockWelcomeSeen', 'true');
                }

                welcomeModal.style.display = 'none';
                
                setTimeout(() => {
                    window.location.href = "page.html";
                }, 300);
            };
        } else {
            setTimeout(() => {
                window.location.href = "page.html";
            }, 300);
        }
    }

    setupDeviceOrientation() {
        try {
            if (typeof plus !== 'undefined') {
                plus.screen.lockOrientation('landscape-primary');
                plus.navigator.setFullscreen(true);
                console.log("设备方向设置成功");
            } else {
                console.log("非HBuilderX环境，跳过设备方向设置");
            }
        } catch (e) {
            console.error("设置设备方向失败: ", e);
        }
    }

    async init() {
        console.log("NAA Clock 启动初始化...");

        this.setupDeviceOrientation();

        const versionDisplay = document.getElementById('currentVersionDisplay');
        if (versionDisplay) {
            versionDisplay.textContent = "正在检测更新...";
        }
        
        try {
            const updateData = await this.checkUpdate();
            
            if (updateData) {
                this.showUpdateDialog(updateData);
            } else {
                this.continueToApp();
            }
        } catch (error) {
            console.error("初始化失败:", error);
            this.continueToApp();
        }
    }
}

window.onload = function() {
    try {
        const versionManager = new VersionManager();
        versionManager.init();
    } catch (error) {
        console.error("启动页初始化失败:", error);
        setTimeout(() => {
            window.location.href = "page.html";
        }, 1000);
    }
};

window.addEventListener('error', function(e) {
    console.error("全局错误:", e.error);
});

window.addEventListener('unhandledrejection', function(e) {
    console.error("未处理的Promise拒绝:", e.reason);
});