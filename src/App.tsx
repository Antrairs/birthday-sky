import { useState, type ChangeEvent, type SubmitEvent } from 'react'
import csvText from './assets/data.csv?raw'

type HubbleRecord = {
  day: number
  description: string
  imageFile: string
  imageNumber: number
  month: number
  name: string
  sourceUrl: string
  year: number
}

const MONTHS = [
  '一月',
  '二月',
  '三月',
  '四月',
  '五月',
  '六月',
  '七月',
  '八月',
  '九月',
  '十月',
  '十一月',
  '十二月',
]

const NASA_IMAGE_BASE_URL =
  'https://science.nasa.gov/specials/apps/what-did-hubble-see-on-your-birthday/images/'

function parseCsv(text: string) {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let insideQuotes = false

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]
    const nextCharacter = text[index + 1]

    if (character === '"') {
      if (insideQuotes && nextCharacter === '"') {
        field += '"'
        index += 1
      } else {
        insideQuotes = !insideQuotes
      }
    } else if (character === ',' && !insideQuotes) {
      row.push(field)
      field = ''
    } else if ((character === '\n' || character === '\r') && !insideQuotes) {
      if (character === '\r' && nextCharacter === '\n') {
        index += 1
      }
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else {
      field += character
    }
  }

  if (field || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  return rows
}

function birthdayParts(dateValue: string) {
  const match = dateValue.match(/^(\d{1,2})\/(\d{1,2})\//)

  if (!match) {
    return null
  }

  return { day: Number(match[2]), month: Number(match[1]) }
}

function dateKey(month: number, day: number) {
  return `${month}-${day}`
}

function buildDataIndex(text: string) {
  const [headerRow, ...dataRows] = parseCsv(text)
  const headerIndex = new Map(headerRow.map((column, index) => [column, index]))
  const recordsByDate = new Map<string, HubbleRecord[]>()
  let currentDate = ''

  for (const row of dataRows) {
    const value = (column: string) => row[headerIndex.get(column) ?? -1]?.trim() ?? ''
    const rowDate = value('Date')

    if (rowDate) {
      currentDate = rowDate
    }

    const parts = birthdayParts(currentDate)
    const imageFile = value('Image_File')

    if (!parts || !imageFile) {
      continue
    }

    const record: HubbleRecord = {
      day: parts.day,
      description: value('Description'),
      imageFile,
      imageNumber: Number(value('Image_Number')) || 1,
      month: parts.month,
      name: value('Name') || '未命名天体',
      sourceUrl: value('URL') || 'https://science.nasa.gov/mission/hubble/',
      year: Number(value('Year')) || 0,
    }
    const key = dateKey(record.month, record.day)
    const records = recordsByDate.get(key) ?? []

    records.push(record)
    recordsByDate.set(key, records)
  }

  for (const records of recordsByDate.values()) {
    records.sort((left, right) => left.imageNumber - right.imageNumber)
  }

  return recordsByDate
}

const recordsByDate = buildDataIndex(csvText)

function daysInMonth(month: number) {
  return new Date(2020, month, 0).getDate()
}

function objectType(record: HubbleRecord) {
  const name = record.name.toLowerCase()
  const searchableText = `${name} ${record.description}`.toLowerCase()

  if (name.includes('nebula')) return '星云'
  if (name.includes('supernova')) return '超新星遗迹'
  if (name.includes('asteroid')) return '小行星'
  if (name.includes('planet')) return '行星'
  if (name.includes('galaxy cluster')) return '星系团'
  if (name.includes('cluster')) return '星团'
  if (name.includes('galaxy')) return '星系'
  if (name.includes('star')) return '恒星'
  if (searchableText.includes('nebula')) return '星云'
  if (searchableText.includes('galaxy cluster')) return '星系团'
  if (searchableText.includes('galaxy')) return '星系'
  if (searchableText.includes('cluster')) return '星团'
  if (searchableText.includes('supernova')) return '超新星遗迹'
  if (searchableText.includes('asteroid')) return '小行星'
  if (searchableText.includes('planet')) return '行星'
  if (searchableText.includes('star')) return '恒星'

  return '深空天体'
}

function chineseDescription(record: HubbleRecord) {
  switch (objectType(record)) {
    case '星云':
      return '气体与尘埃在这里交织成一片星云，恒星的诞生与演化都留下了痕迹。'
    case '星系团':
      return '许多遥远的星系被引力聚拢在一起，组成一座缓慢漂浮的宇宙群岛。'
    case '星系':
      return '这是一座遥远的星系，星光、尘埃与漫长岁月共同勾勒出它的形状。'
    case '星团':
      return '这里聚集着一群被引力牵引的恒星，像一小片漂浮在黑暗中的星光。'
    case '超新星遗迹':
      return '一颗恒星曾在这里留下爆发后的痕迹，炽烈的光穿过宇宙抵达我们眼前。'
    case '小行星':
      return '这是一颗在太阳系中运行的小行星，哈勃也曾为它留下清晰的宇宙影像。'
    case '行星':
      return '这颗行星与它身边的世界，在哈勃的凝视下显出一幅安静而辽阔的景象。'
    case '恒星':
      return '这是一处恒星所在的宇宙目标，光从遥远深处穿行多年，终于被哈勃捕捉。'
    default:
      return '这是一处被哈勃记录下来的遥远天体，光线穿过漫长岁月，才抵达我们的视野。'
  }
}

function App() {
  const [month, setMonth] = useState<number | ''>('')
  const [day, setDay] = useState<number | ''>('')
  const [results, setResults] = useState<HubbleRecord[] | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [notice, setNotice] = useState('')
  const [imageError, setImageError] = useState(false)
  const activeRecord = results?.[activeIndex] ?? null
  const availableDays = month === '' ? 31 : daysInMonth(month)

  const handleMonthChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextMonth = Number(event.target.value)

    setMonth(nextMonth)
    setNotice('')

    if (day !== '' && day > daysInMonth(nextMonth)) {
      setDay('')
    }
  }

  const handleDayChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setDay(Number(event.target.value))
    setNotice('')
  }

  const handleSearch = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (month === '' || day === '') {
      setNotice('请先选择月份和日期。')
      return
    }

    const nextResults = recordsByDate.get(dateKey(month, day)) ?? []

    if (nextResults.length === 0) {
      setNotice('这一天暂时没有可用的观测记录，请换一个日期。')
      setResults(null)
      return
    }

    setImageError(false)
    setResults(nextResults)
    setActiveIndex(0)
    setNotice('')
  }

  const handleChooseAnotherDate = () => {
    setResults(null)
    setActiveIndex(0)
    setMonth('')
    setDay('')
    setNotice('')
  }

  const dateLabel = month !== '' && day !== '' ? `${MONTHS[month - 1]} ${day} 日` : ''

  return (
    <main className="space-backdrop min-h-[100svh]">
      <div className="mx-auto flex min-h-[100svh] w-[calc(100%_-_2rem)] max-w-[1220px] flex-col sm:w-[calc(100%_-_2.5rem)] lg:w-[calc(100%_-_4.5rem)]">
        <header className="flex items-center justify-between pb-5 pt-[22px] sm:pt-[30px]">
          <div className="inline-flex items-center gap-2.5 text-[0.77rem] font-semibold uppercase tracking-[0.17em] text-white/90" aria-label="Birthday Sky">
            <span className="text-[1.1rem] leading-none text-[#aaa9ff]" aria-hidden="true">✦</span>
            <span>Birthday Sky</span>
          </div>
          <span className="hidden text-[0.63rem] uppercase tracking-[0.17em] text-[rgba(211,214,240,0.52)] sm:block">HUBBLE / DEEP SPACE</span>
        </header>

        {results && activeRecord ? (
          <section className="grid flex-1 grid-cols-1 content-start gap-7 py-5 sm:gap-10 sm:py-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(310px,0.65fr)] lg:items-center lg:gap-[clamp(2rem,5vw,5.5rem)] lg:py-4 lg:pb-[3.2rem]" aria-live="polite">
            <div className="min-w-0">
              <div className="relative grid h-[45vh] min-h-[320px] place-items-center overflow-hidden border border-[rgba(184,188,255,0.27)] bg-[linear-gradient(135deg,rgba(23,26,62,0.9),rgba(4,6,17,0.92)),#080a19] shadow-[0_24px_70px_rgba(0,0,0,0.28)] before:absolute before:left-3.5 before:top-3.5 before:z-[1] before:h-[22px] before:w-[22px] before:border-l before:border-t before:border-[rgba(234,233,255,0.8)] before:content-[''] after:absolute after:bottom-3.5 after:right-3.5 after:z-[1] after:h-[22px] after:w-[22px] after:border-b after:border-r after:border-[rgba(234,233,255,0.8)] after:content-[''] sm:h-[min(60vh,680px)] sm:min-h-[360px] lg:aspect-[4/3] lg:h-[clamp(360px,60vh,680px)]">
                {imageError ? (
                  <div className="grid max-w-[310px] gap-3 p-[30px] text-center text-[rgba(235,235,255,0.78)]">
                    <span className="text-[2.4rem] text-[#b4b6ff]">◌</span>
                    <p className="m-0 leading-[1.8]">这束来自深空的光暂时没有加载成功。</p>
                    <a className="text-[#c4c6ff] underline-offset-[5px] hover:text-[#f1efff] hover:underline focus-visible:outline-2 focus-visible:outline-[#d9d9ff] focus-visible:outline-offset-4" href={activeRecord.sourceUrl} target="_blank" rel="noreferrer">
                      打开 NASA 原始资料
                    </a>
                  </div>
                ) : (
                  <img
                    key={activeRecord.imageFile}
                    className="block h-full min-h-0 w-full animate-[image-in_680ms_ease_both] object-contain"
                    src={`${NASA_IMAGE_BASE_URL}${encodeURIComponent(activeRecord.imageFile)}`}
                    alt={`${activeRecord.name}，哈勃空间望远镜影像`}
                    onError={() => setImageError(true)}
                  />
                )}
                <span className="absolute bottom-5 right-[22px] z-[2] text-[0.57rem] uppercase tracking-[0.17em] text-[rgba(236,236,255,0.66)]">NASA / ESA / Hubble</span>
              </div>
              <div className="mt-3.5 flex flex-col items-start gap-2.5 text-[0.65rem] uppercase tracking-[0.17em] text-[rgba(189,192,227,0.64)] sm:flex-row sm:items-center sm:justify-between sm:gap-[18px]">
                <span>同一天的 5 个视角</span>
                <div className="flex gap-[7px]" role="group" aria-label="选择同一天的 Hubble 视角">
                  {results.map((record, index) => (
                    <button
                      key={record.imageFile}
                      className={`h-[31px] w-[37px] border border-[rgba(174,178,255,0.28)] bg-[rgba(24,27,61,0.64)] text-[0.65rem] text-[rgba(226,227,255,0.72)] transition-[color,background,border-color] duration-200 hover:border-[#babdff] hover:bg-[#babdff] hover:text-[#111329] focus-visible:outline-2 focus-visible:outline-[#d9d9ff] focus-visible:outline-offset-4 ${index === activeIndex ? 'border-[#babdff] bg-[#babdff] text-[#111329]' : ''}`}
                      type="button"
                      aria-label={`查看第 ${index + 1} 个视角`}
                      aria-pressed={index === activeIndex}
                      onClick={() => {
                        setImageError(false)
                        setActiveIndex(index)
                      }}
                    >
                      {String(record.imageNumber).padStart(2, '0')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="max-w-[480px] lg:max-w-none">
              <span className="block text-[0.65rem] font-semibold uppercase leading-[1.4] tracking-[0.17em] text-[#aaaaf2]">YOUR DAY / HUBBLE'S VIEW</span>
              <p className="mt-[18px] text-base tracking-[0.12em] text-[#aeb1ff]">{dateLabel}</p>
              <h1 className="my-3 max-w-[500px] text-[clamp(2.5rem,14vw,4.4rem)] font-semibold leading-[1.03] tracking-[-0.065em] text-[#f7f6ff] lg:text-[clamp(2.5rem,4.5vw,5rem)]">{activeRecord.name}</h1>
              <div className="mb-[23px] h-px w-[54px] bg-[#aeb1ff]" />
              <p className="max-w-[440px] text-[clamp(1.05rem,1.4vw,1.28rem)] leading-[1.85] text-[#f3f2ff]">
                在与你生日相同的一天，<strong>哈勃曾将目光投向这里。</strong>
              </p>
              <p className="mt-[18px] max-w-[440px] text-[0.94rem] leading-[1.9] text-[rgba(203,205,232,0.7)]">{chineseDescription(activeRecord)}</p>
              <div className="mt-[30px] flex gap-[26px] border-t border-[rgba(174,178,255,0.18)] pt-[18px] lg:gap-[42px]">
                <span className="flex flex-col gap-[5px]">
                  <small className="text-[0.67rem] tracking-[0.12em] text-[rgba(170,174,211,0.6)]">观测年份</small>
                  <strong className="text-base font-medium text-[#f0efff]">{activeRecord.year || '—'}</strong>
                </span>
                <span className="flex flex-col gap-[5px]">
                  <small className="text-[0.67rem] tracking-[0.12em] text-[rgba(170,174,211,0.6)]">宇宙类型</small>
                  <strong className="text-base font-medium text-[#f0efff]">{objectType(activeRecord)}</strong>
                </span>
              </div>
              <div className="mt-[34px] flex flex-wrap items-center gap-x-7 gap-y-5">
                <a className="text-[0.8rem] text-[#c4c6ff] underline-offset-[5px] hover:text-[#f1efff] hover:underline focus-visible:outline-2 focus-visible:outline-[#d9d9ff] focus-visible:outline-offset-4" href={activeRecord.sourceUrl} target="_blank" rel="noreferrer">
                  查看 NASA 原始资料 <span aria-hidden="true">↗</span>
                </a>
                <button className="border-0 bg-transparent p-0 text-[0.88rem] font-semibold text-[#f4f3ff] hover:text-[#bdc0ff] focus-visible:outline-2 focus-visible:outline-[#d9d9ff] focus-visible:outline-offset-4" type="button" onClick={handleChooseAnotherDate}>
                  换一个生日 <span aria-hidden="true">↗</span>
                </button>
              </div>
            </div>
          </section>
        ) : (
          <section className="grid flex-1 grid-cols-1 content-center gap-7 py-5 sm:gap-10 sm:py-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(330px,0.9fr)] lg:gap-[clamp(2.5rem,7vw,7rem)] lg:py-8 lg:pb-16" aria-labelledby="page-title">
            <div className="max-w-[730px]">
              <span className="block text-[0.65rem] font-semibold uppercase leading-[1.4] tracking-[0.17em] text-[#aaaaf2]">A SMALL WINDOW INTO THE UNIVERSE</span>
              <h1 id="page-title" className="my-[1.35rem] max-w-[730px] text-[clamp(2.6rem,14vw,4.4rem)] font-semibold leading-[0.99] tracking-[-0.075em] text-[#f7f6ff] sm:text-[clamp(3rem,11vw,5.7rem)] lg:text-[clamp(3.2rem,5.4vw,5.6rem)]">
                你的生日，<span className="block bg-gradient-to-br from-[#f7f6ff] via-[#a9adff] to-[#dbbfff] bg-clip-text text-transparent lg:whitespace-nowrap">宇宙看见了什么？</span>
              </h1>
              <p className="max-w-[540px] text-[clamp(1rem,1.35vw,1.23rem)] leading-[1.9] text-[rgba(224,225,244,0.77)]">
                每一天都曾被一束来自深空的光记录。输入你的生日，看看哈勃在那一天凝望了哪里。
              </p>
              <p className="mt-[2.2rem] text-[0.84rem] text-[rgba(164,168,207,0.64)]">一份来自 NASA Hubble 的生日观测记录</p>
            </div>

            <form className="rounded-[2px] border border-[rgba(174,178,255,0.22)] bg-[linear-gradient(145deg,rgba(19,22,52,0.76),rgba(11,13,31,0.58))] p-[clamp(1.35rem,3.3vw,2.6rem)] shadow-[0_30px_90px_rgba(0,0,0,0.24),inset_0_1px_rgba(255,255,255,0.06)]" onSubmit={handleSearch}>
              <div className="mb-[2.2rem] flex items-start gap-[18px]">
                <span className="pt-1 text-[0.7rem] uppercase tracking-[0.17em] text-[#a9adff]">01</span>
                <div>
                  <p className="m-0 text-[1.15rem] font-semibold text-[#f5f4ff]">把你的日期交给星空</p>
                  <p className="m-0 mt-[5px] text-[0.83rem] text-[rgba(194,198,229,0.62)]">只需要月份和日期</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 sm:gap-3">
                <label className="flex flex-col gap-[9px] text-[0.76rem] text-[rgba(208,210,235,0.7)]">
                  <span>月份</span>
                  <span className="relative block">
                    <select className="w-full appearance-none rounded-none border border-[rgba(174,178,255,0.23)] bg-[rgba(6,8,22,0.7)] px-[15px] py-4 pr-[38px] text-[1.02rem] text-[#f7f6ff] outline-none focus-visible:border-[#b8bbff] focus-visible:shadow-[0_0_0_3px_rgba(167,172,255,0.18)]" value={month} onChange={handleMonthChange} aria-label="选择月份" required>
                      <option className="bg-[#f6f5ff] text-[#16172b]" value="" disabled>选择月份</option>
                      {MONTHS.map((monthName, index) => (
                        <option className="bg-[#f6f5ff] text-[#16172b]" key={monthName} value={index + 1}>{monthName}</option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-base text-[#aeb2ff]" aria-hidden="true">⌄</span>
                  </span>
                </label>
                <label className="flex flex-col gap-[9px] text-[0.76rem] text-[rgba(208,210,235,0.7)]">
                  <span>日期</span>
                  <span className="relative block">
                    <select className="w-full appearance-none rounded-none border border-[rgba(174,178,255,0.23)] bg-[rgba(6,8,22,0.7)] px-[15px] py-4 pr-[38px] text-[1.02rem] text-[#f7f6ff] outline-none focus-visible:border-[#b8bbff] focus-visible:shadow-[0_0_0_3px_rgba(167,172,255,0.18)]" value={day} onChange={handleDayChange} aria-label="选择日期" required>
                      <option className="bg-[#f6f5ff] text-[#16172b]" value="" disabled>选择日期</option>
                      {Array.from({ length: availableDays }, (_, index) => index + 1).map((date) => (
                        <option className="bg-[#f6f5ff] text-[#16172b]" key={date} value={date}>{String(date).padStart(2, '0')}</option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-base text-[#aeb2ff]" aria-hidden="true">⌄</span>
                  </span>
                </label>
              </div>
              <button className="group mt-[18px] flex w-full items-center justify-between border-0 bg-[#f4f2ff] px-[17px] py-4 text-base font-semibold text-[#101126] transition duration-200 hover:-translate-y-0.5 hover:bg-[#dfe0ff] focus-visible:outline-2 focus-visible:outline-[#d9d9ff] focus-visible:outline-offset-4" type="submit">
                查看那一天 <span className="transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true">→</span>
              </button>
              <p className="m-0 mt-4 min-h-[1.3em] text-[0.73rem] leading-[1.6] text-[rgba(177,181,221,0.62)]" aria-live="polite">
                {notice || '每个日期都有 5 个 Hubble 视角，包括 2 月 29 日。'}
              </p>
            </form>
          </section>
        )}

        <footer className="flex flex-col items-start gap-[7px] py-5 pb-[27px] text-[0.58rem] uppercase tracking-[0.17em] text-[rgba(164,168,207,0.5)] sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <span>计算机爱好者协会</span>
          <span>用代码，把一束宇宙的光带到眼前。</span>
        </footer>
      </div>
    </main>
  )
}

export default App
