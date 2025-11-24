const DEFAULT_API = 'http://localhost:4000/api'

async function getConfig() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['token', 'apiBase'], (result) => {
      resolve({
        token: result.token,
        apiBase: result.apiBase || DEFAULT_API,
      })
    })
  })
}

async function buildFolderPath(parentId) {
  if (!parentId) return ''
  try {
    const parents = await chrome.bookmarks.get(parentId)
    const node = parents?.[0]
    if (!node) return ''
    if (!node.parentId) return node.title || ''
    const parentPath = await buildFolderPath(node.parentId)
    return parentPath ? `${parentPath}/${node.title}` : node.title
  } catch {
    return ''
  }
}

async function syncBookmark(event, payload) {
  const config = await getConfig()
  if (!config.token) return

  const body = {
    event,
    data: payload,
  }

  try {
    await fetch(`${config.apiBase}/bookmarks/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.token}`,
      },
      body: JSON.stringify(body),
    })
  } catch (error) {
    console.error('Sync failed', error)
  }
}

chrome.bookmarks.onCreated.addListener(async (id, bookmark) => {
  const folderPath = await buildFolderPath(bookmark.parentId)
  await syncBookmark('created', {
    id,
    title: bookmark.title,
    url: bookmark.url,
    folderPath,
    dateAdded: bookmark.dateAdded,
  })
})

chrome.bookmarks.onChanged.addListener(async (id, changeInfo) => {
  const [node] = await chrome.bookmarks.get(id)
  const folderPath = await buildFolderPath(node?.parentId)
  await syncBookmark('changed', {
    id,
    title: changeInfo.title || node?.title,
    url: changeInfo.url || node?.url,
    folderPath,
  })
})

chrome.bookmarks.onRemoved.addListener(async (id, removeInfo) => {
  const folderPath = await buildFolderPath(removeInfo.parentId)
  await syncBookmark('removed', { id, folderPath })
})

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ apiBase: DEFAULT_API })
})
