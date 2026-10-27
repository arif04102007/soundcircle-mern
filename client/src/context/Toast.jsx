import { createContext, useCallback, useContext, useState } from "react";

const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const toast = useCallback((message, type = "info", ms = 4000) => {
    const id = Math.random();
    setItems((x) => [...x, { id, message, type }]);
    setTimeout(() => setItems((x) => x.filter((i) => i.id !== id)), ms);
  }, []);
  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div aria-live="polite" className="fixed bottom-5 left-1/2 z-50 flex w-[min(92vw,28rem)] -translate-x-1/2 flex-col gap-2">
        {items.map((t) => (
          <div
            key={t.id}
            className={`rounded-2xl border px-5 py-3.5 text-sm font-semibold shadow-2xl backdrop-blur-md transition-all ${
              t.type === "error"
                ? "border-rose/40 bg-rose text-white shadow-[0_0_25px_rgba(255,45,149,0.4)]"
                : "border-lavender/40 bg-char text-white shadow-[0_0_25px_rgba(166,107,255,0.25)]"
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
