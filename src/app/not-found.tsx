//src/app/not-found.tsx

export default function NotFoundPage() {
    return (
      <div style={{ textAlign: "center", marginTop: "4rem" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>404 - Page Not Found</h1>
        <p style={{ fontSize: "1.2rem" }}>
          お探しのページは見つかりませんでした。
        </p>
        <p style={{ marginTop: "1rem" }}>
          <a href="/" style={{ color: "#0070f3", textDecoration: "underline" }}>
            トップページに戻る
          </a>
        </p>
      </div>
    );
  }