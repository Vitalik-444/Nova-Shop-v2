import { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";

export default function ScrollTop() {
  const { scrollTopButton } = useApp();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (scrollTopButton === false) return null;

  return (
    <div
      className={`scroll-top${visible ? " show" : ""}`}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      title="Наверх"
    >
      <i className="fa-solid fa-arrow-up"></i>
    </div>
  );
}
