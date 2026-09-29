"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  nextSlide,
  prevSlide,
  type PhotoSlider as Slider,
} from "@/lib/photo-sliders";

/**
 * Thoi gian mot the truot di. Phai KHOP voi `--tc-stack-ms` trong overlay.css:
 * het thoi gian nay thi the vua truot moi duoc xep ra sau chong.
 */
const SLIDE_MS = 520;

/**
 * Nhip tu luot, khop voi bang hero (xem AUTOPLAY_MS trong HeroSlider).
 * Khach yeu cau "kieu 3-4s luot mot lan".
 */
const AUTOPLAY_MS = 3500;

/**
 * Bam mui ten xong thi ngung tu luot bay lau. Khong co khoang lang nay thi
 * nguoi dung vua bam sang anh minh muon xem, mot chut sau bang anh da tu keo
 * di mat — vua kho chiu vua lam cac bai kiem bam tay chap chon.
 */
const MANUAL_LULL_MS = 6000;

/**
 * Mot tam anh trong ban thiet ke co ve san mui ten "›" — day la lop lam cho mui
 * ten do bam duoc.
 *
 * Slide dau la anh CAT TU chinh ban thiet ke, dat dung cho anh goc, nen o trang
 * thai ban dau man hinh khong doi mot pixel nao. Cac slide sau lay tu bo tai
 * nguyen roi va GIU kenh trong suot, nho vay cac lop anh phia sau (van nam
 * trong anh nen) khong bi che. Bam mui ten thi chuyen anh, chay vong khong het.
 */
function Slide({ slider }: { slider: Slider }) {
  const [index, setIndex] = useState(0);
  /**
   * The dang TRUOT DI, kem huong. Thiet ke yeu cau: bam mui ten thi tam tren
   * cung luot sang phai roi moi chuyen ra sau chong — chu khong phai mo cheo
   * tai cho nhu truoc.
   */
  const [leaving, setLeaving] = useState<{ slide: number; dir: 1 | -1 } | null>(
    null,
  );
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Cu bam trong luc dang truot — nho lai de lam ngay sau, dung bo. */
  const queued = useRef<(1 | -1) | null>(null);
  /** Ban MOI NHAT cua `go`, de cu bam duoc nho lai khong chay ban cu. */
  const goRef = useRef<((dir: 1 | -1) => void) | null>(null);
  const box = useRef<HTMLDivElement | null>(null);
  /** Re chuot vao thi dung — dang xem hoac sap bam ma anh tu doi la hong y. */
  const [paused, setPaused] = useState(false);
  /** Chi chay khi bang anh co trong khung nhin: do pin va du lieu. */
  const [visible, setVisible] = useState(false);
  /** Tang len moi lan nguoi dung bam, de bat lai khoang lang. */
  const [nudge, setNudge] = useState(0);

  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    },
    [],
  );

  const go = useCallback(
    (dir: 1 | -1) => {
      const count = slider.slides.length;
      if (count < 2) {
        return;
      }
      if (timer.current) {
        // Dang truot: ghi nho cu bam nay roi lam ngay khi truot xong. Bo qua
        // thi nguoi dung bam nhanh se thay nut "chet".
        queued.current = dir;
        return;
      }
      const reduce =
        typeof matchMedia === "function" &&
        matchMedia("(prefers-reduced-motion: reduce)").matches;

      const advance = () =>
        setIndex((current) =>
          dir === 1 ? nextSlide(current, count) : prevSlide(current, count),
        );

      if (reduce) {
        advance();
        return;
      }

      setLeaving({ slide: index, dir });
      advance();
      timer.current = setTimeout(() => {
        timer.current = null;
        setLeaving(null);
        const next = queued.current;
        queued.current = null;
        if (next) {
          // Goi qua ref chu khong goi thang `go`: goi thang la dung lai BAN CU
          // cua ham, ban do con giu `index` cua nhip truoc nen cu bam duoc nho
          // lai se nhay sai mot the.
          goRef.current?.(next);
        }
      }, SLIDE_MS);
    },
    [index, slider.slides.length],
  );

  // Gan trong effect chu khong gan luc render: ghi vao ref giua render la tac
  // dung phu, React co the render lai ma khong dung ket qua do.
  useEffect(() => {
    goRef.current = go;
  }, [go]);

  // Bang anh nam sau trong trang. Chay khi nguoi dung chua cuon toi la tai anh
  // va ve lai vo ich — nen chi bat dau khi no that su lot vao khung nhin.
  useEffect(() => {
    const node = box.current;
    if (!node) {
      return;
    }
    const watcher = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: "0px" },
    );
    watcher.observe(node);
    return () => watcher.disconnect();
  }, []);

  // Moi lan `nudge` doi la hen lai gio tat khoang lang; bam lien tuc thi
  // khoang lang cu duoc keo dai them.
  useEffect(() => {
    if (nudge === 0) {
      return;
    }
    const until = setTimeout(() => setNudge(0), MANUAL_LULL_MS);
    return () => clearTimeout(until);
  }, [nudge]);

  const playing =
    visible && !paused && nudge === 0 && slider.slides.length > 1;

  useEffect(() => {
    if (!playing) {
      return;
    }
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    // Goi qua ref chu khong goi thang `go`: `go` doi sau moi lan chuyen anh, ma
    // dat no vao danh sach phu thuoc thi nhip bi dat lai moi vong va anh se
    // luot khong deu.
    const beat = setInterval(() => goRef.current?.(1), AUTOPLAY_MS);
    return () => clearInterval(beat);
  }, [playing]);

  return (
    <>
      <div
        ref={box}
        className="tc-photoslider"
        data-playing={playing || undefined}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        style={{
          left: slider.box.x,
          top: slider.box.y,
          width: slider.box.width,
          height: slider.box.height,
        }}
        role="group"
        aria-roledescription="băng chuyền"
        aria-label={slider.label}
      >
        {slider.slides.map((src, slideIndex) => (
          /* eslint-disable-next-line @next/next/no-img-element -- anh cat san tu
             ban thiet ke o ti le goc, khong qua image optimizer */
          <img
            key={src}
            src={src}
            alt={slideIndex === index ? slider.label : ""}
            aria-hidden={slideIndex === index ? undefined : true}
            className="tc-photoslide"
            data-on={slideIndex === index || undefined}
            data-leaving={
              leaving?.slide === slideIndex ? leaving.dir : undefined
            }
            width={slider.box.width}
            height={slider.box.height}
            loading="lazy"
            decoding="async"
            draggable={false}
          />
        ))}
      </div>

      {/* Mui ten dat theo toa do CANVAS chu khong long trong khung anh: trong
          thiet ke chung nam sat hai mep va tho ra mot chut khoi tam anh. */}
      {slider.prev ? (
        <button
          type="button"
          className="tc-photoslider-arrow"
          data-dir="prev"
          onClick={() => {
            setNudge((count) => count + 1);
            go(-1);
          }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          style={{
            left: slider.prev.x,
            top: slider.prev.y,
            width: slider.prev.width,
            height: slider.prev.height,
          }}
          aria-label={`${slider.label} — xem ảnh trước`}
        />
      ) : null}

      <button
        type="button"
        className="tc-photoslider-arrow"
        onClick={() => {
          setNudge((count) => count + 1);
          go(1);
        }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        style={{
          left: slider.arrow.x,
          top: slider.arrow.y,
          width: slider.arrow.width,
          height: slider.arrow.height,
        }}
        aria-label={`${slider.label} — xem ảnh tiếp theo`}
      />
    </>
  );
}

export function PhotoSliders({ sliders }: { sliders: readonly Slider[] }) {
  if (sliders.length === 0) {
    return null;
  }
  return (
    <>
      {sliders.map((slider) => (
        <Slide key={slider.id} slider={slider} />
      ))}
    </>
  );
}
