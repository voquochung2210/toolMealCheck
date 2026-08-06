import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import html2canvas from 'html2canvas';
import { toast } from '../ui/Message';

const OrderExport = forwardRef(({ order, items }, ref) => {
  const exportRef = useRef(null);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  const getHtmlContent = () => {
    if (!exportRef.current) return '';
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Order Export - ${order.title}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #333; margin: 0; padding: 20px; background: #fff; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #eee; padding-bottom: 10px; }
          h2 { margin: 0 0 5px; color: #111; }
          .meta { font-size: 14px; color: #666; margin-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f9f9f9; font-weight: bold; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .total { font-size: 16px; font-weight: bold; text-align: right; margin-bottom: 20px; }
          .qr-section { text-align: center; margin-top: 30px; border-top: 2px solid #eee; padding-top: 20px; }
          .qr-img { max-width: 300px; max-height: 300px; border: 1px solid #eee; border-radius: 8px; margin-bottom: 10px; }
          .bank-info { font-size: 14px; font-weight: bold; color: #444; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>${order.title}</h2>
          <div class="meta">Mã order: #${order.id}</div>
          <div class="meta">Tiệm: ${order.shop_name || 'Không xác định'}</div>
          <div class="meta">Người tạo: ${order.created_by_name}</div>
          <div class="meta">Ngày: ${new Date(order.created_at).toLocaleString('vi-VN')}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th class="text-center" style="width: 30px;">#</th>
              <th>Người Đặt</th>
              <th>Món</th>
              <th>Size</th>
              <th>Đường/Đá</th>
              <th class="text-center">SL</th>
              <th class="text-right">Thành Tiền</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((item, index) => `
              <tr>
                <td class="text-center">${index + 1}</td>
                <td>
                  <strong>${item.user_name}</strong>
                  ${item.note ? `<br><small style="color: #666;">📝 ${item.note}</small>` : ''}
                </td>
                <td><strong>${item.drink_name}</strong></td>
                <td>${item.size}</td>
                <td>${item.sugar_level} / ${item.ice_level}</td>
                <td class="text-center"><strong>${item.quantity}</strong></td>
                <td class="text-right"><strong>${formatCurrency(item.price * item.quantity)}đ</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="total">
          Tổng cộng (${order.total_items} món): <span style="color: #e53e3e;">${formatCurrency(order.total_amount)}đ</span>
        </div>

        ${order.qr_image_base64 ? `
          <div class="qr-section">
            <h4>QR Chuyển Khoản</h4>
            <img src="${order.qr_image_base64}" class="qr-img" />
            <div class="bank-info">${order.bank_info || ''}</div>
          </div>
        ` : ''}
      </body>
      </html>
    `;
  };

  useImperativeHandle(ref, () => ({
    exportImage: async () => {
      if (!exportRef.current) return;
      try {
        const canvas = await html2canvas(exportRef.current, {
          scale: 2, // Tăng chất lượng ảnh
          useCORS: true,
          backgroundColor: '#ffffff'
        });
        const dataUrl = canvas.toDataURL('image/png');
        if (window.electronAPI) {
          const defaultName = `Order_${order.title.replace(/\s+/g, '_')}_${new Date().getTime()}.png`;
          const res = await window.electronAPI.saveOrderImage(dataUrl, defaultName);
          if (res.success) {
            toast.success('Lưu ảnh thành công!');
          }
        }
      } catch (err) {
        console.error("Export Image Error:", err);
        toast.error('Có lỗi khi tạo ảnh.');
      }
    },
    exportPDF: async () => {
      try {
        const html = getHtmlContent();
        if (window.electronAPI) {
          const defaultName = `Order_${order.title.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`;
          const res = await window.electronAPI.saveOrderPDF(html, defaultName);
          if (res.success) {
            toast.success('Lưu PDF thành công!');
          }
        }
      } catch (err) {
        console.error("Export PDF Error:", err);
        toast.error('Có lỗi khi tạo PDF.');
      }
    }
  }));

  // Render hidden component for html2canvas
  return (
    <div style={{ overflow: 'hidden', height: 0, position: 'absolute', zIndex: -1000 }}>
      <div ref={exportRef} className="export-preview">
        <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
          <h2 style={{ margin: '0 0 5px' }}>{order.title}</h2>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Mã order: #{order.id}</div>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Tiệm: {order.shop_name || 'Không xác định'}</div>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Người tạo: {order.created_by_name}</div>
          <div style={{ fontSize: '14px', color: '#666' }}>Ngày: {new Date(order.created_at).toLocaleString('vi-VN')}</div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '14px' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #ddd', padding: '8px', background: '#f9f9f9', width: '30px', textAlign: 'center' }}>#</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', background: '#f9f9f9', textAlign: 'left' }}>Người Đặt</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', background: '#f9f9f9', textAlign: 'left' }}>Món</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', background: '#f9f9f9', textAlign: 'left' }}>Size</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', background: '#f9f9f9', textAlign: 'left' }}>Đường/Đá</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', background: '#f9f9f9', textAlign: 'center' }}>SL</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', background: '#f9f9f9', textAlign: 'right' }}>Thành Tiền</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.id}>
                <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>{index + 1}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                  <strong>{item.user_name}</strong>
                  {item.note && <div style={{ fontSize: '12px', color: '#666' }}>📝 {item.note}</div>}
                </td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}><strong>{item.drink_name}</strong></td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.size}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.sugar_level} / {item.ice_level}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}><strong>{item.quantity}</strong></td>
                <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}><strong>{formatCurrency(item.price * item.quantity)}đ</strong></td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ fontSize: '16px', fontWeight: 'bold', textAlign: 'right', marginBottom: '20px' }}>
          Tổng cộng ({order.total_items} món): <span style={{ color: '#e53e3e' }}>{formatCurrency(order.total_amount)}đ</span>
        </div>

        {order.qr_image_base64 && (
          <div style={{ textAlign: 'center', marginTop: '30px', borderTop: '2px solid #eee', paddingTop: '20px' }}>
            <h4 style={{ margin: '0 0 10px' }}>QR Chuyển Khoản</h4>
            <img src={order.qr_image_base64} alt="QR" style={{ maxWidth: '300px', maxHeight: '300px', border: '1px solid #eee', borderRadius: '8px', marginBottom: '10px' }} />
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#444' }}>{order.bank_info}</div>
          </div>
        )}
      </div>
    </div>
  );
});

export default OrderExport;
