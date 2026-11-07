export default function Stars({ value = 0, size }) {
  const rounded = Math.round(Number(value) * 2) / 2;
  return (
    <span className="nv-stars" style={size ? { fontSize: size } : undefined} aria-label={`${rounded} / 5`}>
      {[1, 2, 3, 4, 5].map(star => {
        let cls = "fa-regular fa-star";
        if (rounded >= star) cls = "fa-solid fa-star";
        else if (rounded >= star - 0.5) cls = "fa-solid fa-star-half-stroke";
        return <i key={star} className={cls}></i>;
      })}
    </span>
  );
}
