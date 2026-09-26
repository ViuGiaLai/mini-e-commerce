export type Viewer = {
  id: number;
  name: string;
  email: string;
  role: "admin" | "user";
  status: "Đang hoạt động" | "Đã khóa";
  plan: "Miễn phí" | "VIP";
  joinedAt: string;
  lastActive: string;
  watches: number;
};

export type SiteSettings = {
  siteName: string;
  tagline: string;
  supportEmail: string;
  maintenance: boolean;
  allowRegistration: boolean;
  showViewCount: boolean;
  itemsPerPage: number;
};

export const viewerSeed: Viewer[] = [
  {
    id: 1,
    name: "Quản trị viên",
    email: "admin@gmail.com",
    role: "admin",
    status: "Đang hoạt động",
    plan: "VIP",
    joinedAt: "2026-01-05",
    lastActive: "2026-09-26T08:30:00.000Z",
    watches: 186,
  },
  {
    id: 2,
    name: "Minh Anh",
    email: "user@gmail.com",
    role: "user",
    status: "Đang hoạt động",
    plan: "VIP",
    joinedAt: "2026-02-12",
    lastActive: "2026-09-26T07:20:00.000Z",
    watches: 94,
  },
  ...[
    ["Hoàng Nam", "nam.hoang@gmail.com", "Miễn phí", 71],
    ["Bảo Ngọc", "bao.ngoc@gmail.com", "VIP", 128],
    ["Tuấn Kiệt", "tuan.kiet@gmail.com", "Miễn phí", 43],
    ["Thảo Vy", "thao.vy@gmail.com", "VIP", 109],
    ["Gia Huy", "gia.huy@gmail.com", "Miễn phí", 22],
    ["Khánh Linh", "khanh.linh@gmail.com", "VIP", 87],
  ].map(([name, email, plan, watches], index) => ({
    id: index + 3,
    name: String(name),
    email: String(email),
    role: "user" as const,
    status: "Đang hoạt động" as const,
    plan: plan as Viewer["plan"],
    joinedAt: `2026-0${(index % 6) + 3}-${String(index + 10).padStart(2, "0")}`,
    lastActive: new Date(Date.UTC(2026, 8, 26 - index)).toISOString(),
    watches: Number(watches),
  })),
];

export const defaultSettings: SiteSettings = {
  siteName: "ViuFilm3D",
  tagline: "Thế giới hoạt hình 3D nguyên bản",
  supportEmail: "support@viufilm3d.local",
  maintenance: false,
  allowRegistration: true,
  showViewCount: true,
  itemsPerPage: 20,
};
