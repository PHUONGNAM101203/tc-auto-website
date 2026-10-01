"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  filterOptions,
  getScreenModels,
  has360,
  is2K,
  type ScreenModel,
} from "@/lib/screen-catalogue";

/**
 * Danh muc man hinh co BO LOC.
 *
 * Khach hay tim theo bon thu: hang nao, man to bao nhieu, co phai 2K khong,
 * co camera 360 khong. Bon bo loc o day dung dung bon thu do — khong them
 * nhung tieu chi nghe ky thuat ma nguoi mua khong dung toi.
 *
 * Loc chay NGAY TAI TRINH DUYET tren mot danh sach 19 mau: khong goi mang,
 * khong doi, va khong can duong dan rieng cho tung to hop bo loc — nhu vay
 * may tim kiem cung khong gap mot ru trang gan trung noi dung.
 */

type Toggle = string | null;

export function ScreenCatalogue() {
  const models = getScreenModels();
  const options = filterOptions();

  const [brand, setBrand] = useState<Toggle>(null);
  const [size, setSize] = useState<Toggle>(null);
  const [only2K, setOnly2K] = useState(false);
  const [only360, setOnly360] = useState(false);

  const shown = useMemo(
    () =>
      models.filter(
        (model) =>
          (!brand || model.brand === brand) &&
          (!size || model.size === size) &&
          (!only2K || is2K(model)) &&
          (!only360 || has360(model)),
      ),
    [models, brand, size, only2K, only360],
  );

  const clear = () => {
    setBrand(null);
    setSize(null);
    setOnly2K(false);
    setOnly360(false);
  };
  const touched = Boolean(brand || size || only2K || only360);

  return (
    <section className="tc-cat" aria-labelledby="tc-cat-title">
      <h2 id="tc-cat-title">Tất cả các mẫu màn hình</h2>

      <div className="tc-cat-filters" role="group" aria-label="Lọc màn hình">
        <Choice
          label="Hãng"
          options={options.brands}
          value={brand}
          onChange={setBrand}
        />
        <Choice
          label="Kích thước"
          options={options.sizes}
          value={size}
          onChange={setSize}
        />
        <div className="tc-cat-group">
          <span className="tc-cat-label">Tính năng</span>
          <div className="tc-cat-row">
            <button
              type="button"
              className="tc-cat-chip"
              data-on={only2K || undefined}
              aria-pressed={only2K}
              onClick={() => setOnly2K((v) => !v)}
            >
              Màn 2K
            </button>
            <button
              type="button"
              className="tc-cat-chip"
              data-on={only360 || undefined}
              aria-pressed={only360}
              onClick={() => setOnly360((v) => !v)}
            >
              Camera 360
            </button>
          </div>
        </div>
      </div>

      <p className="tc-cat-count" aria-live="polite">
        {shown.length} / {models.length} mẫu
        {touched ? (
          <button type="button" className="tc-cat-clear" onClick={clear}>
            Bỏ lọc
          </button>
        ) : null}
      </p>

      {shown.length === 0 ? (
        <p className="tc-cat-empty">
          Không có mẫu nào khớp. Thử bỏ bớt một tiêu chí, hoặc gọi TC Auto để
          được tư vấn theo đúng dòng xe của bạn.
        </p>
      ) : (
        <ul className="tc-cat-list">
          {shown.map((model) => (
            <Card key={model.slug} model={model} />
          ))}
        </ul>
      )}
    </section>
  );
}

function Choice({
  label,
  options,
  value,
  onChange,
}: {
  readonly label: string;
  readonly options: readonly string[];
  readonly value: Toggle;
  readonly onChange: (next: Toggle) => void;
}) {
  return (
    <div className="tc-cat-group">
      <span className="tc-cat-label">{label}</span>
      <div className="tc-cat-row">
        {options.map((option) => {
          const on = value === option;
          return (
            <button
              key={option}
              type="button"
              className="tc-cat-chip"
              data-on={on || undefined}
              aria-pressed={on}
              // Bam lai chinh muc dang chon thi BO chon — khong can nut "tat ca".
              onClick={() => onChange(on ? null : option)}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Card({ model }: { model: ScreenModel }) {
  const rows: readonly [string, string][] = [
    ["Màn hình", `${model.size} · ${model.resolution}`],
    ["Hệ điều hành", model.android],
    ["Vi xử lý", model.cpu],
    ["RAM / Bộ nhớ", `${model.ram} / ${model.rom}`],
    ["Âm thanh", model.audio],
    ["Camera", model.camera],
  ];

  return (
    <li className="tc-cat-item">
      <h3>
        {model.route ? (
          <Link href={model.route}>{model.name}</Link>
        ) : (
          model.name
        )}
      </h3>
      <p className="tc-cat-brand">
        {model.brand} · dòng {model.family}
      </p>

      <dl>
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      {model.note ? <p className="tc-cat-note">{model.note}</p> : null}

      <p className="tc-cat-links">
        <a href={model.source} target="_blank" rel="noopener noreferrer">
          Thông số hãng công bố
        </a>
      </p>
    </li>
  );
}
