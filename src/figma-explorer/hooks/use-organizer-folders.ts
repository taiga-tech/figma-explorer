import { useSyncExternalStore } from "react"

import { getOrganizerFoldersStore } from "../stores/organizer-folders-store"

export const useOrganizerFolders = () => {
  const store = getOrganizerFoldersStore()

  return useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot
  )
}
