import { readFileSync } from "fs";
import { join } from "path";
import ReferenceAsciiAnimation from "./ReferenceAsciiAnimation";
import styles from "./reference-result.module.scss";

export const metadata = {
  title: "Reference ASCII Result",
};

export default function ReferenceResultPage() {
  const resultHtml = readFileSync(
    join(process.cwd(), "app", "ascii-converted", "reference-output.html"),
    "utf8"
  );

  return (
    <main className={styles.page}>
      <div
        className={styles.result}
        dangerouslySetInnerHTML={{ __html: resultHtml }}
      />
      <ReferenceAsciiAnimation />
    </main>
  );
}