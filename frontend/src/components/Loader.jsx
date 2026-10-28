import { useApp } from "../context/AppContext";

export default function Loader() {
  const { loaderVisible } = useApp();

  return (
    <div className={`loader${loaderVisible ? "" : " hide"}`}>
      <div className="loader-spinner"></div>
    </div>
  );
}
