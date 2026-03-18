const API_URL = 'https://careerly-production.up.railway.app'

let accessToken = null
let createdAppId = null

const $ = (id) => document.getElementById(id)

function showView(id) {
  document.querySelectorAll('.view').forEach((v) => v.classList.add('hidden'))
  $(id).classList.remove('hidden')
}

function setLoading(btn, loading, label) {
  btn.disabled = loading
  btn.textContent = loading ? 'Chargement…' : label
}

async function init() {
  const stored = await chrome.storage.local.get(['accessToken', 'user'])
  if (stored.accessToken && stored.user) {
    accessToken = stored.accessToken
    showMain(stored.user)
    await extractAndFill()
  } else {
    showView('view-login')
  }
}

function showMain(user) {
  $('user-email').textContent = user.email
  showView('view-main')
}

async function extractAndFill() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab?.id) return

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const url = window.location.href

        if (url.includes('linkedin.com/jobs')) {
          return {
            position:
              document.querySelector('.job-details-jobs-unified-top-card__job-title h1')?.textContent?.trim() ||
              document.querySelector('h1.t-24')?.textContent?.trim() ||
              document.querySelector('h1')?.textContent?.trim(),
            company:
              document.querySelector('.job-details-jobs-unified-top-card__company-name a')?.textContent?.trim() ||
              document.querySelector('.job-details-jobs-unified-top-card__primary-description-container a')?.textContent?.trim(),
            location:
              document.querySelector('.job-details-jobs-unified-top-card__bullet')?.textContent?.trim() || '',
            url,
            source: 'LinkedIn',
          }
        }

        if (url.includes('indeed.com') || url.includes('indeed.fr')) {
          return {
            position:
              document.querySelector('[data-testid="jobsearch-JobInfoHeader-title"]')?.textContent?.trim() ||
              document.querySelector('h1')?.textContent?.trim(),
            company:
              document.querySelector('[data-testid="inlineHeader-companyName"] span')?.textContent?.trim() ||
              document.querySelector('.jobsearch-InlineCompanyRating-companyHeader')?.textContent?.trim(),
            location:
              document.querySelector('[data-testid="job-location"]')?.textContent?.trim() || '',
            url,
            source: 'Indeed',
          }
        }

        if (url.includes('welcometothejungle.com')) {
          return {
            position:
              document.querySelector('[data-testid="job-header-title"]')?.textContent?.trim() ||
              document.querySelector('h1')?.textContent?.trim(),
            company:
              document.querySelector('[data-testid="job-header-company-name"]')?.textContent?.trim(),
            location:
              document.querySelector('[data-testid="job-metadata-location"] span')?.textContent?.trim() || '',
            url,
            source: 'Welcome to the Jungle',
          }
        }

        if (url.includes('jobteaser.com')) {
          return {
            position: document.querySelector('.jt-h1')?.textContent?.trim() || document.querySelector('h1')?.textContent?.trim(),
            company: document.querySelector('.company-name')?.textContent?.trim(),
            location: '',
            url,
            source: 'JobTeaser',
          }
        }

        if (url.includes('hellowork.com')) {
          return {
            position: document.querySelector('h1')?.textContent?.trim(),
            company:
              document.querySelector('[class*="company-name"]')?.textContent?.trim() ||
              document.querySelector('[class*="CompanyName"]')?.textContent?.trim(),
            location: '',
            url,
            source: 'HelloWork',
          }
        }

        const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content')
        const ogSiteName = document.querySelector('meta[property="og:site_name"]')?.getAttribute('content')

        return {
          position: ogTitle || document.title || '',
          company: ogSiteName || '',
          location: '',
          url,
          source: null,
        }
      },
    })

    const info = results?.[0]?.result
    if (!info) return

    if (info.position) $('position').value = info.position
    if (info.company) $('company').value = info.company
    if (info.location) $('location').value = info.location
    if (info.url) $('url').value = info.url

    if (info.source || info.company || info.position) {
      const banner = $('extract-banner')
      banner.classList.remove('hidden')
      $('extract-source').textContent = info.source
        ? `Infos extraites depuis ${info.source}`
        : 'Infos extraites de la page'
    }
  } catch {
  }
}

async function handleLogin(e) {
  e.preventDefault()
  const btn = $('login-btn')
  const errorBox = $('login-error')
  errorBox.classList.add('hidden')
  setLoading(btn, true, 'Se connecter')

  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: $('email').value.trim(),
        password: $('password').value,
      }),
    })

    const json = await res.json()

    if (!res.ok) {
      throw new Error(json?.message || json?.data?.message || 'Email ou mot de passe incorrect')
    }

    const { tokens, user } = json.data
    accessToken = tokens.accessToken

    await chrome.storage.local.set({ accessToken: tokens.accessToken, user })

    showMain(user)
    await extractAndFill()
  } catch (err) {
    errorBox.textContent = err.message || 'Une erreur est survenue'
    errorBox.classList.remove('hidden')
  } finally {
    setLoading(btn, false, 'Se connecter')
  }
}

async function handleSubmit(e) {
  e.preventDefault()
  const btn = $('submit-btn')
  const errorBox = $('main-error')
  errorBox.classList.add('hidden')
  setLoading(btn, true, 'Ajouter la candidature')

  const body = {
    company: $('company').value.trim(),
    position: $('position').value.trim(),
    location: $('location').value.trim() || undefined,
    url: $('url').value.trim() || undefined,
    status: $('status').value,
  }

  try {
    const res = await fetch(`${API_URL}/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    })

    if (res.status === 401) {
      await chrome.storage.local.remove(['accessToken', 'user'])
      showView('view-login')
      return
    }

    const json = await res.json()

    if (!res.ok) {
      throw new Error(json?.message || json?.data?.message || "Erreur lors de l'ajout")
    }

    createdAppId = json.data.id
    $('success-desc').textContent = `${body.position} chez ${body.company}`
    $('open-app-btn').href = `https://www.postulo.fr/applications/${createdAppId}`
    showView('view-success')
  } catch (err) {
    errorBox.textContent = err.message || 'Une erreur est survenue'
    errorBox.classList.remove('hidden')
  } finally {
    setLoading(btn, false, 'Ajouter la candidature')
  }
}

async function handleLogout() {
  await chrome.storage.local.remove(['accessToken', 'user'])
  accessToken = null
  $('email').value = ''
  $('password').value = ''
  showView('view-login')
}

function handleAddAnother() {
  $('company').value = ''
  $('position').value = ''
  $('location').value = ''
  $('url').value = ''
  $('status').value = 'SENT'
  $('extract-banner').classList.add('hidden')
  $('main-error').classList.add('hidden')
  showView('view-main')
  extractAndFill()
}

document.addEventListener('DOMContentLoaded', () => {
  $('login-form').addEventListener('submit', handleLogin)
  $('main-form').addEventListener('submit', handleSubmit)
  $('logout-btn').addEventListener('click', handleLogout)
  $('add-another-btn').addEventListener('click', handleAddAnother)
  init().catch(() => showView('view-login'))
})
