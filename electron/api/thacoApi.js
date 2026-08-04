import dotenv from "dotenv";
dotenv.config();

const API_TOKEN_URL =
  process.env.THACO_API_TOKEN_URL ||
  "https://portalgroupapi.thacochulai.vn/token";
const BASE_MEAL_API_URL =
  process.env.THACO_BASE_MEAL_API_URL ||
  "https://chamcongapi.thacochulai.vn/api/KeySecure/Portal/ThucDon";
const BASE_LOCATION_API_URL =
  process.env.THACO_BASE_LOCATION_API_URL ||
  "https://chamcongapi.thacochulai.vn/api/KeySecure/Portal/DiaDiemAn";
const STORAGE_BASE_URL =
  process.env.THACO_STORAGE_BASE_URL || "https://storageapi.thacochulai.vn/";

export function formatDateISO(dateObj) {
  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
  const dd = String(dateObj.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function getOptimalDateRange(rangeType = "upcoming", daysAhead = 7) {
  const today = new Date();
  const tuNgay = formatDateISO(today);

  if (rangeType === "today") {
    return {tuNgay, denNgay: tuNgay};
  }

  if (rangeType === "upcoming") {
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + daysAhead);
    return {tuNgay, denNgay: formatDateISO(futureDate)};
  }

  return {tuNgay, denNgay: tuNgay};
}

export function getDishImageUrl(item) {
  if (!item) return null;
  let rawPath = item.thumb_File_Url;
  if (!rawPath && item.lst_MonAns && Array.isArray(item.lst_MonAns)) {
    const registered =
      item.lst_MonAns.find((m) => m.isDangKy) || item.lst_MonAns[0];
    rawPath = registered ? registered.thumb_File_Url : null;
  }

  if (!rawPath) return null;
  const cleanPath = String(rawPath).trim().replace(/\s+/g, "");
  return `${STORAGE_BASE_URL}${cleanPath}`;
}

export function getRegisteredMeal(dayItem) {
  if (!dayItem || !Array.isArray(dayItem.lst_MonAns)) return null;
  const registeredDish = dayItem.lst_MonAns.find((m) => m.isDangKy === true);
  if (!registeredDish) return null;

  return {
    ...registeredDish,
    ngay: dayItem.ngay,
    thu: dayItem.thu,
    isKhoa: dayItem.isKhoa,
    isKhoaBepHoaThuan: dayItem.isKhoaBepHoaThuan,
  };
}

export async function loginApi({username, password, domain = ""}) {
  const response = await fetch(API_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({domain, password, username}),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(
      `Đăng nhập thất bại (${response.status}): ${errText || response.statusText}`,
    );
  }

  const data = await response.json();
  if (!data || !data.token) {
    throw new Error("Dữ liệu trả về không hợp lệ hoặc thiếu Token.");
  }

  return data;
}

export async function fetchLocationList({
  token,
  maNhanVien,
  apiKey = process.env.THACO_API_KEY,
}) {
  const queryParams = new URLSearchParams({MaNhanVien: maNhanVien});
  const url = `${BASE_LOCATION_API_URL}?${queryParams.toString()}`;

  const headers = {Authorization: `Bearer ${token}`};
  if (apiKey) {
    headers["ApiKey"] = apiKey;
  }

  const response = await fetch(url, {headers});
  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      `Lỗi API địa điểm ăn (${response.status}): ${errorText || response.statusText}`,
    );
  }

  const data = await response.json();
  const locationList = data.result || (Array.isArray(data) ? data : []);
  const diaDiemAnId =
    data.diaDiemAn_Id || (locationList.length > 0 ? locationList[0].id : null);
  const selectedLocation =
    locationList.find((loc) => loc.id === diaDiemAnId) ||
    locationList[0] ||
    null;

  return {
    diaDiemAnId,
    locationList,
    selectedLocation,
  };
}

export async function fetchMealList({
  token,
  maNhanVien,
  tuNgay,
  denNgay,
  diaDiemAnId,
  apiKey = process.env.THACO_API_KEY,
}) {
  const dateRange =
    tuNgay && denNgay ? {tuNgay, denNgay} : getOptimalDateRange("upcoming", 7);

  let activeDiaDiemAnId = diaDiemAnId;
  let selectedLocation = null;

  if (!activeDiaDiemAnId) {
    const locResult = await fetchLocationList({token, maNhanVien, apiKey});
    activeDiaDiemAnId = locResult.diaDiemAnId;
    selectedLocation = locResult.selectedLocation;
  }

  if (!activeDiaDiemAnId) {
    throw new Error("Không tìm thấy địa điểm ăn cho nhân viên.");
  }

  const queryParams = new URLSearchParams({
    MaNhanVien: maNhanVien,
    TuNgay: dateRange.tuNgay,
    DenNgay: dateRange.denNgay,
    DiaDiemAn_Id: activeDiaDiemAnId,
  });

  const url = `${BASE_MEAL_API_URL}?${queryParams.toString()}`;
  const headers = {Authorization: `Bearer ${token}`};
  if (apiKey) {
    headers["ApiKey"] = apiKey;
  }

  const response = await fetch(url, {headers});
  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      `Lỗi API thực đơn (${response.status}): ${errorText || response.statusText}`,
    );
  }

  const days = await response.json();
  return {
    days: Array.isArray(days) ? days : [],
    diaDiemAnId: activeDiaDiemAnId,
    selectedLocation,
  };
}
