// TU DONG SINH boi tools/build-subpages.py — DUNG SUA TAY.
// Chay lai: npm run parse:subpages

import s_cong_nghe___tien_phong_cong_nghe from "./cong-nghe__tien-phong-cong-nghe.json";
import s_cong_nghe___tien_phong_cong_nghe___bai_viet from "./cong-nghe__tien-phong-cong-nghe__bai-viet.json";
import s_cong_nghe___ung_dung from "./cong-nghe__ung-dung.json";
import s_cong_nghe___ung_dung___cap_nhat_va_loi from "./cong-nghe__ung-dung__cap-nhat-va-loi.json";
import s_cong_nghe___ung_dung___kho_ung_dung from "./cong-nghe__ung-dung__kho-ung-dung.json";
import s_dai_ly___cau_chuyen_dong_hanh from "./dai-ly__cau-chuyen-dong-hanh.json";
import s_dai_ly___chan_dung_dai_ly from "./dai-ly__chan-dung-dai-ly.json";
import s_dai_ly___chan_dung_dai_ly___dai_ly_winca_pham_gia_auto from "./dai-ly__chan-dung-dai-ly__dai-ly-winca-pham-gia-auto.json";
import s_dai_ly___gallery_by_brand from "./dai-ly__gallery-by-brand.json";
import s_dai_ly___ho_tro_tiep_thi from "./dai-ly__ho-tro-tiep-thi.json";
import s_dai_ly___mang_luoi_dai_ly from "./dai-ly__mang-luoi-dai-ly.json";
import s_dai_ly___mang_luoi_dai_ly___mien_nam from "./dai-ly__mang-luoi-dai-ly__mien-nam.json";
import s_dai_ly___mang_luoi_dai_ly___mien_trung from "./dai-ly__mang-luoi-dai-ly__mien-trung.json";
import s_giai_phap___du_an from "./giai-phap__du-an.json";
import s_giai_phap___du_an___dai_ly_winca_pham_gia_auto from "./giai-phap__du-an__dai-ly-winca-pham-gia-auto.json";
import s_giai_phap___loa from "./giai-phap__loa.json";
import s_giai_phap___man_hinh from "./giai-phap__man-hinh.json";
import s_giai_phap___phim_dan_kinh from "./giai-phap__phim-dan-kinh.json";
import s_giai_phap___phim_dan_kinh___3m_ceramic_elite_im from "./giai-phap__phim-dan-kinh__3m-ceramic-elite-im.json";
import s_giai_phap___ppf from "./giai-phap__ppf.json";
import s_nhan_su___nhan_su_tc from "./nhan-su__nhan-su-tc.json";
import s_nhan_su___tuyen_dung from "./nhan-su__tuyen-dung.json";
import s_nhan_su___tuyen_dung___vi_tri_dang_tuyen from "./nhan-su__tuyen-dung__vi-tri-dang-tuyen.json";
import s_nhan_su___tuyen_dung___vi_tri_dang_tuyen___ky_thuat_dan_phim_va_man_hinh from "./nhan-su__tuyen-dung__vi-tri-dang-tuyen__ky-thuat-dan-phim-va-man-hinh.json";
import s_nhan_su___van_hoa_tc from "./nhan-su__van-hoa-tc.json";
import s_nhan_su___van_hoa_tc___cau_chuyen_khoi_nghiep from "./nhan-su__van-hoa-tc__cau-chuyen-khoi-nghiep.json";
import s_trai_nghiem___ban_sac_rieng from "./trai-nghiem__ban-sac-rieng.json";
import s_trai_nghiem___hanh_trinh from "./trai-nghiem__hanh-trinh.json";
import s_trai_nghiem___khoanh_khac from "./trai-nghiem__khoanh-khac.json";
import s_trai_nghiem___phong_cach_song from "./trai-nghiem__phong-cach-song.json";
import s_trai_nghiem___phong_cach_song___doi_mau_doi_dien_mao from "./trai-nghiem__phong-cach-song__doi-mau-doi-dien-mao.json";

export const SUBPAGE_MODULES: Readonly<Record<string, unknown>> = {
  "cong-nghe/tien-phong-cong-nghe": s_cong_nghe___tien_phong_cong_nghe,
  "cong-nghe/tien-phong-cong-nghe/bai-viet": s_cong_nghe___tien_phong_cong_nghe___bai_viet,
  "cong-nghe/ung-dung": s_cong_nghe___ung_dung,
  "cong-nghe/ung-dung/cap-nhat-va-loi": s_cong_nghe___ung_dung___cap_nhat_va_loi,
  "cong-nghe/ung-dung/kho-ung-dung": s_cong_nghe___ung_dung___kho_ung_dung,
  "dai-ly/cau-chuyen-dong-hanh": s_dai_ly___cau_chuyen_dong_hanh,
  "dai-ly/chan-dung-dai-ly": s_dai_ly___chan_dung_dai_ly,
  "dai-ly/chan-dung-dai-ly/dai-ly-winca-pham-gia-auto": s_dai_ly___chan_dung_dai_ly___dai_ly_winca_pham_gia_auto,
  "dai-ly/gallery-by-brand": s_dai_ly___gallery_by_brand,
  "dai-ly/ho-tro-tiep-thi": s_dai_ly___ho_tro_tiep_thi,
  "dai-ly/mang-luoi-dai-ly": s_dai_ly___mang_luoi_dai_ly,
  "dai-ly/mang-luoi-dai-ly/mien-nam": s_dai_ly___mang_luoi_dai_ly___mien_nam,
  "dai-ly/mang-luoi-dai-ly/mien-trung": s_dai_ly___mang_luoi_dai_ly___mien_trung,
  "giai-phap/du-an": s_giai_phap___du_an,
  "giai-phap/du-an/dai-ly-winca-pham-gia-auto": s_giai_phap___du_an___dai_ly_winca_pham_gia_auto,
  "giai-phap/loa": s_giai_phap___loa,
  "giai-phap/man-hinh": s_giai_phap___man_hinh,
  "giai-phap/phim-dan-kinh": s_giai_phap___phim_dan_kinh,
  "giai-phap/phim-dan-kinh/3m-ceramic-elite-im": s_giai_phap___phim_dan_kinh___3m_ceramic_elite_im,
  "giai-phap/ppf": s_giai_phap___ppf,
  "nhan-su/nhan-su-tc": s_nhan_su___nhan_su_tc,
  "nhan-su/tuyen-dung": s_nhan_su___tuyen_dung,
  "nhan-su/tuyen-dung/vi-tri-dang-tuyen": s_nhan_su___tuyen_dung___vi_tri_dang_tuyen,
  "nhan-su/tuyen-dung/vi-tri-dang-tuyen/ky-thuat-dan-phim-va-man-hinh": s_nhan_su___tuyen_dung___vi_tri_dang_tuyen___ky_thuat_dan_phim_va_man_hinh,
  "nhan-su/van-hoa-tc": s_nhan_su___van_hoa_tc,
  "nhan-su/van-hoa-tc/cau-chuyen-khoi-nghiep": s_nhan_su___van_hoa_tc___cau_chuyen_khoi_nghiep,
  "trai-nghiem/ban-sac-rieng": s_trai_nghiem___ban_sac_rieng,
  "trai-nghiem/hanh-trinh": s_trai_nghiem___hanh_trinh,
  "trai-nghiem/khoanh-khac": s_trai_nghiem___khoanh_khac,
  "trai-nghiem/phong-cach-song": s_trai_nghiem___phong_cach_song,
  "trai-nghiem/phong-cach-song/doi-mau-doi-dien-mao": s_trai_nghiem___phong_cach_song___doi_mau_doi_dien_mao,
};

export const SUBPAGE_SLUGS = Object.keys(SUBPAGE_MODULES);
