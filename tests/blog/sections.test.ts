import {
  blogFaqsSchema,
  blogSectionsSchema,
  cleanFaqs,
  getPostSections,
  legacyContentToSections,
  sectionsToHtml,
  withAnchors,
  wrapTables,
} from '@/lib/blog/sections'

describe('legacyContentToSections', () => {
  it('returns nothing for empty content', () => {
    expect(legacyContentToSections('')).toEqual([])
    expect(legacyContentToSections(null)).toEqual([])
    expect(legacyContentToSections('   ')).toEqual([])
  })

  it('keeps content with no h2 as a single introduction section', () => {
    expect(legacyContentToSections('<p>Hello</p>')).toEqual([{ title: 'Introduction', body: '<p>Hello</p>' }])
  })

  it('splits on every h2 and keeps the text before the first one', () => {
    const html = '<p>Intro</p><h2>First</h2><p>One</p><h2 class="x">Second &amp; more</h2><p>Two</p>'
    expect(legacyContentToSections(html)).toEqual([
      { title: 'Introduction', body: '<p>Intro</p>' },
      { title: 'First', body: '<p>One</p>' },
      { title: 'Second & more', body: '<p>Two</p>' },
    ])
  })

  it('drops an empty introduction when the content opens with an h2', () => {
    expect(legacyContentToSections('<h2>Only</h2><p>Body</p>')).toEqual([{ title: 'Only', body: '<p>Body</p>' }])
  })

  it('strips inline markup from the heading', () => {
    expect(legacyContentToSections('<h2><strong>Bold</strong> title</h2><p>x</p>')[0].title).toBe('Bold title')
  })
})

describe('getPostSections', () => {
  it('prefers stored sections', () => {
    const sections = [{ title: 'A', body: '<p>a</p>' }]
    expect(getPostSections({ sections, content: '<h2>B</h2>' })).toEqual(sections)
  })

  it('falls back to the legacy content when sections are empty or malformed', () => {
    expect(getPostSections({ sections: [], content: '<h2>B</h2><p>b</p>' })).toEqual([{ title: 'B', body: '<p>b</p>' }])
    expect(getPostSections({ sections: 'nope', content: '<p>c</p>' })).toEqual([{ title: 'Introduction', body: '<p>c</p>' }])
  })
})

describe('withAnchors', () => {
  it('derives unique anchors from titles', () => {
    const result = withAnchors([
      { title: 'Which terminal?', body: '' },
      { title: 'Which terminal', body: '' },
      { title: '!!!', body: '' },
    ])
    expect(result.map((s) => s.id)).toEqual(['which-terminal', 'which-terminal-2', 'section-3'])
  })

  it('never reuses the reserved faq anchor', () => {
    expect(withAnchors([{ title: 'FAQ', body: '' }])[0].id).toBe('faq-2')
  })
})

describe('sectionsToHtml', () => {
  it('mirrors the sections as h2 plus body, escaping the title', () => {
    expect(sectionsToHtml([{ title: 'A <b>', body: '<p>x</p>' }])).toBe('<h2>A &lt;b&gt;</h2><p>x</p>')
  })
})

describe('schemas', () => {
  it('requires at least one section with a title', () => {
    expect(blogSectionsSchema.safeParse([]).success).toBe(false)
    expect(blogSectionsSchema.safeParse([{ title: ' ', body: '' }]).success).toBe(false)
    expect(blogSectionsSchema.safeParse([{ title: 'Ok', body: '<p>x</p>' }]).success).toBe(true)
  })

  it('drops blank FAQ rows and rejects half-filled ones', () => {
    expect(cleanFaqs([{ question: ' ', answer: '' }, { question: 'Q', answer: 'A' }])).toEqual([{ question: 'Q', answer: 'A' }])
    expect(blogFaqsSchema.safeParse([{ question: 'Q', answer: '' }]).success).toBe(false)
  })
})

describe('wrapTables', () => {
  it('leaves html without tables unchanged', () => {
    expect(wrapTables('<p>No table</p>')).toBe('<p>No table</p>')
  })

  it('wraps every table in a scroll container', () => {
    const html = '<table><tbody><tr><td>a</td></tr></tbody></table><p>x</p><table><tbody><tr><td>b</td></tr></tbody></table>'
    expect(wrapTables(html)).toBe(
      '<div class="article-table"><table><tbody><tr><td>a</td></tr></tbody></table></div><p>x</p>' +
        '<div class="article-table"><table><tbody><tr><td>b</td></tr></tbody></table></div>'
    )
  })

  it('strips the editor min-width styles from tables and cols', () => {
    const html = '<table style="min-width: 75px"><colgroup><col style="min-width: 25px"></colgroup><tbody></tbody></table>'
    expect(wrapTables(html)).toBe('<div class="article-table"><table><colgroup><col></colgroup><tbody></tbody></table></div>')
  })
})
