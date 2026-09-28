"use client";

import Link from "next/link";
import { useState } from "react";
import {
  PROFILES,
  QUESTIONS,
  QUIZ_BOX,
  QUIZ_LAYOUT,
  scoreOf,
  type Profile,
} from "@/lib/style-quiz";

/**
 * Trac nghiem "PHONG CÁCH CHƠI XE CỦA BẠN LÀ GÌ?".
 *
 * Thiet ke ve chet mot cau hoi vao anh kem nut "CÂU THIẾP THEO" — y la mot
 * chuoi cau hoi, nhung frame chi co cau dau. Khoi nay dat dung vao cho do voi
 * dung co chu do tu thiet ke, nen luc o cau dau man hinh gan nhu khong khac.
 */
interface State {
  readonly step: number;
  readonly picks: readonly (Profile | null)[];
  readonly chosen: readonly (string | null)[];
  readonly other: string;
  readonly done: boolean;
}

const EMPTY: State = {
  step: 0,
  picks: [],
  chosen: QUESTIONS.map(() => null),
  other: "",
  done: false,
};

export function StyleQuiz() {
  const [state, setState] = useState<State>(EMPTY);
  const question = QUESTIONS[state.step];
  const last = state.step === QUESTIONS.length - 1;
  const picked = state.chosen[state.step];
  const isOther = picked === "E";
  // Chon "Khác" thi phai viet gi do moi di tiep duoc — neu khong cau hoi coi
  // nhu bi bo trong.
  const ready = picked !== null && (!isOther || state.other.trim().length > 0);

  const choose = (key: string, profile: Profile | null) =>
    setState((current) => ({
      ...current,
      chosen: current.chosen.map((value, index) => (index === current.step ? key : value)),
      picks: current.picks.map((value, index) => (index === current.step ? profile : value)),
      other: key === "E" ? current.other : "",
    }));

  const next = () =>
    setState((current) => {
      const picks = [...current.picks];
      picks[current.step] =
        question.options.find((option) => option.key === current.chosen[current.step])?.profile ??
        null;
      return last
        ? { ...current, picks, done: true }
        : { ...current, picks, step: current.step + 1, other: "" };
    });

  const box = QUIZ_LAYOUT;

  return (
    <div
      className="tc-quiz"
      style={{
        left: `${QUIZ_BOX.x}px`,
        top: `${QUIZ_BOX.y}px`,
        width: `${QUIZ_BOX.width}px`,
        height: `${QUIZ_BOX.height}px`,
      }}
    >
      <h2
        className="tc-quiz-title"
        style={{ top: `${box.title.y - QUIZ_BOX.y - 8}px`, fontSize: `${box.title.fontSize}px` }}
      >
        PHONG CÁCH CHƠI XE CỦA BẠN LÀ GÌ?
      </h2>

      {state.done ? (
        <Result profile={scoreOf(state.picks)} onRestart={() => setState(EMPTY)} />
      ) : (
        <>
          <p
            className="tc-quiz-q"
            style={{
              left: `${box.question.x - QUIZ_BOX.x}px`,
              top: `${box.question.y - QUIZ_BOX.y - 6}px`,
              fontSize: `${box.question.fontSize}px`,
              lineHeight: `${box.question.lineHeight}px`,
            }}
          >
            <span aria-hidden="true">•</span> {question.prompt}
          </p>

          <fieldset
            className="tc-quiz-options"
            style={{
              left: `${box.options.x - QUIZ_BOX.x}px`,
              top: `${box.options.y - QUIZ_BOX.y - 5}px`,
              fontSize: `${box.options.fontSize}px`,
              lineHeight: `${box.options.lineHeight}px`,
              ["--quiz-step" as string]: `${box.options.step}px`,
            }}
          >
            <legend className="tc-sr">{question.prompt}</legend>
            {question.options.map((option) => (
              <label key={option.key} data-picked={picked === option.key ? "" : undefined}>
                <input
                  type="radio"
                  name={`quiz-${state.step}`}
                  checked={picked === option.key}
                  onChange={() => choose(option.key, option.profile)}
                />
                <span>
                  {option.key}. {option.text}
                </span>
              </label>
            ))}
          </fieldset>

          <textarea
            className="tc-quiz-other"
            placeholder="Nhập câu trả lời khác..."
            aria-label="Câu trả lời khác"
            value={state.other}
            disabled={!isOther}
            onChange={(event) =>
              setState((current) => ({ ...current, other: event.target.value }))
            }
            style={{
              left: `${box.input.x - QUIZ_BOX.x}px`,
              top: `${box.input.y - QUIZ_BOX.y}px`,
              width: `${box.input.width}px`,
              height: `${box.input.height}px`,
              fontSize: `${box.input.fontSize}px`,
            }}
          />

          <button
            type="button"
            className="tc-quiz-next"
            disabled={!ready}
            onClick={next}
            style={{
              left: `${box.button.x - QUIZ_BOX.x}px`,
              top: `${box.button.y - QUIZ_BOX.y}px`,
              width: `${box.button.width}px`,
              height: `${box.button.height}px`,
            }}
          >
            <span>{last ? "XEM KẾT QUẢ" : "CÂU TIẾP THEO"}</span>
            <i aria-hidden="true">›</i>
          </button>

          <p className="tc-quiz-count" aria-live="polite">
            Câu {state.step + 1} / {QUESTIONS.length}
          </p>
        </>
      )}
    </div>
  );
}

function Result({
  profile,
  onRestart,
}: {
  readonly profile: Profile;
  readonly onRestart: () => void;
}) {
  const result = PROFILES[profile];
  return (
    <div className="tc-quiz-result">
      <p className="tc-quiz-result-label">PHONG CÁCH CỦA BẠN</p>
      <h3>{result.title}</h3>
      <p className="tc-quiz-result-body">{result.body}</p>
      <div className="tc-quiz-result-actions">
        <Link href={result.cta.href} prefetch={false} className="tc-quiz-cta">
          {result.cta.label}
        </Link>
        <button type="button" onClick={onRestart}>
          Làm lại
        </button>
      </div>
    </div>
  );
}
