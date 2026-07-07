import { createContext, useCallback, useContext, useState } from "react";
import type { ReactNode } from "react";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import type { AlertColor } from "@mui/material/Alert";

interface ToastState {
  open: boolean;
  message: string;
  severity: AlertColor;
}

type ShowToast = (message: string, severity?: AlertColor) => void;

const ToastContext = createContext<ShowToast>(() => {});

/** 어디서든 toast 를 띄우기 위한 hook. */
export function useToast(): ShowToast {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ToastState>({
    open: false,
    message: "",
    severity: "success",
  });

  const show = useCallback<ShowToast>((message, severity = "success") => {
    setState({ open: true, message, severity });
  }, []);

  const close = () => setState((s) => ({ ...s, open: false }));

  return (
    <ToastContext.Provider value={show}>
      {children}
      <Snackbar
        open={state.open}
        autoHideDuration={2500}
        onClose={close}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={state.severity} variant="filled" onClose={close} sx={{ width: "100%" }}>
          {state.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
}
