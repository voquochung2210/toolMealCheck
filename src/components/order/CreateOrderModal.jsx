import {useState, useEffect, useRef} from "react";
import {qrService} from "../../services/qrService";
import {shopService} from "../../services/shopService";
import {orderService} from "../../services/orderService";
import {Upload, Check, Eye, EyeOff} from "lucide-react";
import {Input} from "../ui/Input";
import {Select} from "../ui/Select";
import {toast} from "../ui/Message";
import ImagePreviewModal from "../ui/ImagePreviewModal";

export default function CreateOrderModal({user, onClose, onSuccess}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [shopId, setShopId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [shops, setShops] = useState([]);

  // QR State
  const [qrProfile, setQrProfile] = useState(null);
  const [useCustomQr, setUseCustomQr] = useState(false);
  const [customQrImage, setCustomQrImage] = useState("");
  const [customBankName, setCustomBankName] = useState("");
  const [customBankAccount, setCustomBankAccount] = useState("");
  const [customAccountName, setCustomAccountName] = useState("");
  const [saveAsDefault, setSaveAsDefault] = useState(false);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewSrc, setPreviewSrc] = useState("");

  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadInitialData = async () => {
    try {
      const [shopsData, qrData] = await Promise.all([
        shopService.fetchShops(),
        qrService.getMyQRProfile(user.userName),
      ]);
      setShops(shopsData);

      if (qrData) {
        setQrProfile(qrData);
        setUseCustomQr(false);
      } else {
        setUseCustomQr(true);
        setSaveAsDefault(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      return toast.error("Vui lòng chỉ chọn file hình ảnh!");
    }

    if (file.size > 30 * 1024 * 1024) {
      return toast.error("Kích thước ảnh vượt quá giới hạn 30MB!");
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setCustomQrImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title) return toast.error("Vui lòng nhập tiêu đề!");

    setLoading(true);
    try {
      let finalQrBase64 = "";
      let finalBankInfo = "";

      if (useCustomQr) {
        if (!customQrImage) {
          setLoading(false);
          return toast.error("Vui lòng upload ảnh QR!");
        }
        finalQrBase64 = customQrImage;
        finalBankInfo = [customBankName, customBankAccount, customAccountName]
          .filter(Boolean)
          .join(" - ");

        if (saveAsDefault) {
          await qrService.saveQRProfile({
            user_id: user.userName,
            user_name: user.fullName || user.userName,
            qr_image_base64: customQrImage,
            bank_name: customBankName,
            bank_account: customBankAccount,
            bank_account_name: customAccountName,
          });
        }
      } else if (qrProfile) {
        finalQrBase64 = qrProfile.qr_image_base64;
        finalBankInfo = [
          qrProfile.bank_name,
          qrProfile.bank_account,
          qrProfile.bank_account_name,
        ]
          .filter(Boolean)
          .join(" - ");
      }

      const orderData = {
        title,
        description,
        shop_id: shopId || null,
        shop_name: shopId ? shops.find((s) => s.id === shopId)?.name : null,
        password: password || null,
        created_by: user.userName,
        created_by_name: user.fullName || user.userName,
        qr_image_base64: finalQrBase64,
        bank_info: finalBankInfo,
      };

      await orderService.createOrder(orderData);
      toast.success("Tạo order thành công!");
      onSuccess();
    } catch (err) {
      toast.error("Lỗi tạo order: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel modal-content" style={{maxWidth: "500px"}}>
        <h2 className="modal-title">Tạo Order Nước Mới</h2>

        <form onSubmit={handleSubmit}>
          <Input
            label="Tiêu đề order *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="VD: Trà chiều thứ 3"
            maxLength={100}
            required
            containerStyle={{marginBottom: "15px"}}
          />

          <Select
            label="Chọn tiệm"
            value={shopId}
            onChange={(e) => setShopId(e.target.value)}
            containerStyle={{marginBottom: "15px"}}
          >
            <option value="">-- Order tự do --</option>
            {shops.map((shop) => (
              <option key={shop.id} value={shop.id}>
                {shop.name}
              </option>
            ))}
          </Select>

          <Input
            label="Mô tả (Tùy chọn)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ghi chú thêm..."
            maxLength={500}
            containerStyle={{marginBottom: "15px"}}
          />

          <Input
            label="Mật khẩu order (Tùy chọn)"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Để trống nếu muốn công khai"
            maxLength={50}
            containerStyle={{marginBottom: "20px"}}
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  padding: 0,
                  display: "flex",
                }}
                title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            }
          />

          <div
            style={{
              borderTop: "1px solid var(--glass-border)",
              margin: "20px 0",
            }}
          ></div>

          <div className="form-group" style={{marginBottom: "15px"}}>
            <label>QR Chuyển khoản *</label>

            {qrProfile && !useCustomQr ? (
              <div
                style={{
                  padding: "15px",
                  background: "var(--btn-secondary-bg)",
                  borderRadius: "8px",
                  border: "1px solid var(--glass-border)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: "var(--success-text)",
                    marginBottom: "10px",
                    fontWeight: 600,
                  }}
                >
                  <Check size={16} /> Đã có QR lưu sẵn
                </div>
                <div style={{display: "flex", gap: "15px"}}>
                  <div
                    className="image-preview-wrapper"
                    style={{
                      width: "80px",
                      height: "80px",
                      borderRadius: "4px",
                      background: "white",
                    }}
                    onClick={() => {
                      setPreviewSrc(qrProfile.qr_image_base64);
                      setIsPreviewOpen(true);
                    }}
                  >
                    <img
                      src={qrProfile.qr_image_base64}
                      alt="QR"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                      }}
                    />
                    <div className="image-preview-overlay">
                      <div
                        className="image-preview-icon"
                        style={{padding: "6px"}}
                      >
                        <Eye size={16} />
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: "0.85rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    <div>Ngân hàng: {qrProfile.bank_name || "-"}</div>
                    <div>Số TK: {qrProfile.bank_account || "-"}</div>
                    <div>Tên: {qrProfile.bank_account_name || "-"}</div>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{
                        marginTop: "5px",
                        padding: "2px 8px",
                        fontSize: "0.75rem",
                      }}
                      onClick={() => setUseCustomQr(true)}
                    >
                      Đổi QR khác
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                style={{
                  padding: "15px",
                  background: "var(--btn-secondary-bg)",
                  borderRadius: "8px",
                  border: "1px dashed var(--glass-border)",
                }}
              >
                {qrProfile && (
                  <button
                    type="button"
                    className="btn-icon"
                    style={{
                      float: "right",
                      fontSize: "0.8rem",
                      width: "auto",
                      padding: "2px 8px",
                    }}
                    onClick={() => setUseCustomQr(false)}
                  >
                    Dùng QR lưu sẵn
                  </button>
                )}

                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  style={{display: "none"}}
                  onChange={handleImageUpload}
                />

                <div
                  style={{
                    display: "flex",
                    gap: "15px",
                    alignItems: "flex-start",
                    marginBottom: "15px",
                  }}
                >
                  <div
                    style={{
                      width: "100px",
                      height: "100px",
                      background: "var(--bg-primary)",
                      border: "1px solid var(--glass-border)",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                      position: "relative",
                    }}
                  >
                    {customQrImage ? (
                      <div
                        className="image-preview-wrapper"
                        style={{width: "100%", height: "100%"}}
                        onClick={() => {
                          setPreviewSrc(customQrImage);
                          setIsPreviewOpen(true);
                        }}
                      >
                        <img
                          src={customQrImage}
                          alt="QR"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                        <div className="image-preview-overlay">
                          <div
                            className="image-preview-icon"
                            style={{padding: "8px"}}
                          >
                            <Eye size={20} />
                          </div>
                        </div>
                        <button
                          type="button"
                          className="btn-icon"
                          style={{
                            position: "absolute",
                            top: 2,
                            right: 2,
                            background: "rgba(0,0,0,0.5)",
                            color: "white",
                            padding: "4px",
                            borderRadius: "4px",
                            zIndex: 10,
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            fileInputRef.current.click();
                          }}
                        >
                          <Upload size={12} />
                        </button>
                      </div>
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                        }}
                        onClick={() => fileInputRef.current.click()}
                      >
                        <Upload size={24} color="var(--text-muted)" />
                      </div>
                    )}
                  </div>
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    <Input
                      placeholder="Ngân hàng"
                      value={customBankName}
                      onChange={(e) => setCustomBankName(e.target.value)}
                      maxLength={100}
                    />
                    <Input
                      placeholder="Số TK"
                      value={customBankAccount}
                      onChange={(e) => setCustomBankAccount(e.target.value)}
                      maxLength={50}
                    />
                    <Input
                      placeholder="Tên chủ TK"
                      value={customAccountName}
                      onChange={(e) => setCustomAccountName(e.target.value)}
                      maxLength={100}
                    />
                  </div>
                </div>

                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "0.85rem",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={saveAsDefault}
                    onChange={(e) => setSaveAsDefault(e.target.checked)}
                  />
                  Lưu làm QR mặc định cho các order sau
                </label>
              </div>
            )}
          </div>

          <div style={{display: "flex", gap: "10px", marginTop: "20px"}}>
            <button
              type="button"
              className="btn-secondary"
              style={{flex: 1}}
              onClick={onClose}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="btn-primary"
              style={{flex: 1}}
              disabled={loading}
            >
              {loading ? "Đang tạo..." : "Tạo Order"}
            </button>
          </div>
        </form>
      </div>

      <ImagePreviewModal
        isOpen={isPreviewOpen}
        src={previewSrc}
        onClose={() => setIsPreviewOpen(false)}
      />
    </div>
  );
}
