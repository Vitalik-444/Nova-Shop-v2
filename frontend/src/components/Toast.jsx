import { useApp } from "../context/AppContext";

export default function Toast() {
  const { toast } = useApp();

  return (
    <div className={`toast ${toast.type}${toast.show ? " show" : ""}`}>
      {toast.message}
    </div>
  );
}
