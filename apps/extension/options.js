const DEFAULT_API = 'http://localhost:4000/api'

const apiInput = document.getElementById('apiBase')
const emailInput = document.getElementById('email')
const passwordInput = document.getElementById('password')
const statusEl = document.getElementById('status')
const loginBtn = document.getElementById('loginBtn')
const syncBtn = document.getElementById('syncBtn')

function setStatus(text, color = '#16a34a') {
  statusEl.textContent = text
  statusEl.style.color = color
}

function applyDefaultApi() {
  if (!apiInput.value) {
    apiInput.value = DEFAULT_API
  }
}

async function getStored() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['token', 'apiBase', 'email'], (result) => {
      resolve({
        token: result.token,
        apiBase: result.apiBase || DEFAULT_API,
        email: result.email || '',
      })
    })
  })
}

async function login() {
  const apiBase = apiInput.value.trim() || DEFAULT_API
  const email = emailInput.value.trim()
  const password = passwordInput.value
  if (!email || !password) {
    setStatus('请填写邮箱和密码', '#dc2626')
    return
  }

  setStatus('登录中...')
  try {
    const res = await fetch(`${apiBase}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) {
      const msg = await res.json().catch(() => ({}))
      throw new Error(msg.message || '登录失败')
    }
    const data = await res.json()
    chrome.storage.sync.set({ token: data.token, apiBase, email }, () => {
      setStatus('登录成功，开始后台同步')
    })
  } catch (error) {
    setStatus(error.message || '登录失败', '#dc2626')
  }
}

async function syncAll() {
  const { token, apiBase } = await getStored()
  if (!token) {
    setStatus('请先登录扩展', '#dc2626')
    return
  }

  setStatus('全量同步中...')
  const tree = await chrome.bookmarks.getTree()
  const tasks = []

  function traverse(nodes, path = '') {
    nodes.forEach((node) => {
      const nextPath = node.url ? path : path ? `${path}/${node.title || ''}` : node.title || ''
      if (node.url) {
        tasks.push(
          fetch(`${apiBase}/bookmarks/sync`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              event: 'created',
              data: {
                id: node.id,
                title: node.title,
                url: node.url,
                folderPath: nextPath,
                dateAdded: node.dateAdded,
              },
            }),
          }),
        )
      }
      if (node.children?.length) {
        traverse(node.children, nextPath)
      }
    })
  }

  traverse(tree, '')
  await Promise.allSettled(tasks)
  setStatus('全量同步完成')
}

loginBtn.addEventListener('click', login)
syncBtn.addEventListener('click', syncAll)

getStored().then((config) => {
  apiInput.value = config.apiBase || DEFAULT_API
  emailInput.value = config.email || ''
  applyDefaultApi()
  if (config.token) {
    setStatus('已登录，将在后台监听书签变化')
  } else {
    setStatus('请先登录以开始同步', '#dc2626')
  }
})
