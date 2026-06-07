import { useCallback, useState } from "react";
import { useParams } from "react-router-dom";

/**
 * 도구 입력 상태를 localStorage + URL 쿼리에 동기화하는 훅.
 *  - 자동저장: 새로고침/재방문 시 마지막 입력값 복원 (localStorage)
 *  - URL 공유: 현재 입력 상태가 주소창 쿼리에 반영되어 링크로 공유 가능
 *
 * 우선순위(초기값): URL 쿼리 > localStorage > 기본값
 *
 * 사용:  const [v, setV] = useToolState("key", 기본값)
 * 기존 useState 와 동일하게 값/함수형 업데이트 모두 지원 (원시값 전용).
 */

type Primitive = string | number | boolean;

/** 리터럴 타입을 기반 타입으로 넓힘 ("500000" → string, 1 → number 등) */
type Widen<T> = T extends boolean
  ? boolean
  : T extends number
    ? number
    : T extends string
      ? string
      : T;

function storageKey(slug: string, key: string) {
  return `tool:${slug}:${key}`;
}

function decode<T extends Primitive>(raw: string, sample: T): T {
  if (typeof sample === "number") return Number(raw) as T;
  if (typeof sample === "boolean") return (raw === "true") as unknown as T;
  return raw as T;
}

function readInitial<T extends Primitive>(slug: string, key: string, initial: T): T {
  try {
    const q = new URL(window.location.href).searchParams.get(key);
    if (q !== null) return decode(q, initial);
  } catch {
    /* 무시 */
  }
  try {
    const raw = localStorage.getItem(storageKey(slug, key));
    if (raw !== null) return decode(raw, initial);
  } catch {
    /* 무시 */
  }
  return initial;
}

function persist(slug: string, key: string, value: Primitive) {
  try {
    localStorage.setItem(storageKey(slug, key), String(value));
  } catch {
    /* 무시 */
  }
  try {
    const url = new URL(window.location.href);
    url.searchParams.set(key, String(value));
    window.history.replaceState(null, "", url.toString());
  } catch {
    /* 무시 */
  }
}

export function useToolState<T extends Primitive>(
  key: string,
  initial: T,
): [Widen<T>, (v: Widen<T> | ((prev: Widen<T>) => Widen<T>)) => void] {
  type W = Widen<T>;
  const { slug = "_" } = useParams();
  const [val, setVal] = useState<W>(() => readInitial(slug, key, initial) as W);
  const set = useCallback(
    (v: W | ((prev: W) => W)) => {
      setVal((prev) => {
        const next = typeof v === "function" ? (v as (p: W) => W)(prev) : v;
        persist(slug, key, next as Primitive);
        return next;
      });
    },
    [slug, key],
  );
  return [val, set];
}

/** 객체/배열 상태용 (JSON 직렬화). URL·localStorage 모두 JSON 문자열 저장. */
export function useToolStateJSON<T>(
  key: string,
  initial: T,
): [T, (v: T | ((prev: T) => T)) => void] {
  const { slug = "_" } = useParams();
  const [val, setVal] = useState<T>(() => {
    try {
      const q = new URL(window.location.href).searchParams.get(key);
      if (q !== null) return JSON.parse(q) as T;
    } catch {
      /* 무시 */
    }
    try {
      const raw = localStorage.getItem(storageKey(slug, key));
      if (raw !== null) return JSON.parse(raw) as T;
    } catch {
      /* 무시 */
    }
    return initial;
  });
  const set = useCallback(
    (v: T | ((prev: T) => T)) => {
      setVal((prev) => {
        const next = typeof v === "function" ? (v as (p: T) => T)(prev) : v;
        const json = JSON.stringify(next);
        try {
          localStorage.setItem(storageKey(slug, key), json);
        } catch {
          /* 무시 */
        }
        try {
          const url = new URL(window.location.href);
          url.searchParams.set(key, json);
          window.history.replaceState(null, "", url.toString());
        } catch {
          /* 무시 */
        }
        return next;
      });
    },
    [slug, key],
  );
  return [val, set];
}
