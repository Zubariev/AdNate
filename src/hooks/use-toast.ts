import { Toast, ToastActionElement, ToastProps } from "../components/ui/toast"
import {
  useCallback,
  type Dispatch,
  type SetStateAction,
  useState,
} from "react"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

type ToasterToast = ToastProps & {
  id: string
  title?: string
  description?: string
  action?: ToastActionElement
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_VALUE
  return count.toString()
}

type State = {
  toasts: ToasterToast[]
}

export function useToast() {
  const [state, setState] = useState<State>({ toasts: [] })

  const toast = useCallback(
    function ({ ...props }: Omit<ToasterToast, "id">) {
      const id = genId()

      setState((state) => {
        const toasts = state.toasts.concat({
          ...props,
          id,
        })

        return {
          ...state,
          toasts: toasts.slice(0, TOAST_LIMIT),
        }
      })

      return {
        id: id,
        dismiss: () => setState((state) => ({
          ...state,
          toasts: state.toasts.filter((t) => t.id !== id),
        })),
        update: (props: ToasterToast) =>
          setState((state) => ({
            ...state,
            toasts: state.toasts.map((t) =>
              t.id === id ? { ...t, ...props } : t
            ),
          })),
      }
    },
    [setState]
  )

  return {
    toast,
    toasts: state.toasts,
    dismiss: (toastId?: string) => {
      setState((state) => ({
        ...state,
        toasts: state.toasts.filter((t) => t.id !== toastId),
      }))
    },
  }
} 