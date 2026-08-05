import {
  app,
  BrowserWindow,
  Tray,
  Menu,
  Notification,
  ipcMain,
  shell,
  nativeImage,
  powerMonitor,
  dialog,
} from "electron";
import path from "path";
import fs from "fs/promises";
import {fileURLToPath} from "url";
import dotenv from "dotenv";
import pkg from "electron-updater";
const {autoUpdater} = pkg;

dotenv.config();

import {
  loginApi,
  fetchMealList,
  getOptimalDateRange,
  getRegisteredMeal,
  getDishImageUrl,
  formatDateISO,
} from "./api/thacoApi.js";

import {
  loadConfig,
  saveConfig,
  loadSavedToken,
  saveTokenStorage,
  isTokenExpired,
} from "./api/storage.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow = null;
let tray = null;
let schedulerTimer = null;
let currentConfig = {
  apiKey: process.env.THACO_API_KEY,
  scheduleTime: "10:30",
  scheduleTimes: ["10:30"],
  autoStart: true,
  minimizeToTray: true,
  notifyEnabled: true,
  theme: "dark",
};
const DEFAULT_PORTAL_URL =
  process.env.THACO_PORTAL_URL ||
  "https://portal.thaco.com.vn/suat-an-chu-lai/lich-su";

// Đảm bảo chỉ 1 tiến trình duy nhất được chạy (Single Instance)
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    showOrCreateWindow();
  });

  app.on("before-quit", () => {
    app.isQuitting = true;
  });

  app.on(
    "certificate-error",
    (event, webContents, url, error, certificate, callback) => {
      if (url.includes("thacochulai.vn") || url.includes("thaco.com.vn")) {
        event.preventDefault();
        callback(true);
      } else {
        callback(false);
      }
    },
  );

  app.whenReady().then(async () => {
    // Đăng ký AppUserModelId cho Windows Toast Notification hiển thị chuẩn
    if (process.platform === "win32") {
      app.setAppUserModelId("Tool này khá xịn");
    }

    currentConfig = await loadConfig();

    // Cài đặt khởi động cùng Windows
    app.setLoginItemSettings({
      openAtLogin: Boolean(currentConfig.autoStart),
      path: process.execPath,
      args: ["--hidden"],
    });

    createWindow();
    createTray();
    setupScheduler();
    setupAutoUpdater();

    // Lắng nghe sự kiện hệ thống wake up để chạy lại kiểm tra
    powerMonitor.on("resume", () => {
      console.log(
        "⚡ Hệ thống vừa thức dậy từ Sleep/Hibernate, kiểm tra lại thực đơn...",
      );
      setupScheduler();
      runDailyCheckFlow({silent: true});
    });
  });
}

function showOrCreateWindow() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  } else {
    createWindow();
  }
}

function getAppIcon() {
  const iconPath = path.join(__dirname, "assets/icon.png");
  return nativeImage.createFromPath(iconPath);
}

function createTray() {
  const icon = getAppIcon();
  tray = new Tray(icon);
  tray.setToolTip("Cơm Nước THACO");

  updateTrayMenu();

  tray.on("double-click", () => {
    showOrCreateWindow();
  });
}

async function updateTrayMenu(todaySummary = "Chưa kiểm tra") {
  if (!tray || tray.isDestroyed()) return;
  const config = currentConfig || (await loadConfig());
  const tokenData = await loadSavedToken();
  const userName = tokenData
    ? tokenData.fullName || tokenData.userName
    : "Chưa đăng nhập";

  const contextMenu = Menu.buildFromTemplate([
    {
      label: `🍱 THACO Meal Check (${userName})`,
      enabled: false,
    },
    {
      label: `📌 Hôm nay: ${todaySummary.length > 30 ? todaySummary.substring(0, 30) + "..." : todaySummary}`,
      enabled: false,
    },
    {type: "separator"},
    {
      label: "🖥️ Mở Giao Diện",
      click: () => {
        showOrCreateWindow();
      },
    },
    {
      label: "🔄 Tra Cứu Ngay",
      click: async () => {
        await runDailyCheckFlow({silent: false});
      },
    },
    {
      label: "🔗 Mở Trang Portal THACO",
      click: () => {
        shell.openExternal(DEFAULT_PORTAL_URL);
      },
    },
    {type: "separator"},
    {
      label: "🚀 Tự Khởi Động Cùng Windows",
      type: "checkbox",
      checked: Boolean(config.autoStart),
      click: async (item) => {
        currentConfig = await saveConfig({autoStart: item.checked});
        app.setLoginItemSettings({
          openAtLogin: Boolean(item.checked),
          path: process.execPath,
          args: ["--hidden"],
        });
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send("config:updated", currentConfig);
        }
      },
    },
    {type: "separator"},
    {
      label: "❌ Thoát Hoàn Toàn",
      click: () => {
        app.isQuitting = true;
        app.quit();
      },
    },
  ]);

  if (!tray.isDestroyed()) {
    tray.setContextMenu(contextMenu);
  }
}

function createWindow() {
  const isHiddenArg = process.argv.includes("--hidden");
  const iconPath = path.join(__dirname, "assets/icon.png");

  mainWindow = new BrowserWindow({
    width: 960,
    height: 680,
    minWidth: 800,
    minHeight: 600,
    show: !isHiddenArg,
    title: "Cơm Nước THACO",
    icon: iconPath,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const isDev = !app.isPackaged || process.env.NODE_ENV === "development";

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173").catch(() => {
      mainWindow.loadFile(path.join(__dirname, "../dist-react/index.html"));
    });
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist-react/index.html"));
  }

  mainWindow.webContents.on(
    "did-fail-load",
    (event, errorCode, errorDescription, validatedURL) => {
      console.error(
        "[Renderer Fail Load]",
        errorCode,
        errorDescription,
        validatedURL,
      );
      if (validatedURL.includes("localhost")) {
        mainWindow.loadFile(path.join(__dirname, "../dist-react/index.html"));
      }
    },
  );

  mainWindow.on("close", (event) => {
    if (!app.isQuitting && currentConfig.minimizeToTray) {
      event.preventDefault();
      mainWindow.hide();
      if (tray && !tray.isDestroyed() && Notification.isSupported()) {
        new Notification({
          title: "🍱 THACO Meal Check",
          body: "Ứng dụng đã được thu nhỏ xuống khay hệ thống!",
        }).show();
      }
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

async function ensureValidTokenOrRefresh() {
  const config = currentConfig || (await loadConfig());
  let tokenData = await loadSavedToken();

  if (tokenData && !isTokenExpired(tokenData)) {
    return tokenData;
  }

  if (config.username && config.password) {
    try {
      console.log("🔄 Đang tự động làm mới token đăng nhập THACO...");
      const newTokenData = await loginApi({
        username: config.username,
        password: config.password,
        domain: config.domain || "",
      });
      await saveTokenStorage(newTokenData);
      return newTokenData;
    } catch (err) {
      console.error("⚠️ Tự động gia hạn token thất bại:", err.message);
    }
  }

  return tokenData && !isTokenExpired(tokenData) ? tokenData : null;
}

async function runDailyCheckFlow({silent = false} = {}) {
  try {
    const config = currentConfig || (await loadConfig());
    const tokenData = await ensureValidTokenOrRefresh();

    if (!tokenData) {
      if (!silent) {
        new Notification({
          title: "⚠️ Chưa Đăng Nhập THACO Portal",
          body: "Vui lòng mở ứng dụng và nhập tài khoản đăng nhập.",
        }).show();
      }
      return {success: false, reason: "unauthenticated"};
    }

    const dateRange = getOptimalDateRange("upcoming", 7);
    const mealResult = await fetchMealList({
      token: tokenData.token,
      maNhanVien: tokenData.userName,
      tuNgay: dateRange.tuNgay,
      denNgay: dateRange.denNgay,
      apiKey: config.apiKey || process.env.THACO_API_KEY,
    });

    const days = mealResult.days || [];
    const locationName = mealResult.selectedLocation
      ? mealResult.selectedLocation.tenDiaDiemAn
      : "";
    const todayStr = formatDateISO(new Date());

    const todayDayItem = days.find((item) => {
      const itemDateStr = item.ngay ? item.ngay.split("T")[0] : "";
      return itemDateStr === todayStr;
    });

    const todayMeal = todayDayItem ? getRegisteredMeal(todayDayItem) : null;
    let summaryText = "Hôm nay không có suất ăn";

    if (todayMeal) {
      const dishDetail = todayMeal.moTa
        ? `${todayMeal.tenMonAn} (${todayMeal.moTa})`
        : todayMeal.tenMonAn;
      summaryText = `${dishDetail}${locationName ? ` - ${locationName}` : ""}`;

      if (config.notifyEnabled !== false && Notification.isSupported()) {
        const notiTitle = `🍱 Món Cơm Hôm Nay (${todayMeal.thu || todayStr})`;

        let notiMsg = `Món: ${todayMeal.tenMonAn}`;
        if (todayMeal.moTa) {
          notiMsg += `\nChi tiết món: ${todayMeal.moTa}`;
        }
        notiMsg += `\nĐịa điểm: ${locationName || "N/A"}`;
        notiMsg += `\nGiá: ${todayMeal.gia ? todayMeal.gia.toLocaleString("vi-VN") : 0} VNĐ`;

        let notiIcon = null;
        const dishImageUrl =
          getDishImageUrl(todayMeal) ||
          (todayDayItem ? getDishImageUrl(todayDayItem) : null);

        if (dishImageUrl) {
          try {
            const imgRes = await fetch(dishImageUrl);
            if (imgRes.ok) {
              const arrayBuffer = await imgRes.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);
              notiIcon = nativeImage.createFromBuffer(buffer);
            }
          } catch (imgErr) {
            console.error(
              "⚠️ Không thể tải ảnh món ăn cho Toast notification:",
              imgErr.message,
            );
          }
        }

        const notiOptions = {
          title: notiTitle,
          body: notiMsg,
        };

        if (notiIcon && !notiIcon.isEmpty()) {
          notiOptions.icon = notiIcon;
        }

        const notification = new Notification(notiOptions);

        notification.on("click", () => {
          shell.openExternal(DEFAULT_PORTAL_URL);
        });

        notification.show();
      }
    } else {
      if (config.notifyEnabled !== false && Notification.isSupported()) {
        new Notification({
          title: "🍱 Thông Báo Suất Ăn THACO",
          body: "Hôm nay bạn không có lịch đăng ký ăn cơm.",
        }).show();
      }
    }

    updateTrayMenu(summaryText);

    const payload = {
      success: true,
      user: tokenData,
      days,
      todayMeal,
      locationName,
      lastUpdated: new Date().toISOString(),
    };

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("meal:updated", payload);
    }

    return payload;
  } catch (err) {
    console.error("❌ Lỗi tra cứu suất ăn:", err.message);
    return {success: false, error: err.message};
  }
}

function getScheduleTimes(config) {
  let times = [];
  if (Array.isArray(config.scheduleTimes) && config.scheduleTimes.length > 0) {
    times = config.scheduleTimes;
  } else if (
    typeof config.scheduleTime === "string" &&
    config.scheduleTime.trim()
  ) {
    times = config.scheduleTime
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  } else {
    times = ["10:30"];
  }
  return times.slice(0, 3);
}

async function setupScheduler() {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
  }

  // Kiểm tra mỗi 30 giây để đảm bảo chính xác phút cài đặt (không bỏ lỡ do trôi giây)
  let lastNotifiedMinuteStr = "";

  schedulerTimer = setInterval(async () => {
    try {
      const config = currentConfig || (await loadConfig());
      const targetTimes = getScheduleTimes(config);

      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      const matchedTime = targetTimes.find((timeStr) => {
        const [h, m] = timeStr.split(":").map(Number);
        return currentHour === h && currentMinute === m;
      });

      const minuteKey = `${now.toDateString()}-${currentHour}:${currentMinute}`;

      if (matchedTime && lastNotifiedMinuteStr !== minuteKey) {
        lastNotifiedMinuteStr = minuteKey;
        console.log(
          `⏰ [${now.toLocaleTimeString("vi-VN")}] Tự động kiểm tra thực đơn (${matchedTime})...`,
        );
        await runDailyCheckFlow({silent: false});
      }
    } catch (e) {
      console.error("Lỗi scheduler:", e);
    }
  }, 30000);
}

// Handler IPC giao tiếp với React Renderer
ipcMain.handle("auth:login", async (_event, credentials) => {
  try {
    const tokenData = await loginApi(credentials);
    await saveTokenStorage(tokenData);
    currentConfig = await saveConfig({
      ...currentConfig,
      username: credentials.username,
      password: credentials.password,
      domain: credentials.domain || "",
    });

    const mealData = await runDailyCheckFlow({silent: true});
    return {success: true, tokenData, mealData};
  } catch (err) {
    return {success: false, error: err.message};
  }
});

ipcMain.handle("auth:logout", async () => {
  await saveTokenStorage(null);
  currentConfig = await saveConfig({
    ...currentConfig,
    username: "",
    password: "",
  });
  updateTrayMenu("Chưa đăng nhập");
  return {success: true};
});

ipcMain.handle("meal:fetch", async () => {
  return await runDailyCheckFlow({silent: true});
});

ipcMain.handle("config:get", async () => {
  currentConfig = await loadConfig();
  return currentConfig;
});

ipcMain.handle("config:save", async (_event, newConfig) => {
  currentConfig = await saveConfig(newConfig);
  setupScheduler();
  if (currentConfig.autoStart !== undefined) {
    app.setLoginItemSettings({
      openAtLogin: Boolean(currentConfig.autoStart),
      path: process.execPath,
      args: ["--hidden"],
    });
  }
  updateTrayMenu();
  return currentConfig;
});

ipcMain.handle("app:openUrl", (_event, url) => {
  shell.openExternal(url || DEFAULT_PORTAL_URL);
});

ipcMain.handle("app:minimizeToTray", () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.hide();
  }
});

ipcMain.handle("app:getVersion", () => {
  return app.getVersion();
});

ipcMain.handle("app:quitAndInstall", () => {
  autoUpdater.quitAndInstall(false, true);
});

// === ORDER EXPORT HANDLERS ===
ipcMain.handle("order:saveImage", async (_event, dataUrl, defaultName) => {
  const {canceled, filePath} = await dialog.showSaveDialog({
    defaultPath: defaultName || "order.png",
    filters: [{name: "PNG Image", extensions: ["png"]}],
  });
  if (canceled || !filePath) return {success: false};

  try {
    const base64 = dataUrl.replace(/^data:image\/png;base64,/, "");
    await fs.writeFile(filePath, Buffer.from(base64, "base64"));
    return {success: true, filePath};
  } catch (err) {
    console.error("Lỗi lưu ảnh:", err);
    return {success: false, error: err.message};
  }
});

ipcMain.handle("order:savePDF", async (_event, htmlContent, defaultName) => {
  const {canceled, filePath} = await dialog.showSaveDialog({
    defaultPath: defaultName || "order.pdf",
    filters: [{name: "PDF", extensions: ["pdf"]}],
  });
  if (canceled || !filePath) return {success: false};

  try {
    const pdfWin = new BrowserWindow({show: false, width: 800, height: 600});
    await pdfWin.loadURL(
      `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`,
    );
    const pdfBuffer = await pdfWin.webContents.printToPDF({
      printBackground: true,
      pageSize: "A4",
      margins: {top: 0.4, bottom: 0.4, left: 0.4, right: 0.4},
    });
    await fs.writeFile(filePath, pdfBuffer);
    pdfWin.close();
    return {success: true, filePath};
  } catch (err) {
    console.error("Lỗi lưu PDF:", err);
    return {success: false, error: err.message};
  }
});

function sendUpdateToWindow(data) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("update:status", data);
  }
}

ipcMain.handle("app:checkUpdate", async () => {
  if (!app.isPackaged) {
    return {
      success: false,
      message:
        "Ứng dụng đang ở môi trường Dev (Chưa được đóng gói thành file .exe)",
    };
  }
  try {
    autoUpdater.allowPrerelease = true;
    const result = await autoUpdater.checkForUpdates();
    const currentVer = app.getVersion();
    const latestVer = result?.updateInfo?.version;

    if (latestVer && latestVer !== currentVer) {
      return {
        success: true,
        isLatest: false,
        message: `🎉 Đã có bản cập nhật mới v${latestVer}! Đang tự động tải về...`,
        updateInfo: result.updateInfo,
      };
    } else {
      return {
        success: true,
        isLatest: true,
        message: `✅ Bạn đang sử dụng phiên bản mới nhất (v${currentVer}).`,
        updateInfo: result ? result.updateInfo : null,
      };
    }
  } catch (err) {
    console.error("❌ Lỗi check update:", err);
    const errStr = String(err?.message || err);
    const statusCode = err?.statusCode || err?.response?.statusCode;

    let msg = "Không thể kết nối máy chủ cập nhật.";
    if (
      statusCode === 404 ||
      errStr.includes("404") ||
      errStr.includes("latest.yml") ||
      errStr.includes("Cannot find") ||
      errStr.includes("disabled for this repository")
    ) {
      msg =
        "Chưa tìm thấy bản Release chính thức (hoặc file latest.yml) nào trên GitHub Repo. Vui lòng kiểm tra nhãn Release trên GitHub.";
    } else if (
      errStr.includes("ENOTFOUND") ||
      errStr.includes("net::ERR") ||
      errStr.includes("offline")
    ) {
      msg = "Không có kết nối Internet hoặc không thể kết nối tới GitHub.";
    } else {
      msg = errStr.split("\n")[0].split(": headers:")[0].substring(0, 120);
    }
    return {success: false, error: msg};
  }
});

function setupAutoUpdater() {
  if (!app.isPackaged) {
    console.log("ℹ️ Môi trường Dev: Bỏ qua Auto Update.");
    return;
  }

  autoUpdater.autoDownload = true;
  autoUpdater.allowPrerelease = true;

  autoUpdater.on("checking-for-update", () => {
    console.log("🔍 Đang kiểm tra bản cập nhật mới...");
    sendUpdateToWindow({
      status: "checking",
      message: "🔍 Đang kiểm tra máy chủ cập nhật...",
    });
  });

  autoUpdater.on("update-available", (info) => {
    console.log(`🎉 Tìm thấy bản cập nhật mới v${info.version}`);
    sendUpdateToWindow({
      status: "available",
      version: info.version,
      message: `🎉 Đã tìm thấy bản cập nhật v${info.version}! Đang tự động tải về...`,
    });
    if (Notification.isSupported()) {
      new Notification({
        title: "🚀 Đã Có Bản Cập Nhật Mới!",
        body: `Phiên bản v${info.version} đang được tải xuống tự động...`,
      }).show();
    }
  });

  autoUpdater.on("update-not-available", () => {
    console.log("✅ Bạn đang sử dụng phiên bản mới nhất.");
    sendUpdateToWindow({
      status: "not-available",
      version: app.getVersion(),
      message: `✅ Bạn đang sử dụng phiên bản mới nhất (v${app.getVersion()}).`,
    });
  });

  autoUpdater.on("download-progress", (progressObj) => {
    const percent = Math.round(progressObj.percent || 0);
    const speedKB = Math.round((progressObj.bytesPerSecond || 0) / 1024);
    console.log(`📥 Đang tải: ${percent}% (${speedKB} KB/s)`);
    sendUpdateToWindow({
      status: "downloading",
      percent,
      speedKB,
      message: `📥 Đang tải xuống bản cập nhật... ${percent}% (${speedKB} KB/s)`,
    });
  });

  autoUpdater.on("update-downloaded", (info) => {
    console.log("📦 Bản cập nhật đã sẵn sàng!");
    sendUpdateToWindow({
      status: "downloaded",
      version: info.version,
      message: `🎉 Bản v${info.version} đã tải xuống hoàn tất! Sẵn sàng cài đặt.`,
    });
    if (Notification.isSupported()) {
      const noti = new Notification({
        title: "🎉 Cập Nhật Hoàn Tất",
        body: `Bản v${info.version} đã tải xong. Nhấn vào đây để khởi động lại ứng dụng và cập nhật!`,
      });
      noti.on("click", () => {
        autoUpdater.quitAndInstall(false, true);
      });
      noti.show();
    }
  });

  autoUpdater.on("error", (err) => {
    console.error("⚠️ Lỗi kiểm tra/tải cập nhật:", err?.message || err);
    const rawMsg = err?.message || String(err);
    const cleanMsg = rawMsg.split("\n")[0].substring(0, 120);
    sendUpdateToWindow({
      status: "error",
      error: cleanMsg,
      message: `❌ Lỗi tải cập nhật: ${cleanMsg}`,
    });
  });

  setTimeout(() => {
    autoUpdater
      .checkForUpdatesAndNotify()
      .catch((err) => console.error("AutoUpdate Err:", err));
  }, 5000);

  setInterval(
    () => {
      autoUpdater
        .checkForUpdatesAndNotify()
        .catch((err) => console.error("AutoUpdate Err:", err));
    },
    2 * 60 * 60 * 1000,
  );
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    // Không quit nếu vẫn duy trì chạy ngầm ở Tray
  }
});
