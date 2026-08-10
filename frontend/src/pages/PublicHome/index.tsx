import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  Check,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Cloud,
  Code2,
  GraduationCap,
  Headphones,
  Layers3,
  LockKeyhole,
  Mail,
  Menu,
  Palette,
  Play,
  Quote,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Target,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { FaFacebookF, FaLinkedinIn, FaYoutube } from "react-icons/fa6";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useModel } from "@umijs/max";
import { courses, IMAGES, stats, testimonials, type Course } from "./data";
import "./index.css";

type StatItemProps = {
  value: number;
  suffix: string;
  label: string;
  note: string;
  icon: LucideIcon;
};

type Category = {
  name: string;
  count: number;
  slug: string;
  icon: LucideIcon;
  tone: string;
};

type Feature = {
  title: string;
  description: string;
  icon: LucideIcon;
  accent: string;
};

const categoryItems: Category[] = [
  { name: "Lập trình", count: 12, slug: "lap-trinh", icon: Code2, tone: "indigo" },
  { name: "Phân tích dữ liệu", count: 8, slug: "data", icon: BarChart3, tone: "emerald" },
  { name: "Thiết kế", count: 6, slug: "thiet-ke", icon: Palette, tone: "violet" },
  { name: "Mobile", count: 5, slug: "mobile", icon: Smartphone, tone: "rose" },
  { name: "Web Development", count: 10, slug: "web-dev", icon: Layers3, tone: "sky" },
  { name: "Bảo mật", count: 4, slug: "security", icon: LockKeyhole, tone: "amber" },
  { name: "Kỹ năng nghề nghiệp", count: 7, slug: "career", icon: BriefcaseBusiness, tone: "orange" },
  { name: "Cloud Computing", count: 3, slug: "cloud", icon: Cloud, tone: "blue" },
];

const featureItems: Feature[] = [
  {
    title: "Nội dung được tuyển chọn",
    description:
      "Mỗi khóa học đều qua quy trình đánh giá, cập nhật theo xu hướng và tập trung vào kỹ năng có thể áp dụng.",
    icon: Target,
    accent: "indigo",
  },
  {
    title: "Giảng viên giàu kinh nghiệm",
    description:
      "Học từ những người đang làm nghề, với ví dụ thực tế và phản hồi rõ ràng trong suốt lộ trình.",
    icon: Users,
    accent: "violet",
  },
  {
    title: "Chứng chỉ có thể xác thực",
    description:
      "Chứng chỉ hoàn thành đi kèm mã xác thực, giúp bạn bổ sung bằng chứng năng lực vào hồ sơ cá nhân.",
    icon: ShieldCheck,
    accent: "emerald",
  },
  {
    title: "Chi phí dễ tiếp cận",
    description:
      "Bắt đầu với nhiều khóa học miễn phí và lựa chọn premium phù hợp với sinh viên, người mới đi làm.",
    icon: CircleDollarSign,
    accent: "amber",
  },
  {
    title: "Học tốt trên mọi thiết bị",
    description:
      "Tiếp tục bài học trên máy tính, tablet hoặc điện thoại với trải nghiệm nhất quán và dễ theo dõi.",
    icon: Smartphone,
    accent: "sky",
  },
  {
    title: "Chủ động theo nhịp của bạn",
    description:
      "Lộ trình có cấu trúc nhưng không có deadline cứng nhắc, để việc học phù hợp với cuộc sống thực tế.",
    icon: Clock3,
    accent: "rose",
  },
];

const howItWorks = [
  {
    step: "01",
    title: "Tạo tài khoản miễn phí",
    description: "Bắt đầu chỉ trong 30 giây, không cần thẻ tín dụng.",
    icon: Users,
  },
  {
    step: "02",
    title: "Chọn lộ trình phù hợp",
    description: "Lọc theo lĩnh vực, cấp độ và mục tiêu nghề nghiệp của bạn.",
    icon: BookOpen,
  },
  {
    step: "03",
    title: "Hoàn thành và nhận chứng chỉ",
    description: "Học bài, làm bài kiểm tra và nhận chứng chỉ xác thực.",
    icon: GraduationCap,
  },
];

const statIcons = [BookOpen, GraduationCap, Users, Target];

const courseImageMap: Record<Course["imageSlot"], string> = {
  react: IMAGES.COURSES_DOT_REACT,
  data: IMAGES.COURSES_DOT_DATA,
  design: IMAGES.COURSES_DOT_DESIGN,
  cloud: IMAGES.COURSES_DOT_CLOUD,
};

const formatPrice = (price: number) =>
  price === 0 ? "Miễn phí" : `${new Intl.NumberFormat("vi-VN").format(price)}đ`;

const useRevealSections = () => {
  useEffect(() => {
    if (typeof document === "undefined" || !("IntersectionObserver" in window)) return;

    const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    sections.forEach((section) => {
      section.classList.add("reveal-ready");
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -40px" },
    );

    sections.forEach((section) => {
      observer.observe(section);
    });
    return () => observer.disconnect();
  }, []);
};

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { initialState } = useModel("@@initialState");
  const currentUser = initialState?.currentUser;

  const getDashboardPath = () => {
    if (!currentUser) return "/user/login";
    if (currentUser.access === "admin") return "/admin/dashboard";
    if (currentUser.access === "instructor") return "/instructor/dashboard";
    return "/student/dashboard";
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 80);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const closeMenu = () => setIsOpen(false);

  return (
    <header className={`public-header ${isScrolled ? "is-scrolled" : ""}`}>
      <div className="site-container header-inner">
        <a href="#top" className="brand-mark" aria-label="Eduvi - về đầu trang">
          <span className="brand-symbol" aria-hidden="true">
            <BookOpen size={21} strokeWidth={2.4} />
          </span>
          <span>Eduvi</span>
        </a>

        <nav className="desktop-nav" aria-label="Điều hướng chính">
          <a href="#top">Trang chủ</a>
          <a href="/courses">Khóa học</a>
          <a href="#why-eduvi">Về chúng tôi</a>
        </nav>

        <div className="desktop-actions">
          {currentUser ? (
            <a className="button button-sm button-primary" href={getDashboardPath()}>
              Vào trang học tập
              <ArrowUpRight size={16} />
            </a>
          ) : (
            <>
              <a className="text-link" href="/user/login">
                Đăng nhập
              </a>
              <a className="button button-sm button-primary" href="/user/register">
                Đăng ký miễn phí
                <ArrowUpRight size={16} />
              </a>
            </>
          )}
        </div>

        <button
          className="mobile-menu-button"
          type="button"
          aria-label={isOpen ? "Đóng menu" : "Mở menu"}
          aria-expanded={isOpen}
          onClick={() => setIsOpen((current) => !current)}
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <div className={`mobile-panel ${isOpen ? "is-open" : ""}`}>
        <nav aria-label="Điều hướng trên điện thoại">
          <a href="#top" onClick={closeMenu}>
            Trang chủ
          </a>
          <a href="/courses" onClick={closeMenu}>
            Khóa học
          </a>
          <a href="#why-eduvi" onClick={closeMenu}>
            Về chúng tôi
          </a>
        </nav>
        <div className="mobile-actions">
          {currentUser ? (
            <a className="button button-primary" href={getDashboardPath()}>
              Vào trang học tập
            </a>
          ) : (
            <>
              <a className="button button-secondary" href="/user/login">
                Đăng nhập
              </a>
              <a className="button button-primary" href="/user/register">
                Đăng ký miễn phí
              </a>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

const Hero = () => {
  const { initialState } = useModel("@@initialState");
  const currentUser = initialState?.currentUser;

  return (
    <section className="hero-section" id="top">
      <div className="hero-orb hero-orb-one" />
      <div className="hero-orb hero-orb-two" />
      <div className="site-container hero-grid">
        <div className="hero-copy">
          <div className="eyebrow hero-eyebrow">
            <Sparkles size={16} />
            Nền tảng học tập thế hệ mới
          </div>
          <h1>
            Học kỹ năng mới.
            <span> Mở lối tương lai.</span>
          </h1>
          <p className="hero-description">
            Khám phá các khóa học thực tiễn từ giảng viên giàu kinh nghiệm. Học theo tốc độ của
            bạn và nhận chứng chỉ xác thực khi hoàn thành.
          </p>
          <div className="hero-actions">
            <a className="button button-lg button-primary" href={currentUser ? "/courses" : "/user/register"}>
              {currentUser ? "Khám phá các khóa học" : "Bắt đầu học miễn phí"}
              <ArrowRight size={18} />
            </a>
            <a className="button button-lg button-ghost" href="/courses">
              <Play size={17} fill="currentColor" />
              Khám phá khóa học
            </a>
          </div>
          <div className="hero-trust">
            <div className="avatar-stack" aria-hidden="true">
              <span>AN</span>
              <span>KL</span>
              <span>MĐ</span>
              <span>+2</span>
            </div>
            <div>
              <div className="rating-line">
                <span className="stars" role="img" aria-label="5 trên 5 sao">
                  <Star size={14} fill="currentColor" />
                  <Star size={14} fill="currentColor" />
                  <Star size={14} fill="currentColor" />
                  <Star size={14} fill="currentColor" />
                  <Star size={14} fill="currentColor" />
                </span>
                <strong>4.9/5</strong>
              </div>
              <p>Được yêu thích bởi cộng đồng học viên</p>
            </div>
          </div>
        </div>

        <div className="hero-visual" role="region" aria-label="Minh họa trải nghiệm học trực tuyến">
          <img
            src={IMAGES.HOME_DOT_HERO}
            alt="Học viên đang học trực tuyến trên Eduvi với lộ trình và chứng chỉ"
            width={2304}
            height={1728}
          />
          <div className="floating-card progress-card">
            <span className="floating-icon emerald">
              <Check size={18} />
            </span>
            <div>
              <strong>Tiến độ tuần này</strong>
              <p>5/6 bài học hoàn thành</p>
            </div>
            <div className="mini-progress">
              <span />
            </div>
          </div>
          <div className="floating-card certificate-card">
            <span className="floating-icon violet">
              <GraduationCap size={19} />
            </span>
            <div>
              <strong>Chứng chỉ mới</strong>
              <p>Đã sẵn sàng xác thực</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const StatItem = ({ value, suffix, label, note, icon: Icon }: StatItemProps) => {
  const [displayValue, setDisplayValue] = useState<number | null>(null);
  const itemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = itemRef.current;
    if (!element || !("IntersectionObserver" in window)) return;

    let frame = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        const startedAt = performance.now();
        const duration = 900;

        const tick = (now: number) => {
          const progress = Math.min((now - startedAt) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setDisplayValue(Math.round(value * eased));
          if (progress < 1) frame = requestAnimationFrame(tick);
        };
        setDisplayValue(0);
        frame = requestAnimationFrame(tick);
        observer.disconnect();
      },
      { threshold: 0.5 },
    );
    observer.observe(element);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value]);

  return (
    <div className="stat-item" ref={itemRef}>
      <span className="stat-icon">
        <Icon size={21} />
      </span>
      <div className="stat-number">
        {displayValue ?? value}
        {suffix}
      </div>
      <strong>{label}</strong>
      <span>{note}</span>
    </div>
  );
};

const StatsSection = () => (
  <section className="stats-section" aria-label="Số liệu nổi bật">
    <div className="site-container stats-grid">
      {stats.map((stat, index) => (
        <StatItem key={stat.label} {...stat} icon={statIcons[index] ?? Target} />
      ))}
    </div>
  </section>
);

const SectionHeading = ({
  eyebrow,
  title,
  description,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  description: string;
  align?: "center" | "left";
}) => (
  <div className={`section-heading ${align === "left" ? "is-left" : ""}`}>
    <span className="eyebrow">{eyebrow}</span>
    <h2>{title}</h2>
    <p>{description}</p>
  </div>
);

const CourseCard = ({ course }: { course: Course }) => (
  <a className="course-card" href={`/courses/${course.id}`}>
    <div className={`course-image course-image-${course.imageSlot}`}>
      <img
        src={courseImageMap[course.imageSlot]}
        alt={`Minh họa ${course.title}`}
        width={2848}
        height={1600}
        loading="lazy"
      />
      <span className="course-badge">{course.badge}</span>
    </div>
    <div className="course-body">
      <div className="course-category">{course.category}</div>
      <h3>{course.title}</h3>
      <div className="instructor-line">
        <span className="instructor-avatar">{course.instructorInitials}</span>
        <span>{course.instructor}</span>
      </div>
      <div className="course-meta">
        <span className="course-rating">
          <Star size={14} fill="currentColor" />
          <strong>{course.rating}</strong>
          <span>({course.reviews})</span>
        </span>
        <span className="meta-divider" />
        <span>{course.level}</span>
      </div>
      <div className="course-footer">
        <div>
          <strong className={course.price === 0 ? "free-price" : ""}>
            {formatPrice(course.price)}
          </strong>
          {course.originalPrice ? <del>{formatPrice(course.originalPrice)}</del> : null}
        </div>
        <span className="course-arrow">
          <ArrowUpRight size={18} />
        </span>
      </div>
    </div>
  </a>
);

const CoursesSection = () => (
  <section className="section section-light" id="courses" data-reveal>
    <div className="site-container">
      <div className="section-heading-row">
        <SectionHeading
          align="left"
          eyebrow="Học ngay hôm nay"
          title="Khóa học được yêu thích nhất"
          description="Những lộ trình thực tiễn đang giúp học viên phát triển kỹ năng và tiến gần hơn tới mục tiêu nghề nghiệp."
        />
        <a className="inline-link desktop-only-link" href="/courses">
          Xem tất cả khóa học
          <ArrowRight size={17} />
        </a>
      </div>
      <div className="course-grid">
        {courses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
      <a className="button button-secondary mobile-section-cta" href="/courses">
        Xem tất cả khóa học
        <ArrowRight size={17} />
      </a>
    </div>
  </section>
);

const CategoriesSection = () => (
  <section className="section" data-reveal>
    <div className="site-container">
      <SectionHeading
        eyebrow="Tìm đúng lĩnh vực"
        title="Khám phá theo mục tiêu của bạn"
        description="Từ kỹ năng công nghệ đến năng lực nghề nghiệp, hãy bắt đầu ở nơi phù hợp nhất với định hướng hiện tại."
      />
      <div className="category-grid">
        {categoryItems.map((category) => {
          const Icon = category.icon;
          return (
            <a
              className="category-card"
              href={`/courses?category=${category.slug}`}
              key={category.slug}
            >
              <span className={`category-icon tone-${category.tone}`}>
                <Icon size={24} />
              </span>
              <div>
                <h3>{category.name}</h3>
                <p>{category.count} khóa học</p>
              </div>
              <ChevronRight size={18} className="category-arrow" />
            </a>
          );
        })}
      </div>
    </div>
  </section>
);

const HowItWorksSection = () => (
  <section className="section how-section" data-reveal>
    <div className="site-container">
      <SectionHeading
        eyebrow="Đơn giản và rõ ràng"
        title="Bắt đầu hành trình chỉ với 3 bước"
        description="Eduvi giúp bạn tập trung vào điều quan trọng nhất: học đúng kỹ năng và nhìn thấy sự tiến bộ mỗi ngày."
      />
      <div className="steps-grid">
        {howItWorks.map((item, index) => {
          const Icon = item.icon;
          return (
            <div className="step-item" key={item.step}>
              <div className="step-top">
                <span className="step-number">{item.step}</span>
                {index < howItWorks.length - 1 ? <span className="step-line" /> : null}
              </div>
              <span className="step-icon">
                <Icon size={27} />
              </span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  </section>
);

const WhyEduviSection = () => (
  <section className="section why-section" id="why-eduvi" data-reveal>
    <div className="site-container why-layout">
      <div className="why-copy">
        <span className="eyebrow">Giá trị khác biệt</span>
        <h2>Một nền tảng được xây quanh sự tiến bộ của người học</h2>
        <p>
          Không chỉ là nơi xem video bài giảng. Eduvi kết nối nội dung, lộ trình, bài tập và
          chứng chỉ trong một trải nghiệm học tập liền mạch.
        </p>
        <div className="why-highlight">
          <span>
            <ShieldCheck size={22} />
          </span>
          <div>
            <strong>Cam kết học tập minh bạch</strong>
            <p>Theo dõi tiến độ, kết quả và chứng chỉ trong cùng một hồ sơ.</p>
          </div>
        </div>
        <a className="inline-link" href="/courses">
          Khám phá cách học trên Eduvi
          <ArrowRight size={17} />
        </a>
      </div>
      <div className="feature-grid">
        {featureItems.map((feature) => {
          const Icon = feature.icon;
          return (
            <article className="feature-card" key={feature.title}>
              <span className={`feature-icon tone-${feature.accent}`}>
                <Icon size={23} />
              </span>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          );
        })}
      </div>
    </div>
  </section>
);

const TestimonialsSection = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const viewportRef = useRef<HTMLDivElement>(null);

  const scrollToIndex = useCallback((index: number) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const firstCard = viewport.querySelector<HTMLElement>(".testimonial-card");
    if (!firstCard) return;
    const gap = 24;
    viewport.scrollTo({ left: index * (firstCard.offsetWidth + gap), behavior: "smooth" });
  }, []);

  const moveTo = useCallback(
    (index: number) => {
      const normalized = (index + testimonials.length) % testimonials.length;
      setActiveIndex(normalized);
      scrollToIndex(normalized);
    },
    [scrollToIndex],
  );

  useEffect(() => {
    const timer = window.setInterval(() => moveTo(activeIndex + 1), 5000);
    return () => window.clearInterval(timer);
  }, [activeIndex, moveTo]);

  const dots = useMemo(() => testimonials.map((_, index) => index), []);

  return (
    <section className="section testimonials-section" data-reveal>
      <div className="site-container">
        <div className="testimonial-heading-row">
          <SectionHeading
            align="left"
            eyebrow="Câu chuyện thật"
            title="Học viên nói gì về Eduvi?"
            description="Những trải nghiệm nhỏ, chân thực từ người học đang từng bước thay đổi kỹ năng và công việc của mình."
          />
          <div className="carousel-controls">
            <button type="button" onClick={() => moveTo(activeIndex - 1)} aria-label="Đánh giá trước">
              <ArrowLeft size={19} />
            </button>
            <button type="button" onClick={() => moveTo(activeIndex + 1)} aria-label="Đánh giá tiếp theo">
              <ArrowRight size={19} />
            </button>
          </div>
        </div>

        <div className="testimonial-viewport" ref={viewportRef}>
          <div className="testimonial-track">
            {testimonials.map((testimonial) => (
              <article className="testimonial-card" key={testimonial.name}>
                <Quote size={28} className="quote-icon" />
                <div className="stars testimonial-stars" role="img" aria-label="5 trên 5 sao">
                  {[0, 1, 2, 3, 4].map((star) => (
                    <Star key={star} size={15} fill="currentColor" />
                  ))}
                </div>
                <blockquote>“{testimonial.quote}”</blockquote>
                <div className="testimonial-author">
                  <span>{testimonial.initials}</span>
                  <div>
                    <strong>{testimonial.name}</strong>
                    <p>{testimonial.role}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="carousel-dots" role="region" aria-label="Chọn đánh giá">
          {dots.map((index) => (
            <button
              key={index}
              type="button"
              className={activeIndex === index ? "is-active" : ""}
              onClick={() => moveTo(index)}
              aria-label={`Xem đánh giá ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

const CtaSection = () => (
  <section className="section cta-wrap" data-reveal>
    <div className="site-container">
      <div className="cta-panel">
        <div className="cta-grid-pattern" />
        <div className="cta-copy">
          <span className="cta-kicker">Bắt đầu miễn phí ngay hôm nay</span>
          <h2>Sẵn sàng đầu tư vào phiên bản tốt hơn của chính mình?</h2>
          <p>
            Tham gia cùng hàng trăm học viên đang phát triển kỹ năng mỗi ngày. Không ràng
            buộc, không cần thẻ tín dụng.
          </p>
          <div className="cta-actions">
            <a className="button button-lg button-white" href="/user/register">
              Đăng ký miễn phí
              <ArrowRight size={18} />
            </a>
            <a className="button button-lg button-outline-white" href="mailto:support@eduvi.vn">
              <Headphones size={18} />
              Liên hệ tư vấn
            </a>
          </div>
        </div>
        <div className="cta-proof">
          <div>
            <strong>200+</strong>
            <span>học viên tin tưởng</span>
          </div>
          <div>
            <strong>95%</strong>
            <span>hoàn thành lộ trình</span>
          </div>
          <div>
            <strong>4.9/5</strong>
            <span>đánh giá trung bình</span>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const Footer = () => (
  <footer className="footer">
    <div className="site-container">
      <div className="footer-grid">
        <div className="footer-brand">
          <a href="#top" className="brand-mark brand-mark-light">
            <span className="brand-symbol">
              <BookOpen size={21} />
            </span>
            <span>Eduvi</span>
          </a>
          <p>
            Nền tảng học trực tuyến giúp người Việt phát triển kỹ năng thực tiễn và chứng
            minh năng lực bằng chứng chỉ xác thực.
          </p>
          <div className="social-links">
            <a href="#" aria-label="Facebook">
              <FaFacebookF size={16} />
            </a>
            <a href="#" aria-label="LinkedIn">
              <FaLinkedinIn size={16} />
            </a>
            <a href="#" aria-label="YouTube">
              <FaYoutube size={17} />
            </a>
          </div>
        </div>
        <div className="footer-column">
          <h3>Về Eduvi</h3>
          <a href="#why-eduvi">Giới thiệu</a>
          <a href="#why-eduvi">Đội ngũ giảng viên</a>
          <a href="/courses">Khóa học</a>
          <a href="#">Blog & tin tức</a>
        </div>
        <div className="footer-column">
          <h3>Hỗ trợ</h3>
          <a href="#">Câu hỏi thường gặp</a>
          <a href="#">Điều khoản sử dụng</a>
          <a href="#">Chính sách bảo mật</a>
          <a href="mailto:support@eduvi.vn">Trung tâm trợ giúp</a>
        </div>
        <div className="footer-column">
          <h3>Liên hệ</h3>
          <a href="mailto:support@eduvi.vn">
            <Mail size={16} />
            support@eduvi.vn
          </a>
          <p>Hotline: 1900 xxxx</p>
          <p>Thứ Hai – Thứ Sáu, 8:00–17:30</p>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 Eduvi LMS. All rights reserved.</span>
        <span>Đồ án tốt nghiệp · Công nghệ thông tin</span>
      </div>
    </div>
  </footer>
);

const PublicHome: React.FC = () => {
  useRevealSections();

  const pageStyle = {
    "--header-height": "72px",
  } as CSSProperties;

  return (
    <div className="public-homepage" style={pageStyle}>
      <Header />
      <main>
        <Hero />
        <StatsSection />
        <CoursesSection />
        <CategoriesSection />
        <HowItWorksSection />
        <WhyEduviSection />
        <TestimonialsSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
};

export default PublicHome;
