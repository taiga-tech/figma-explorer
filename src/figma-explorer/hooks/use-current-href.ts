import { useSyncExternalStore } from "react"

import { getHrefSnapshot, subscribeToHref } from "../stores/href-store"

export const useCurrentHref = () =>
  useSyncExternalStore(subscribeToHref, getHrefSnapshot, getHrefSnapshot)
