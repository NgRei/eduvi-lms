// Ảnh placeholder cục bộ (SVG data-URI) dùng khi khóa học chưa có thumbnail.
// Không phụ thuộc dịch vụ ngoài như via.placeholder.com (đã ngừng hoạt động).
export const COURSE_PLACEHOLDER_IMG =
  'data:image/svg+xml;charset=UTF-8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200">
      <rect width="300" height="200" fill="#F3F0FF"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
        fill="#8C7AE6" font-family="Arial, sans-serif" font-size="18">Khóa học</text>
    </svg>`,
  );
