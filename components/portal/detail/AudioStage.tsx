"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";
import type { CatalogItem } from "@/lib/portal/catalog";
import { waveBars } from "@/lib/portal/art";
import { Morph } from "@/components/portal/Cover";
import { Icon } from "@/components/portal/Icon";

const RATES = [1, 0.75, 1.25];
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/**
 * Reproductor de las notas de voz: la onda se pinta de ámbar a medida que
 * avanza, las barras se mueven mientras suena y se puede tocar la onda para
 * saltar a otro punto.
 */
export function AudioStage({
  item,
  src,
  ready = true,
  children,
}: {
  item: CatalogItem;
  src: string | null;
  ready?: boolean;
  /** Botones extra junto al principal (p. ej. "Marcar como completado"). */
  children?: ReactNode;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [dur, setDur] = useState(0);
  const [cur, setCur] = useState(0);
  const [rate, setRate] = useState(1);
  const wave = useMemo(() => waveBars(item.id), [item.id]);
  const usable = ready && !!src;

  const setProgress = (p: number) => boxRef.current?.style.setProperty("--p", String(Math.max(0, Math.min(1, p))));

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onMeta = () => setDur(Number.isFinite(a.duration) ? a.duration : 0);
    const onTime = () => {
      setCur(a.currentTime);
      if (a.duration) setProgress(a.currentTime / a.duration);
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => {
      setPlaying(false);
      setTimeout(() => {
        a.currentTime = 0;
        setCur(0);
        setProgress(0);
      }, 700);
    };
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("durationchange", onMeta);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    a.addEventListener("ended", onEnded);
    if (a.readyState >= 1) onMeta();
    return () => {
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("durationchange", onMeta);
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("ended", onEnded);
    };
  }, [src]);

  // Avance suave de la parte escuchada mientras suena.
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const tick = () => {
      const a = audioRef.current;
      if (a && a.duration) setProgress(a.currentTime / a.duration);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  const toggle = () => {
    const a = audioRef.current;
    if (!a || !usable) return;
    if (a.paused) a.play().catch(() => setPlaying(false));
    else a.pause();
  };

  const seekTo = (t: number) => {
    const a = audioRef.current;
    if (!a || !a.duration) return;
    a.currentTime = Math.max(0, Math.min(a.duration, t));
    setCur(a.currentTime);
    setProgress(a.currentTime / a.duration);
  };

  const onWaveClick = (e: MouseEvent<HTMLDivElement>) => {
    const a = audioRef.current;
    if (!a || !a.duration || !usable) return;
    const r = e.currentTarget.getBoundingClientRect();
    seekTo(((e.clientX - r.left) / r.width) * a.duration);
  };

  const onWaveKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const a = audioRef.current;
    if (!a || !a.duration) return;
    const jumps: Record<string, number> = { ArrowLeft: -5, ArrowDown: -5, ArrowRight: 5, ArrowUp: 5 };
    if (e.key in jumps) {
      e.preventDefault();
      seekTo(a.currentTime + jumps[e.key]);
    } else if (e.key === "Home") {
      e.preventDefault();
      seekTo(0);
    } else if (e.key === "End") {
      e.preventDefault();
      seekTo(a.duration - 1);
    } else if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      toggle();
    }
  };

  const cycleRate = () => {
    const next = RATES[(RATES.indexOf(rate) + 1) % RATES.length];
    setRate(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  };

  const label = !ready ? null : !src ? "Archivo pendiente de carga" : playing ? "Pausar audio" : "Reproducir audio";

  return (
    <>
      <Morph id={item.id}>
        <div
          ref={boxRef}
          data-morph={item.id}
          className={"sf-player" + (playing ? " is-playing" : "") + (cur > 0 ? " has-progress" : "") + (usable ? "" : " is-waiting")}
        >
          <div
            className="sf-wave"
            role="slider"
            tabIndex={usable ? 0 : -1}
            aria-label="Posición del audio"
            aria-valuemin={0}
            aria-valuemax={Math.round(dur)}
            aria-valuenow={Math.round(cur)}
            aria-valuetext={`${fmt(cur)} de ${dur ? fmt(dur) : "—"}`}
            onClick={onWaveClick}
            onKeyDown={onWaveKey}
            title="Toca la onda para ir a ese punto"
          >
            <svg className="sf-pw-base" viewBox={wave.viewBox} preserveAspectRatio="none" aria-hidden="true" focusable="false" dangerouslySetInnerHTML={{ __html: wave.inner }} />
            <svg className="sf-pw-played" viewBox={wave.viewBox} preserveAspectRatio="none" aria-hidden="true" focusable="false" dangerouslySetInnerHTML={{ __html: wave.inner }} />
          </div>
          <div className="sf-player__row">
            <button type="button" className="sf-play" onClick={toggle} disabled={!usable} aria-label={playing ? "Pausar" : "Reproducir"}>
              <Icon name={playing ? "pause" : "play"} />
            </button>
            <div className="sf-player__meta">
              <span className="sf-ptime">
                <b>{fmt(cur)}</b> / {dur ? fmt(dur) : "–:––"}
              </span>
              <span className="sf-player__label">{item.en}</span>
            </div>
            <button
              type="button"
              className="sf-rate"
              onClick={cycleRate}
              disabled={!usable}
              aria-label={`Velocidad de reproducción: ${rate}×. Cambiar`}
              title="Velocidad"
            >
              {rate}×
            </button>
          </div>
          {src ? <audio ref={audioRef} src={src} preload="metadata" /> : null}
        </div>
      </Morph>
      <div className="sf-actions">
        <button type="button" className="sf-btn-amber" onClick={toggle} disabled={!usable}>
          {label ?? (
            <>
              <span className="sf-spin" /> Preparando…
            </>
          )}
        </button>
        {children}
      </div>
    </>
  );
}
