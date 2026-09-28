import layout from "@/data/quiz-layout.json";

/**
 * Trac nghiem "PHONG CÁCH CHƠI XE CỦA BẠN LÀ GÌ?" tren /trai-nghiem/ban-sac-rieng.
 *
 * Ban thiet ke ve chet MOT cau hoi vao anh kem nut "CÂU THIẾP THEO" — tuc y do
 * la mot chuoi cau hoi, nhung frame chi co cau dau. Cau dau o day giu nguyen
 * tung chu cua thiet ke; bon cau con lai va phan ket qua do chung ta viet, cung
 * mach va cung giong van.
 *
 * Moi lua chon ung voi mot NHOM tinh cach. Het cau hoi, nhom duoc chon nhieu
 * nhat la ket qua. "Khác" khong tinh diem — no la cho de nguoi ta noi that.
 */

export type Profile = "canh" | "lai" | "xa" | "thong-tha";

export interface QuizOption {
  readonly key: string;
  readonly text: string;
  /** Khong co nghia la o "Khác" — nguoi dung tu viet, khong tinh diem. */
  readonly profile: Profile | null;
}

export interface QuizQuestion {
  readonly prompt: string;
  readonly options: readonly QuizOption[];
}

const OTHER: QuizOption = { key: "E", text: "Khác:", profile: null };

export const QUESTIONS: readonly QuizQuestion[] = [
  {
    // Nguyen van tu ban thiet ke.
    prompt: "NẾU CHỌN MỘT CHUYẾN ĐI CUỐI TUẦN, BẠN SẼ CHỌN?",
    options: [
      {
        key: "A",
        text: "Lái xe dọc cung đường ven biển, dừng lại ở những nơi có view đẹp.",
        profile: "canh",
      },
      { key: "B", text: "Một cung đường đèo với những đoạn cua liên tục.", profile: "lai" },
      { key: "C", text: "Đi xa, khám phá những cung đường ít người biết đến.", profile: "xa" },
      {
        key: "D",
        text: "Một chuyến road trip thư thả, vừa lái xe vừa tận hưởng cảnh vật.",
        profile: "thong-tha",
      },
      OTHER,
    ],
  },
  {
    prompt: "NGỒI VÀO XE, BẠN CHỈNH THỨ GÌ TRƯỚC TIÊN?",
    options: [
      { key: "A", text: "Gương và góc ngồi, sao cho nhìn ra ngoài rõ nhất.", profile: "canh" },
      { key: "B", text: "Chế độ lái và độ nặng vô-lăng.", profile: "lai" },
      { key: "C", text: "Bản đồ và lộ trình cho cả chặng.", profile: "xa" },
      { key: "D", text: "Nhạc và nhiệt độ, rồi mới thong thả đi.", profile: "thong-tha" },
      OTHER,
    ],
  },
  {
    prompt: "THỨ BẠN MUỐN NÂNG CẤP TRƯỚC TIÊN TRÊN XE MÌNH?",
    options: [
      { key: "A", text: "Phim cách nhiệt, để tầm nhìn trong veo và bớt chói.", profile: "canh" },
      { key: "B", text: "Lốp và hệ thống phanh.", profile: "lai" },
      { key: "C", text: "Giá nóc, khoang chứa đồ — thứ phục vụ chặng dài.", profile: "xa" },
      { key: "D", text: "Âm thanh trong xe.", profile: "thong-tha" },
      OTHER,
    ],
  },
  {
    prompt: "XE BẠN SẠCH NHẤT VÀO LÚC NÀO?",
    options: [
      { key: "A", text: "Trước mỗi lần đứng chụp cùng nó.", profile: "canh" },
      { key: "B", text: "Trước mỗi chặng đường dài chạy nhanh.", profile: "lai" },
      { key: "C", text: "Sau mỗi chuyến đi, khi rửa hết bụi đường.", profile: "xa" },
      { key: "D", text: "Cuối tuần, như một thói quen thư giãn.", profile: "thong-tha" },
      OTHER,
    ],
  },
  {
    prompt: "MỘT CHIẾC XE ĐÁNG NHỚ VỚI BẠN LÀ?",
    options: [
      { key: "A", text: "Chiếc trông đẹp ở mọi góc nhìn.", profile: "canh" },
      { key: "B", text: "Chiếc phản hồi đúng ý ở từng góc cua.", profile: "lai" },
      { key: "C", text: "Chiếc đưa bạn tới nơi bạn chưa từng tới.", profile: "xa" },
      { key: "D", text: "Chiếc khiến quãng đường dài thấy ngắn lại.", profile: "thong-tha" },
      OTHER,
    ],
  },
];

export interface ProfileResult {
  readonly title: string;
  readonly body: string;
  readonly cta: { readonly label: string; readonly href: string };
}

export const PROFILES: Readonly<Record<Profile, ProfileResult>> = {
  canh: {
    title: "NGƯỜI ĐI TÌM KHUNG CẢNH",
    body:
      "Với bạn, chuyến đi đáng nhớ là chuyến có gì đó để nhìn. Bạn dừng lại nhiều hơn người khác, " +
      "và bạn để ý tới những thứ nhỏ: ánh nắng lúc chiều xuống, mặt kính sạch, khoang xe gọn gàng. " +
      "Thứ nâng trải nghiệm của bạn lên rõ nhất là những gì làm tầm nhìn trong hơn.",
    cta: { label: "XEM PHIM CÁCH NHIỆT", href: "/giai-phap/phim-dan-kinh" },
  },
  lai: {
    title: "NGƯỜI MÊ CẢM GIÁC LÁI",
    body:
      "Bạn chọn đường theo độ thú vị chứ không theo độ ngắn. Chiếc xe với bạn là thứ để điều khiển, " +
      "và bạn nhận ra ngay khi nó phản hồi khác đi một chút. Những gì bạn quan tâm nằm ở phần tiếp " +
      "xúc với mặt đường và ở việc giữ chiếc xe đúng trạng thái nguyên bản của nó.",
    cta: { label: "XEM GIẢI PHÁP BẢO VỆ", href: "/giai-phap/ppf" },
  },
  xa: {
    title: "NGƯỜI ĐI XA",
    body:
      "Bạn đi để tới nơi mình chưa tới. Quãng đường dài không làm bạn ngại, nhưng bạn chuẩn bị kỹ " +
      "— vì ở xa thì mọi thứ hỏng đều phiền. Chiếc xe của bạn cần bền, cần chứa được đồ, và cần " +
      "những thiết bị đi cùng hoạt động ổn định suốt chặng.",
    cta: { label: "XEM MÀN HÌNH Ô TÔ", href: "/giai-phap/man-hinh" },
  },
  "thong-tha": {
    title: "NGƯỜI THONG THẢ",
    body:
      "Bạn không vội. Chiếc xe với bạn là một khoảng riêng — nơi bản nhạc quen vang lên đúng lúc, " +
      "nơi nhiệt độ vừa phải và không ai làm phiền. Quãng đường dài hay ngắn không quan trọng bằng " +
      "việc ngồi trong đó thấy dễ chịu tới đâu.",
    cta: { label: "XEM GIẢI PHÁP ÂM THANH", href: "/giai-phap/loa" },
  },
};

interface Layout {
  readonly scrub: { readonly x: number; readonly y: number; readonly width: number; readonly height: number };
  readonly layout: {
    readonly title: { readonly y: number; readonly height: number; readonly fontSize: number };
    readonly question: {
      readonly x: number;
      readonly y: number;
      readonly fontSize: number;
      readonly lineHeight: number;
    };
    readonly options: {
      readonly x: number;
      readonly y: number;
      readonly step: number;
      readonly fontSize: number;
      readonly lineHeight: number;
    };
    readonly input: {
      readonly x: number;
      readonly y: number;
      readonly width: number;
      readonly height: number;
      readonly fontSize: number;
    };
    readonly button: {
      readonly x: number;
      readonly y: number;
      readonly width: number;
      readonly height: number;
    };
  };
}

const DATA = layout as unknown as Layout;

export const QUIZ_BOX = DATA.scrub;
export const QUIZ_LAYOUT = DATA.layout;

/** Nhom duoc chon nhieu nhat. Hoa nhau thi lay nhom xuat hien som nhat. */
export function scoreOf(answers: readonly (Profile | null)[]): Profile {
  const tally = new Map<Profile, number>();
  for (const answer of answers) {
    if (answer) {
      tally.set(answer, (tally.get(answer) ?? 0) + 1);
    }
  }
  let best: Profile = "thong-tha";
  let top = -1;
  for (const [profile, count] of tally) {
    if (count > top) {
      best = profile;
      top = count;
    }
  }
  return best;
}
