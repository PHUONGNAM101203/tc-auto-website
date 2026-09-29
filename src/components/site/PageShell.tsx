import { CanvasItem } from "@/components/canvas/CanvasItem";
import { MobilePage } from "@/components/mobile/MobilePage";
import { AppCards } from "@/components/site/AppCards";
import { CanvasSlices } from "@/components/canvas/CanvasSlices";
import { ContactForm } from "@/components/site/ContactForm";
import { FooterSocial } from "@/components/site/FooterSocial";
import { HeroSlider } from "@/components/site/HeroSlider";
import { PhotoSliders } from "@/components/site/PhotoSlider";
import { SolutionCarousel } from "@/components/site/SolutionCarousel";
import { LiftCards } from "@/components/site/LiftCards";
import { getAppCards } from "@/lib/app-cards";
import { getPhotoSliders } from "@/lib/photo-sliders";
import { getLiftCards } from "@/lib/lift-cards";
import { getMobileHero, getMobileSections } from "@/lib/mobile-sections";
import { SiteHeader } from "@/components/site/SiteHeader";
import { isSearchBaked } from "@/lib/search-baked";
import type { PageSpec } from "@/lib/types";

interface PageShellProps {
  readonly page: PageSpec;
}

/**
 * Dung mot trang tu page spec: nen (slices) -> header -> cac phan tu -> form.
 * Toan bo hinh hoc la 1440px canvas cua Figma; scale responsive do bien
 * --tc-zoom trong layout dieu khien.
 *
 * Duoi 900px, canvas duoc an di va <MobilePage /> hien ra thay the: canvas la
 * khung CUNG, thu xuong be rong dien thoai thi chu than bai chi con 3-4px.
 * Hai ban lay chung mot nguon du lieu nen khong bao gio lech noi dung.
 */
export function PageShell({ page }: PageShellProps) {
  return (
    <>
      <MobilePage
        nav={page.nav}
        hero={getMobileHero(page.slug)}
        sections={getMobileSections(page.slug)}
        contact={
          page.contactForm ? (
            <ContactForm y={0} sourcePage={page.route} layout="mobile" />
          ) : null
        }
      />
      <div className="tc-canvas">
        <section
          className="pg"
          style={{ height: `${page.height}px` }}
          aria-label={page.title}
        >
          <CanvasSlices slices={page.slices} pageTitle={page.title} />

          {/* Bang hero — chi trang chu co, va chi ve khi da du tu 2 anh tro len. */}
          {page.slug === "home" && <HeroSlider />}

          {/* Dai the "Giải pháp" — truot ngang bang mui ten ve san trong thiet ke. */}
          {page.slug === "home" && <SolutionCarousel />}

          <SiteHeader nav={page.nav} searchBaked={isSearchBaked(page.slug)} />

          {page.items.map((item) => (
            <CanvasItem key={item.id} item={item} />
          ))}

          <AppCards cards={getAppCards(page.slug)} />

          {/* The anh tach khoi nen — ro chuot vao the nao thi the do noi len. */}
          <LiftCards cards={getLiftCards(page.slug)} />

          {/* Slider anh ve chet trong thiet ke — mui ten "›" bam duoc. */}
          <PhotoSliders sliders={getPhotoSliders(page.slug)} />

          {page.contactForm ? (
            <ContactForm y={page.contactForm.y} sourcePage={page.route} />
          ) : null}

          {/* Ba bieu tuong mang xa hoi ve san trong chan trang — o bam trong suot. */}
          <FooterSocial pageHeight={page.height} />
        </section>
      </div>
    </>
  );
}
