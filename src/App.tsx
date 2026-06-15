import { useState } from "react";
import type { CSSProperties } from "react";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY as string;

const LANGUAGES = ["JavaScript", "React/JSX", "TypeScript", "Python"];

// ── Types ─────────────────────────────────────────────────────────────────────

interface Review {
  score: number;
  issues: string[];
  suggestions: string[];
  good: string[];
  summary: string;
}

interface ReviewSectionProps {
  title: string;
  items: string[];
  color: string;
  borderColor: string;
  textColor: string;
  titleColor: string;
}

// ── Main App ──────────────────────────────────────────────────────────────────

export default function App() {
  const [code, setCode] = useState("");
  const [lang, setLang] = useState("JavaScript");
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function reviewCode() {
    if (!code.trim()) return;
    setLoading(true);
    setError("");
    setReview(null);

    const prompt = `You are an expert ${lang} code reviewer. Review the following code and respond ONLY with a JSON object (no markdown, no explanation outside JSON) in this exact format:
{
  "score": <number 0-100>,
  "issues": ["issue1", "issue2"],
  "suggestions": ["suggestion1", "suggestion2"],
  "good": ["good thing 1", "good thing 2"],
  "summary": "one sentence overall verdict"
}

Code to review:
\`\`\`${lang}
${code}
\`\`\``;

    try {
      const res = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${GROQ_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3,
            max_tokens: 800,
          }),
        },
      );

      const data = await res.json();
      if (data.error) throw new Error(data.error.message);

      const raw = data.choices[0].message.content;
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Could not parse response");

      setReview(JSON.parse(jsonMatch[0]));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function clearAll() {
    setCode("");
    setReview(null);
    setError("");
  }

  const scoreColor =
    (review?.score ?? 0) >= 80
      ? "#3B6D11"
      : (review?.score ?? 0) >= 50
        ? "#854F0B"
        : "#A32D2D";

  return (
    <div style={styles.app}>
      <div style={styles.header}>
        <h1 style={styles.h1}>
          AI Code Reviewer
          <span style={styles.badge}>Groq + Llama</span>
        </h1>
        <p style={styles.subtitle}>
          Paste your code and get instant AI feedback
        </p>
      </div>

      <div style={styles.layout}>
        {/* Left Panel — Input */}
        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <span style={styles.panelTitle}>YOUR CODE</span>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              style={styles.select}
            >
              {LANGUAGES.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </div>

          <textarea
            style={styles.textarea}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={`// Paste your ${lang} code here...`}
            spellCheck={false}
          />

          <div style={styles.actions}>
            <button
              style={{
                ...styles.btnPrimary,
                opacity: loading || !code.trim() ? 0.5 : 1,
                cursor: loading || !code.trim() ? "not-allowed" : "pointer",
              }}
              onClick={reviewCode}
              disabled={loading || !code.trim()}
            >
              {loading ? "Reviewing..." : "⚡ Review Code"}
            </button>
            <button style={styles.btnSecondary} onClick={clearAll}>
              Clear
            </button>
          </div>
        </div>

        {/* Right Panel — Output */}
        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <span style={styles.panelTitle}>AI REVIEW</span>
            {review && (
              <span style={{ ...styles.scoreBadge, color: scoreColor }}>
                {review.score}/100
              </span>
            )}
          </div>

          <div style={styles.output}>
            {!loading && !review && !error && (
              <div style={styles.placeholder}>
                <p>← Your review will appear here</p>
              </div>
            )}

            {loading && (
              <div style={styles.placeholder}>
                <p>Analyzing your code...</p>
              </div>
            )}

            {error && (
              <div style={styles.errorBox}>
                <strong>Error:</strong> {error}
              </div>
            )}

            {review && (
              <div>
                <p style={styles.summary}>"{review.summary}"</p>

                <div style={styles.scoreTrack}>
                  <div
                    style={{
                      ...styles.scoreFill,
                      width: `${review.score}%`,
                      background: scoreColor,
                    }}
                  />
                </div>

                {review.issues?.length > 0 && (
                  <ReviewSection
                    title={`Issues (${review.issues.length})`}
                    items={review.issues}
                    color="#FCEBEB"
                    borderColor="#F09595"
                    textColor="#791F1F"
                    titleColor="#A32D2D"
                  />
                )}

                {review.suggestions?.length > 0 && (
                  <ReviewSection
                    title={`Suggestions (${review.suggestions.length})`}
                    items={review.suggestions}
                    color="#FAEEDA"
                    borderColor="#FAC775"
                    textColor="#633806"
                    titleColor="#854F0B"
                  />
                )}

                {review.good?.length > 0 && (
                  <ReviewSection
                    title={`What's good (${review.good.length})`}
                    items={review.good}
                    color="#EAF3DE"
                    borderColor="#C0DD97"
                    textColor="#27500A"
                    titleColor="#3B6D11"
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── ReviewSection ─────────────────────────────────────────────────────────────

function ReviewSection({
  title,
  items,
  color,
  borderColor,
  textColor,
  titleColor,
}: ReviewSectionProps) {
  return (
    <div
      style={{
        marginBottom: 12,
        padding: 12,
        borderRadius: 8,
        background: color,
        border: `0.5px solid ${borderColor}`,
      }}
    >
      <p style={{ fontSize: 12, fontWeight: 600, color: titleColor, marginBottom: 8 }}>
        {title}
      </p>
      <ul style={{ paddingLeft: 16, margin: 0 }}>
        {items.map((item, i) => (
          <li key={i} style={{ fontSize: 13, lineHeight: 1.6, color: textColor, marginBottom: 4 }}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles: Record<string, CSSProperties> = {
  app: {
    minHeight: "100vh",
    padding: "24px",
    background: "#f5f5f3",
    fontFamily: "system-ui, sans-serif",
  },
  header: { marginBottom: 20 },
  h1: { fontSize: 20, fontWeight: 600, color: "#1a1a1a", display: "flex", alignItems: "center", gap: 10 },
  badge: { fontSize: 11, fontWeight: 500, padding: "3px 8px", borderRadius: 6, background: "#EAF3DE", color: "#3B6D11" },
  subtitle: { fontSize: 13, color: "#888", marginTop: 4 },
  layout: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  panel: { background: "#fff", border: "0.5px solid #e0e0e0", borderRadius: 12, overflow: "hidden", display: "flex", flexDirection: "column" },
  panelHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderBottom: "0.5px solid #e0e0e0", background: "#fafafa" },
  panelTitle: { fontSize: 11, fontWeight: 600, color: "#999", letterSpacing: "0.06em" },
  scoreBadge: { fontSize: 13, fontWeight: 600 },
  select: { fontSize: 12, padding: "4px 8px", borderRadius: 6, border: "0.5px solid #e0e0e0", background: "#f5f5f3", color: "#666", cursor: "pointer" },
  textarea: { flex: 1, minHeight: 340, padding: 14, fontFamily: "monospace", fontSize: 13, lineHeight: 1.6, color: "#1a1a1a", background: "#fff", border: "none", resize: "vertical", outline: "none" },
  actions: { padding: "10px 14px", borderTop: "0.5px solid #e0e0e0", display: "flex", gap: 8, background: "#fafafa" },
  btnPrimary: { fontSize: 13, fontWeight: 500, padding: "7px 16px", borderRadius: 8, border: "none", background: "#1a1a1a", color: "#fff", cursor: "pointer" },
  btnSecondary: { fontSize: 13, padding: "7px 12px", borderRadius: 8, border: "0.5px solid #e0e0e0", background: "transparent", color: "#666", cursor: "pointer" },
  output: { flex: 1, padding: 14, overflowY: "auto", minHeight: 340 },
  placeholder: { height: 300, display: "flex", alignItems: "center", justifyContent: "center", color: "#bbb", fontSize: 13 },
  errorBox: { padding: 12, borderRadius: 8, background: "#FCEBEB", color: "#791F1F", fontSize: 13, border: "0.5px solid #F09595" },
  summary: { fontSize: 13, color: "#666", fontStyle: "italic", marginBottom: 12, lineHeight: 1.6 },
  scoreTrack: { height: 4, background: "#eee", borderRadius: 2, marginBottom: 14, overflow: "hidden" },
  scoreFill: { height: "100%", borderRadius: 2, transition: "width 0.6s ease" },
};