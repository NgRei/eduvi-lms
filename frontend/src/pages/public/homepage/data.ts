export type Course = {
  id: string;
  title: string;
  category: string;
  badge: string;
  instructor: string;
  instructorInitials: string;
  rating: number;
  reviews: number;
  level: "Cơ bản" | "Trung cấp";
  price: number;
  originalPrice?: number;
  imageSlot: "react" | "data" | "design" | "cloud";
};

export const courses: Course[] = [
  {
    id: "react-thuc-chien",
    title: "React thực chiến: Xây dựng ứng dụng từ A–Z",
    category: "Lập trình",
    badge: "Bestseller",
    instructor: "Nguyễn Minh Hoàng",
    instructorInitials: "MH",
    rating: 4.9,
    reviews: 128,
    level: "Cơ bản",
    price: 499000,
    originalPrice: 799000,
    imageSlot: "react",
  },
  {
    id: "data-analytics",
    title: "Phân tích dữ liệu và kể chuyện bằng dashboard",
    category: "Data",
    badge: "Phổ biến",
    instructor: "Trần Ngọc Anh",
    instructorInitials: "NA",
    rating: 4.8,
    reviews: 94,
    level: "Trung cấp",
    price: 0,
    imageSlot: "data",
  },
  {
    id: "ui-ux-foundation",
    title: "UI/UX Foundation: Thiết kế sản phẩm dễ sử dụng",
    category: "Thiết kế",
    badge: "Mới",
    instructor: "Lê Thảo Vy",
    instructorInitials: "TV",
    rating: 4.9,
    reviews: 76,
    level: "Cơ bản",
    price: 349000,
    originalPrice: 549000,
    imageSlot: "design",
  },
  {
    id: "cloud-devops",
    title: "Cloud & DevOps cho lập trình viên hiện đại",
    category: "Cloud",
    badge: "Được yêu thích",
    instructor: "Phạm Quốc Bảo",
    instructorInitials: "QB",
    rating: 4.7,
    reviews: 63,
    level: "Trung cấp",
    price: 429000,
    imageSlot: "cloud",
  },
];

export const testimonials = [
  {
    quote:
      "Lộ trình rất rõ ràng, bài tập vừa đủ thử thách. Sau ba tháng mình đã tự tin ứng tuyển vị trí frontend đầu tiên.",
    name: "Nguyễn Gia An",
    role: "Học viên · React thực chiến",
    initials: "GA",
  },
  {
    quote:
      "Điều mình thích nhất là cách giảng viên giải thích bằng tình huống thật. Mình có thể áp dụng ngay vào công việc mỗi tuần.",
    name: "Trần Khánh Linh",
    role: "Học viên · Data Analytics",
    initials: "KL",
  },
  {
    quote:
      "Chứng chỉ có mã xác thực giúp hồ sơ của mình chuyên nghiệp hơn. Trải nghiệm học trên điện thoại cũng rất mượt.",
    name: "Lê Minh Đức",
    role: "Học viên · UI/UX Foundation",
    initials: "MĐ",
  },
  {
    quote:
      "Nội dung gọn, thực tế và không tạo áp lực deadline. Mình học vào buổi tối và vẫn theo kịp lộ trình đề xuất.",
    name: "Phạm Ngọc Mai",
    role: "Học viên · Cloud & DevOps",
    initials: "NM",
  },
];

export const stats = [
  { value: 52, suffix: "+", label: "Khóa học", note: "Đã xuất bản" },
  { value: 12, suffix: "+", label: "Giảng viên", note: "Đang đồng hành" },
  { value: 234, suffix: "+", label: "Học viên", note: "Đã bắt đầu học" },
  { value: 95, suffix: "%", label: "Hoàn thành", note: "Theo đúng lộ trình" },
];

