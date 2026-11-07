export default function Skeletons({ count = 8, layout = "grid" }) {
  return (
    <div className={layout === "list" ? "nv-list" : "nv-grid"}>
      {Array.from({ length: count }, (_, index) => (
        <div className={`nv-card nv-skeleton${layout === "list" ? " nv-card-list" : ""}`} key={index}>
          <div className="nv-card-media nv-shimmer"></div>
          <div className="nv-card-body">
            <div className="nv-line nv-shimmer" style={{ width: "40%" }}></div>
            <div className="nv-line nv-shimmer" style={{ width: "90%" }}></div>
            <div className="nv-line nv-shimmer" style={{ width: "60%" }}></div>
            <div className="nv-line nv-shimmer nv-line-lg" style={{ width: "50%" }}></div>
          </div>
        </div>
      ))}
    </div>
  );
}
