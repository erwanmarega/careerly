function extractJobInfo() {
  const url = window.location.href

  if (url.includes('linkedin.com/jobs')) {
    const position =
      document.querySelector('.job-details-jobs-unified-top-card__job-title h1')?.textContent?.trim() ||
      document.querySelector('h1.t-24')?.textContent?.trim() ||
      document.querySelector('h1')?.textContent?.trim()

    const company =
      document.querySelector('.job-details-jobs-unified-top-card__company-name a')?.textContent?.trim() ||
      document.querySelector('.job-details-jobs-unified-top-card__primary-description-container a')?.textContent?.trim()

    const location =
      document.querySelector('.job-details-jobs-unified-top-card__bullet')?.textContent?.trim()

    return { position, company, location, url, source: 'LinkedIn' }
  }

  if (url.includes('indeed.com') || url.includes('indeed.fr')) {
    const position =
      document.querySelector('[data-testid="jobsearch-JobInfoHeader-title"]')?.textContent?.trim() ||
      document.querySelector('h1.jobsearch-JobInfoHeader-title')?.textContent?.trim() ||
      document.querySelector('h1')?.textContent?.trim()

    const company =
      document.querySelector('[data-testid="inlineHeader-companyName"] span')?.textContent?.trim() ||
      document.querySelector('.jobsearch-InlineCompanyRating-companyHeader')?.textContent?.trim()

    const location =
      document.querySelector('[data-testid="job-location"]')?.textContent?.trim() ||
      document.querySelector('.jobsearch-JobInfoHeader-subtitle div')?.textContent?.trim()

    return { position, company, location, url, source: 'Indeed' }
  }

  if (url.includes('welcometothejungle.com')) {
    const position =
      document.querySelector('[data-testid="job-header-title"]')?.textContent?.trim() ||
      document.querySelector('h1')?.textContent?.trim()

    const company =
      document.querySelector('[data-testid="job-header-company-name"]')?.textContent?.trim() ||
      document.querySelector('h2')?.textContent?.trim()

    const location =
      document.querySelector('[data-testid="job-metadata-location"] span')?.textContent?.trim()

    return { position, company, location, url, source: 'Welcome to the Jungle' }
  }

  if (url.includes('jobteaser.com')) {
    const position =
      document.querySelector('.jt-h1')?.textContent?.trim() ||
      document.querySelector('h1')?.textContent?.trim()

    const company =
      document.querySelector('.company-name')?.textContent?.trim() ||
      document.querySelector('[class*="company"] h2')?.textContent?.trim()

    return { position, company, location: null, url, source: 'JobTeaser' }
  }

  if (url.includes('hellowork.com')) {
    const position =
      document.querySelector('h1')?.textContent?.trim()

    const company =
      document.querySelector('[class*="company-name"]')?.textContent?.trim() ||
      document.querySelector('[class*="CompanyName"]')?.textContent?.trim()

    return { position, company, location: null, url, source: 'HelloWork' }
  }

  if (url.includes('monster.fr') || url.includes('monster.com')) {
    const position =
      document.querySelector('h1.title')?.textContent?.trim() ||
      document.querySelector('h1')?.textContent?.trim()

    const company =
      document.querySelector('.company')?.textContent?.trim()

    return { position, company, location: null, url, source: 'Monster' }
  }

  const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content')
  const ogSiteName = document.querySelector('meta[property="og:site_name"]')?.getAttribute('content')

  return {
    position: ogTitle || document.title,
    company: ogSiteName || '',
    location: null,
    url,
    source: null,
  }
}

window.__careerly_extract = extractJobInfo
