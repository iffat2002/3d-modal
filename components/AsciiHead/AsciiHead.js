"use client";

import { useEffect, useRef } from "react";
import SceneManager from "./Scene";
import styles from "./AsciiHead.module.scss";

export default function AsciiHead() {
  const container = useRef();

  useEffect(() => {
    const scene = new SceneManager(container.current);

    return () => {
        scene.destroy();

    };
  }, []);

  return (
    <div
      ref={container}
      className={styles.container}
    />
  );
}