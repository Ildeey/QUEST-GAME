import { useEffect, useMemo, useRef, useState } from "react"
import { content, type Shape } from "../data/content"

const assets = import.meta.glob<string>("../assets/*.svg", {
  eager: true,
  import: "default",
  query: "?url",
})

function assetUrl(name: string) {
  const url = assets[`../assets/${name}`]
  if (!url) throw new Error(`Missing game asset: ${name}`)
  return url
}

type Screen = 0 | 1 | 2 | 3 | 4 | 5 | 6
interface Feedback {
  memory: string
  rating: number
}
type State = {
  screen: Screen
  team: number | null
  q1: Record<string, string>
  q1Tries: number
  q2Slots: string[]
  q2Ok: boolean
  q2WordMode: boolean
  q2Tries: number
  word: string
  sold: string[]
  feedback?: Feedback
}
interface IconProps {
  name: string
  size?: number
}
interface HeaderProps {
  state: State
  stage: number
}
interface SuccessProps {
  title: string
  onNext: () => void
}
const initial: State = {
  screen: 1,
  team: null,
  q1: {},
  q1Tries: 0,
  q2Slots: [],
  q2Ok: false,
  q2WordMode: false,
  q2Tries: 0,
  word: "",
  sold: [],
}
const storageKey = "rudnaya-palata-progress"
const getInitial = (): State => {
  try {
    return {
      ...initial,
      ...JSON.parse(localStorage.getItem(storageKey) || "{}"),
    }
  } catch {
    return initial
  }
}

function ShapeMark({
  shape,
  color,
  small = false,
}: {
  shape: Shape
  color: string
  small?: boolean
}) {
  return (
    <span
      className={`shape ${shape} ${small ? "small" : ""}`}
      style={{ "--c": color } as React.CSSProperties}
      aria-hidden="true"
    />
  )
}
function Icon({ name, size = 48 }: IconProps) {
  const paths: Record<string, React.ReactNode> = {
    ore: (
      <>
        <path d="M14 45 8 28l13-17 22 5 8 22-16 14Z" />
        <path d="m20 25 8-7 8 12-8 13Z" />
      </>
    ),
    hammer: (
      <>
        <path d="m9 12 9-6 17 15-8 9Z" />
        <path d="m28 29 6-6 20 20-7 7Z" />
      </>
    ),
    gem: (
      <>
        <path d="m8 22 11-13h24l11 13-23 31Z" />
        <path d="m8 22 46 0M19 9l12 44L43 9" />
      </>
    ),
    flame: (
      <path d="M31 54C12 50 12 33 23 23c2 8 7 8 8 1 1-8 6-13 10-18 7 12 13 20 9 34-2 8-8 13-19 14Z" />
    ),
    mountain: (
      <>
        <path d="m4 51 19-35 9 15 8-12 18 32Z" />
        <path d="m16 30 7-14 6 10-6 2Z" />
      </>
    ),
    bolt: <path d="m34 4-20 31h14l-3 23 23-34H34Z" />,
    coal: <path d="m10 42 6-27 25-7 13 23-15 22-25-2Z" />,
    factory: (
      <>
        <path d="M8 54V24l14 8V20l14 9V8h10v29l10 6v11Z" />
        <path d="M17 43h8v11h-8Zm18 0h8v11h-8Z" />
      </>
    ),
    chest: (
      <>
        <path d="M7 23h50v32H7Z" />
        <path d="M11 23c0-13 9-17 21-17s21 4 21 17M28 31h8v12h-8Z" />
      </>
    ),
    bucket: (
      <>
        <path d="m12 19 5 36h30l5-36Z" />
        <path d="M18 19C18 2 46 2 46 19" />
      </>
    ),
    chisel: <path d="m10 50 8 6 36-42-9-8Z" />,
    forge: (
      <>
        <path d="M8 44h33v12H8Z" />
        <path d="M17 43V20h28c0 13-9 22-28 23Z" />
      </>
    ),
    map: (
      <>
        <path d="m5 14 17-7 18 7 17-7v42l-17 7-18-7-17 7Z" />
        <path d="M22 7v42m18-35v42" />
      </>
    ),
    coin: (
      <>
        <circle cx="32" cy="32" r="25" />
        <path d="M32 16v32m9-25c-13-7-20 1-13 7l8 4c8 4 3 13-8 9l-5-3" />
      </>
    ),
    wheel: (
      <>
        <circle cx="32" cy="32" r="25" />
        <circle cx="32" cy="32" r="7" />
        <path d="M32 7v18m0 14v18M7 32h18m14 0h18M14 14l13 13m10 10 13 13m0-36L37 27M27 37 14 50" />
      </>
    ),
    flag: (
      <>
        <path d="M14 56V8" />
        <path d="M16 10h34L39 22l11 12H16Z" />
      </>
    ),
  }
  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
    >
      {paths[name] || paths.gem}
    </svg>
  )
}
function Button({
  children,
  onClick,
  disabled = false,
  tone = "green",
  className = "",
}: React.PropsWithChildren<{
  onClick?: () => void
  disabled?: boolean
  tone?: string
  className?: string
}>) {
  return (
    <button
      className={`btn ${tone} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}
function Header({ state, stage }: HeaderProps) {
  const team = content.teams.find((t) => t.id === state.team)
  const goal = [
    content.quest1.goal,
    content.quest2.goal,
    content.quest3.goal,
    content.final.title,
  ][stage]
  return (
    <header className="game-header">
      <div className="team-chip">
        {team && (
          <>
            <img
              className="explorer-avatar"
              src={assetUrl(team.portrait)}
              alt=""
            />
            <span>
              <small>{content.app.teamLabel}</small>
              {team.name}
            </span>
          </>
        )}
      </div>
      <div className="goal">{goal}</div>
      <div className="dots">
        {content.app.stages.map((x, i) => (
          <span
            key={x}
            className={i === stage ? "active" : i < stage ? "complete" : ""}
            aria-label={i === 3 ? "Финиш" : `Задание ${i + 1}`}
          >
            {i < stage ? "✓" : i === 3 ? <Icon name="flag" size={25} /> : x}
          </span>
        ))}
      </div>
    </header>
  )
}
function Success({ title, onNext }: SuccessProps) {
  return (
    <div className="success-panel pop">
      <div className="reward-orbit">
        <Icon name="gem" size={100} />
        <span>✓</span>
      </div>
      <div className="reward-label">{content.app.reward}</div>
      <div className="display">{title}</div>
      <div className="reward-sparkles" aria-hidden="true">
        ✦ · ✧ · ✦
      </div>
      <Button onClick={onNext}>{content.app.next} →</Button>
    </div>
  )
}

function SafeCode({ team }: { team: number | null }) {
  return (
    <div className="safe-cells" aria-label="Цифра команды в шестизначном коде">
      {content.safeDigits.map((digit, index) => (
        <span key={index} className={index === (team || 1) - 1 ? "filled" : ""}>
          {index === (team || 1) - 1 ? digit : ""}
        </span>
      ))}
    </div>
  )
}

export default function App() {
  const [state, setState] = useState<State>(getInitial)
  const [selected, setSelected] = useState<string | null>(null)
  const [message, setMessage] = useState("")
  const [success, setSuccess] = useState(false)
  const [customer, setCustomer] = useState<string | null>(null)
  const [customerDialog, setCustomerDialog] = useState<string | null>(null)
  const [product, setProduct] = useState<string | null>(null)
  const [flipped, setFlipped] = useState<string[]>([])
  const [memory, setMemory] = useState("")
  const [rating, setRating] = useState(0)
  const [hints, setHints] = useState(true)
  const [notesOpen, setNotesOpen] = useState(false)
  const hold = useRef<number | null>(null)
  const goods = useMemo(() => {
    const shuffled = [...content.quest3.goods]
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const target = Math.floor(Math.random() * (index + 1))
      ;[shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]]
    }
    return shuffled
  }, [])
  useEffect(
    () => localStorage.setItem(storageKey, JSON.stringify(state)),
    [state],
  )
  const update = (patch: Partial<State>) =>
    setState((s) => ({ ...s, ...patch }))
  const go = (screen: Screen) => {
    setSuccess(false)
    setMessage("")
    setSelected(null)
    update({ screen })
  }
  const team = content.teams.find((t) => t.id === state.team)

  if (state.screen === 0)
    return (
      <main className="app guide-screen">
        <div className="paper guide-box">
          <div className="display">{content.guide.title}</div>
          <Button
            tone="orange"
            onClick={() => {
              localStorage.removeItem(storageKey)
              setState({ ...initial })
            }}
          >
            {content.guide.reset}
          </Button>
          <div className="guide-jumps">
            {content.guide.jump.map((x, i) => (
              <Button key={x} tone="blue" onClick={() => go((i + 2) as Screen)}>
                {x}
              </Button>
            ))}
          </div>
          <label className="toggle">
            <input
              type="checkbox"
              checked={hints}
              onChange={(e) => setHints(e.target.checked)}
            />
            <span>{content.guide.hints}</span>
          </label>
          <Button onClick={() => go(state.team ? 2 : 1)}>
            {content.guide.close}
          </Button>
        </div>
      </main>
    )

  if (state.screen === 1)
    return (
      <main className="app start-screen">
        <button
          className="start-brand"
          type="button"
          aria-label="Удерживайте, чтобы открыть экран экскурсовода"
          onPointerDown={() =>
            (hold.current = window.setTimeout(() => go(0), 3000))
          }
          onPointerUp={() => {
            if (hold.current) clearTimeout(hold.current)
          }}
          onPointerLeave={() => {
            if (hold.current) clearTimeout(hold.current)
          }}
        >
          <span className="brand-symbol">
            <Icon name="gem" size={28} />
          </span>
          {content.app.title}
          <span>{content.app.eyebrow}</span>
        </button>
        <div className="welcome-copy">
          <span className="welcome-badge">{content.app.ready}</span>
          <h1>{content.app.welcome}</h1>
          <p>{content.app.welcomeText}</p>
        </div>
        <div className="hero-rewards" aria-hidden="true">
          <span className="geometry-orbit circle-orbit">
            <i />
          </span>
          <span className="geometry-orbit diamond-orbit">
            <i />
          </span>
          <span className="geometry-orbit star-orbit">
            <i />
          </span>
        </div>
        <div className="start-prompt">{content.app.chooseTeam}</div>
        <div className="team-grid">
          {content.teams.map((t) => (
            <button
              key={t.id}
              className={`team-card ${state.team === t.id ? "chosen" : ""} ${
                state.team && state.team !== t.id ? "dim" : ""
              }`}
              style={{ "--team": t.color } as React.CSSProperties}
              onClick={() =>
                update({ team: state.team === t.id ? null : t.id })
              }
            >
              <span className="sticker">
                <img
                  className="explorer-avatar"
                  src={assetUrl(t.portrait)}
                  alt=""
                />
              </span>
              <strong>{t.name}</strong>
              <span className="team-number">
                {content.app.teamLabel} {t.id}
              </span>
              {state.team === t.id && <b className="check">✓</b>}
            </button>
          ))}
        </div>
        <Button
          className="start-action"
          disabled={!state.team}
          onClick={() => go(2)}
        >
          {content.app.start} →
        </Button>
      </main>
    )

  if (state.screen === 2) {
    const cells = content.quest1.mapGroups.flatMap((g) =>
      g.names.map((n) => ({
        id: `${g.type}-${n}`,
        label: n,
        type: g.type,
      })),
    )
    const place = (cell: string, piece?: string | null) => {
      const p = piece || selected
      const occupied = Object.entries(state.q1).find(([, c]) => c === cell)?.[0]
      const next = { ...state.q1 }
      if (occupied) delete next[occupied]
      if (p) next[p] = cell
      update({ q1: next })
      setSelected(null)
      setMessage("")
    }
    const check = () => {
      const n = Object.entries(content.quest1.solution).filter(
        ([p, c]) => state.q1[p] === c,
      ).length
      if (n === 4) setSuccess(true)
      else {
        update({ q1Tries: state.q1Tries + 1 })
        setMessage(`${content.quest1.result}: ${n} из 4. ${content.app.almost}`)
      }
    }
    return (
      <main className="app game">
        <Header state={state} stage={0} />
        {success ? (
          <Success title={content.quest1.success} onNext={() => go(3)} />
        ) : (
          <>
            <div className="quest-title">
              <span className="number">1</span>
              <div>
                <div className="display">{content.quest1.title}</div>
                <p>{content.quest1.instruction}</p>
              </div>
            </div>
            <div className="q1-layout">
              <div className="map-card">
                <TerrainMap />
                <div className="map-caption">
                  <strong>{content.quest1.mapTitle}</strong>
                  <small>{content.quest1.mapSubtitle}</small>
                </div>
                {content.quest1.geography.map((g) => (
                  <span
                    className="geo-label"
                    key={g.name}
                    style={{ left: `${g.x}%`, top: `${g.y}%` }}
                  >
                    {g.name}
                  </span>
                ))}
                <div className="map-grid">
                  {cells.map((c, i) => {
                    const p = Object.entries(state.q1).find(
                      ([, v]) => v === c.id,
                    )?.[0]
                    const piece = content.quest1.pieces.find((x) => x.id === p)
                    return (
                      <button
                        key={c.id}
                        data-cell={c.id}
                        style={{
                          left: `${content.quest1.positions[i][0]}%`,
                          top: `${content.quest1.positions[i][1]}%`,
                        }}
                        className={`map-cell ${c.type} ${
                          piece ? "occupied" : ""
                        }`}
                        onClick={() => place(c.id)}
                      >
                        <span>{c.label}</span>
                        {piece ? (
                          <b>
                            <Icon name={piece.icon} size={30} />
                            {piece.name}
                          </b>
                        ) : (
                          <i>＋</i>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
              <aside className="piece-tray">
                <strong>{content.quest1.title}</strong>
                {content.quest1.pieces.map((p) => (
                  <button
                    key={p.id}
                    className={`piece ${selected === p.id ? "selected" : ""} ${
                      state.q1[p.id] ? "placed" : ""
                    }`}
                    onClick={() => setSelected(selected === p.id ? null : p.id)}
                    onPointerDown={(e) => {
                      e.currentTarget.setPointerCapture(e.pointerId)
                    }}
                    onPointerUp={(e) => {
                      const target = document
                        .elementFromPoint(e.clientX, e.clientY)
                        ?.closest("[data-cell]")
                      if (target) place(target.getAttribute("data-cell")!, p.id)
                    }}
                  >
                    <Icon name={p.icon} size={58} />
                    <span>{p.name}</span>
                    {state.q1[p.id] && <small>✓</small>}
                  </button>
                ))}
                <Button
                  tone="orange"
                  className="notes-trigger"
                  onClick={() => setNotesOpen(true)}
                >
                  ✉ {content.quest1.notesLabel}
                </Button>
              </aside>
            </div>
            {notesOpen && (
              <div
                className="note-backdrop"
                onClick={() => setNotesOpen(false)}
              >
                <section
                  className="field-notes"
                  role="dialog"
                  aria-modal="true"
                  aria-label={content.quest1.notesLabel}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="display">{content.quest1.notesLabel}</div>
                  <p>{content.quest1.notesIntro}</p>
                  <div className="notes-grid">
                    {content.quest1.notes.map((note, i) => (
                      <article key={i} className="loose-note">
                        <span>{i + 1}</span>
                        <p>{note.text}</p>
                      </article>
                    ))}
                  </div>
                  <Button onClick={() => setNotesOpen(false)}>
                    {content.quest1.closeNotes} →
                  </Button>
                </section>
              </div>
            )}
            <div className="bottom-bar">
              {message && <div className="notice warn">ⓘ {message}</div>}
              {state.q1Tries >= 3 && (
                <Button
                  tone="orange"
                  onClick={() => setMessage(content.app.guideMessage)}
                >
                  {content.app.guide}
                </Button>
              )}
              <Button
                disabled={Object.keys(state.q1).length < 4}
                onClick={check}
              >
                {content.app.check}
              </Button>
            </div>
          </>
        )}
      </main>
    )
  }

  if (state.screen === 3)
    return (
      <Quest2
        state={state}
        update={update}
        go={go}
        message={message}
        setMessage={setMessage}
        success={success}
        setSuccess={setSuccess}
      />
    )

  if (state.screen === 4) {
    const offer = () => {
      if (!customer || !product) {
        setMessage(content.quest3.selectBoth)
        return
      }
      const c = content.quest3.customers.find((x) => x.id === customer)!
      if (c.match === product) {
        update({ sold: [...state.sold, customer] })
        setMessage(`✓ ${c.thanks}`)
        setProduct(null)
      } else
        setMessage(
          `ⓘ ${content.app.almost} ${content.quest3.wrong[(customer.length + product.length) % 3]}`,
        )
    }
    if (state.sold.length === 4 || success)
      return (
        <main className="app game">
          <Header state={state} stage={2} />
          <Success title={content.quest3.success} onNext={() => go(5)} />
        </main>
      )
    return (
      <main className="app game">
        <Header state={state} stage={2} />
        <div className="q3-top">
          <div>
            <span className="number">3</span>{" "}
            <strong>{content.quest3.title}</strong>
          </div>
          <div className="seal-progress">
            <span>{content.quest3.seal}</span>
            {content.quest3.customers.map((c) => (
              <i
                key={c.id}
                className={state.sold.includes(c.id) ? "filled" : ""}
              >
                ◆
              </i>
            ))}
          </div>
        </div>
        <div className="q3-layout">
          <div className="customers">
            {content.quest3.customers.map((c) => (
              <button
                key={c.id}
                disabled={state.sold.includes(c.id)}
                onClick={() => setCustomerDialog(c.id)}
                className={`customer ${customer === c.id ? "selected" : ""}`}
                aria-label={`Заказчик: ${c.name}`}
                title={c.name}
              >
                <span className="portrait">
                  <img src={assetUrl(c.portrait)} alt="" />
                </span>
              </button>
            ))}
          </div>
          <div className="goods">
            {goods.map((g) => (
              <div
                key={g.id}
                className={`good ${flipped.includes(g.id) ? "flipped" : ""} ${
                  product === g.id ? "selected" : ""
                }`}
              >
                <button
                  className="good-main"
                  disabled={state.sold.some(
                    (id) =>
                      content.quest3.customers.find((c) => c.id === id)
                        ?.match === g.id,
                  )}
                  onClick={() => setProduct(g.id)}
                >
                  <span className="card-turn">
                    <span className="card-face card-front">
                      <span className="product-art">
                        <img src={assetUrl(g.asset)} alt="" />
                      </span>
                      <strong>{g.name}</strong>
                    </span>
                    <span className="card-face card-back">
                      <strong>{g.name}</strong>
                      <span className="stats">
                        {g.stats.map((v, i) => (
                          <span key={i}>
                            <b>{content.quest3.stats[i]}</b>
                            <i>
                              {"◆".repeat(v)}
                              {" "}{v}/5
                            </i>
                          </span>
                        ))}
                      </span>
                    </span>
                  </span>
                </button>
                <button
                  className="flip-btn"
                  onClick={() =>
                    setFlipped((f) =>
                      f.includes(g.id)
                        ? f.filter((x) => x !== g.id)
                        : [...f, g.id],
                    )
                  }
                >
                  {content.quest3.flip}
                </button>
              </div>
            ))}
          </div>
        </div>
        {customerDialog && (
          <div
            className="order-backdrop"
            onClick={() => setCustomerDialog(null)}
          >
            {(() => {
              const selectedCustomer = content.quest3.customers.find(
                (item) => item.id === customerDialog,
              )
              if (!selectedCustomer)
                throw new Error(`Missing customer: ${customerDialog}`)
              return (
                <section
                  className="order-dialog"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="order-title"
                  onClick={(event) => event.stopPropagation()}
                >
                  <img src={assetUrl(selectedCustomer.portrait)} alt="" />
                  <div className="display" id="order-title">
                    Заказчик: {selectedCustomer.name}
                  </div>
                  <p>{selectedCustomer.request}</p>
                  <Button
                    onClick={() => {
                      setCustomer(selectedCustomer.id)
                      setCustomerDialog(null)
                    }}
                  >
                    Выбрать заказчика
                  </Button>
                  <Button
                    tone="orange"
                    onClick={() => setCustomerDialog(null)}
                  >
                    Закрыть
                  </Button>
                </section>
              )
            })()}
          </div>
        )}
        <div className="bottom-bar">
          {message && (
            <div
              className={`notice ${message.startsWith("✓") ? "ok" : "warn"}`}
            >
              {message}
            </div>
          )}
          <Button disabled={!customer || !product} onClick={offer}>
            {content.quest3.offer}
          </Button>
        </div>
      </main>
    )
  }

  if (state.screen === 5)
    return (
      <main className="app game final-screen">
        <Header state={state} stage={3} />
        <div className="final-card pop">
          <div className="seal-big">◆</div>
          <div className="display">{content.final.title}</div>
          <div className="safe-number">
            <span>{content.final.digit}</span>
            <SafeCode team={state.team} />
          </div>
          <div className="place">
            {content.final.place}: <strong>{state.team}-я</strong>
          </div>
          <p>{content.final.explanation}</p>
          <Button onClick={() => go(6)}>{content.final.feedback} →</Button>
        </div>
      </main>
    )

  const finish = () => {
    update({ feedback: { memory, rating } })
    setSuccess(true)
  }
  return (
    <main className="app feedback-screen">
      <div className="feedback-safe">
        <span>{content.final.digit}</span>
        <SafeCode team={state.team} />
      </div>
      {success ? (
        <div className="thanks pop">
          <div className="display">{content.feedback.thanks}</div>
          <Icon name="chest" size={120} />
          <Button
            onClick={() => {
              localStorage.removeItem(storageKey)
              setState({ ...initial })
              setSuccess(false)
            }}
          >
            {content.feedback.newTeam}
          </Button>
        </div>
      ) : (
        <>
          <div className="display">{content.feedback.title}</div>
          <section>
            <strong>1. {content.feedback.questionMemory}</strong>
            <div className="memory-grid">
              {content.feedback.memories.map(([icon, label]) => (
                <button
                  className={memory === label ? "selected" : ""}
                  key={label}
                  onClick={() => setMemory(label)}
                >
                  <Icon name={icon} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </section>
          <section>
            <strong>2. {content.feedback.questionRating}</strong>
            <div className="rating">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setRating(n)}
                  className={n <= rating ? "on" : ""}
                >
                  ◆
                </button>
              ))}
            </div>
            <div className="rating-labels">
              <span>{content.feedback.low}</span>
              <span>{content.feedback.high}</span>
            </div>
          </section>
          <Button disabled={!memory || !rating} onClick={finish}>
            {content.feedback.done}
          </Button>
        </>
      )}
    </main>
  )
}

function TerrainMap() {
  return (
    <svg
      className="terrain-map"
      viewBox="0 0 1000 600"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <pattern
          id="terrain-grid"
          width="70"
          height="70"
          patternUnits="userSpaceOnUse"
        >
          <path d="M70 0H0V70" fill="none" stroke="#9ba987" strokeWidth=".6" />
        </pattern>
        <pattern
          id="trees"
          width="24"
          height="23"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="7" cy="7" r="9" fill="#789d66" />
          <circle cx="18" cy="18" r="8" fill="#8eac77" />
          <circle cx="7" cy="7" r="5" fill="#698f5b" />
        </pattern>
        <pattern
          id="fields"
          width="12"
          height="12"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(24)"
        >
          <path d="M0 0V12" stroke="#c8cc9c" strokeWidth="3" />
        </pattern>
      </defs>
      <rect width="1000" height="600" fill="#e4e5c9" />
      <path d="M0 260Q130 220 260 300L300 600H0Z" fill="url(#fields)" />
      <path d="M0 0H280L330 110 240 215 40 200 0 250Z" fill="url(#trees)" />
      <path d="m690 370 310-50v280H720l-40-110Z" fill="url(#trees)" />
      {Array.from({ length: 11 }, (_, i) => (
        <path
          key={i}
          d={`M${550 + i * 21} -20 Q${640 + i * 21} 100 ${570 + i * 25} 210 T${650 + i * 25} 410`}
          fill="none"
          stroke="#b5b7a0"
          strokeWidth="1.5"
        />
      ))}
      <path
        d="M330-30C440 90 270 180 430 230S500 360 620 420 610 570 740 640"
        fill="none"
        stroke="#75aeba"
        strokeWidth="50"
      />
      <path
        d="M330-30C440 90 270 180 430 230S500 360 620 420 610 570 740 640"
        fill="none"
        stroke="#b0d6df"
        strokeWidth="35"
      />
      <path
        d="M-20 420 190 360 350 390 550 300 800 315 1020 180M230 650 260 470 190 360 220 230 450 100 660 80 850-20"
        fill="none"
        stroke="#d1bd91"
        strokeWidth="13"
      />
      <path
        d="M-20 420 190 360 350 390 550 300 800 315 1020 180M230 650 260 470 190 360 220 230 450 100 660 80 850-20"
        fill="none"
        stroke="#fff9e9"
        strokeWidth="8"
      />
      <path
        d="m140 520 260-60 130 35 90-90 140 50"
        fill="none"
        stroke="#ae9778"
        strokeWidth="3"
        strokeDasharray="6 5"
      />
      {Array.from({ length: 22 }, (_, i) => (
        <rect
          key={i}
          x={180 + (i % 6) * 19}
          y={482 + Math.floor(i / 6) * 20}
          width="12"
          height="9"
          rx="1"
          fill={i % 3 === 0 ? "#be977e" : "#d6bf9d"}
          transform={`rotate(-14 ${180 + (i % 6) * 19} ${482 + Math.floor(i / 6) * 20})`}
        />
      ))}
      <rect width="1000" height="600" fill="url(#terrain-grid)" />
    </svg>
  )
}

function Quest2({
  state,
  update,
  go,
  message,
  setMessage,
  success,
  setSuccess,
}: {
  state: State
  update: (p: Partial<State>) => void
  go: (s: Screen) => void
  message: string
  setMessage: (s: string) => void
  success: boolean
  setSuccess: (v: boolean) => void
}) {
  const [drag, setDrag] = useState<number | null>(null)
  const [notesOpen, setNotesOpen] = useState(false)
  const suppressSlotClick = useRef(false)
  const cards = useMemo(
    () =>
      [...content.quest2.cards].sort(
        (a, b) =>
          ((a.id.charCodeAt(0) * (state.team || 1)) % 17) -
          ((b.id.charCodeAt(0) * (state.team || 1)) % 17),
      ),
    [state.team],
  )
  const add = (id: string) => {
    if (state.q2Slots.length < 6 && !state.q2Slots.includes(id))
      update({ q2Slots: [...state.q2Slots, id] })
  }
  const checkOrder = () => {
    const n = state.q2Slots.filter(
      (id, i) =>
        content.quest2.cards.find((c) => c.id === id)?.correctOrder === i,
    ).length
    if (n === 6) {
      update({ q2Ok: true })
      setMessage(`✓ ${content.quest2.correctOrder}`)
    } else {
      update({ q2Tries: state.q2Tries + 1 })
      setMessage(`${content.quest2.places}: ${n} из 6. ${content.app.almost}`)
    }
  }
  const checkWord = () =>
    state.word === content.quest2.word
      ? setSuccess(true)
      : (update({ q2Tries: state.q2Tries + 1 }),
        setMessage(content.quest2.wrongWord))
  if (success)
    return (
      <main className="app game">
        <Header state={state} stage={1} />
        <Success title={content.quest2.success} onNext={() => go(4)} />
      </main>
    )
  return (
    <main
      className={`app game q2 ${state.q2WordMode ? "word-entry" : ""}`}
    >
      <Header state={state} stage={1} />
      <div className="quest-title compact">
        <span className="number">2</span>
        <div>
          <div className="display">{content.quest2.title}</div>
          <p>{content.quest2.instruction}</p>
        </div>
      </div>
      <div className="slots">
        {content.quest2.steps.map((label, i) => {
          const card = content.quest2.cards.find(
            (c) => c.id === state.q2Slots[i],
          )
          return (
            <button
              key={label}
              onPointerDown={() => setDrag(i)}
              onPointerUp={() => {
                if (drag !== null && drag !== i) {
                  suppressSlotClick.current = true
                  window.setTimeout(() => {
                    suppressSlotClick.current = false
                  }, 0)
                  const a = [...state.q2Slots]
                  ;[a[drag], a[i]] = [a[i], a[drag]]
                  update({ q2Slots: a, q2Ok: false })
                }
                setDrag(null)
              }}
              onClick={() => {
                if (suppressSlotClick.current) {
                  suppressSlotClick.current = false
                  return
                }
                if (card)
                  update({
                    q2Slots: state.q2Slots.filter((x) => x !== card.id),
                    q2Ok: false,
                  })
              }}
              className={card ? "filled" : ""}
            >
              {card ? (
                <strong>{card.name}</strong>
              ) : (
                <span>＋</span>
              )}
            </button>
          )
        })}
      </div>
      {!state.q2WordMode ? (
        <div className="process-grid">
          {cards.map((c) => (
            <button
              key={c.id}
              disabled={state.q2Slots.includes(c.id)}
              onClick={() => add(c.id)}
            >
              <span>
                <strong>{c.name}</strong>
              </span>
              <ShapeMark shape={c.shape} color={c.color} small />
            </button>
          ))}
        </div>
      ) : (
        <div className="word-zone">
          <strong>{content.quest2.wordLabel}</strong>
          <div className="word-cells">
            {content.quest2.steps.map((_, i) => (
              <span key={i}>{state.word[i] || ""}</span>
            ))}
          </div>
          <div className="keyboard">
            {content.quest2.alphabet.map((l) => (
              <button
                key={l}
                disabled={state.word.length >= 6}
                onClick={() => update({ word: state.word + l })}
              >
                {l}
              </button>
            ))}
            <Button
              tone="orange"
              onClick={() => update({ word: state.word.slice(0, -1) })}
            >
              ⌫
            </Button>
          </div>
        </div>
      )}
      <div className="bottom-bar">
        {message && (
          <div className={`notice ${message.startsWith("✓") ? "ok" : "warn"}`}>
            {message}
          </div>
        )}
        {!state.q2WordMode && state.q2Tries >= 3 && (
          <Button
            tone="orange"
            onClick={() => setMessage(content.app.guideMessage)}
          >
            {content.app.guide}
          </Button>
        )}
        <Button
          tone="orange"
          className="notes-trigger"
          onClick={() => setNotesOpen(true)}
        >
          ✉ {content.quest1.notesLabel}
        </Button>
        {state.q2WordMode ? (
          <>
            <Button
              tone="orange"
              className="q2-back"
              onClick={() => update({ q2WordMode: false })}
            >
              ← К процессам
            </Button>
            <Button
              disabled={state.word.length !== 6}
              onClick={checkWord}
            >
              {content.quest2.checkWord}
            </Button>
          </>
        ) : state.q2Ok ? (
          <Button onClick={() => update({ q2WordMode: true })}>
            К вводу слова →
          </Button>
        ) : (
          <Button disabled={state.q2Slots.length !== 6} onClick={checkOrder}>
            {content.quest2.checkOrder}
          </Button>
        )}
      </div>
      {notesOpen && (
        <div className="note-backdrop" onClick={() => setNotesOpen(false)}>
          <section
            className="field-notes"
            role="dialog"
            aria-modal="true"
            aria-label={content.quest1.notesLabel}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="display">{content.quest1.notesLabel}</div>
            <p>{content.quest1.notesIntro}</p>
            <div className="notes-grid quest2-notes-grid">
              {content.quest2.notes.map((note, i) => {
                const card = content.quest2.cards.find(
                  (item) => item.id === note.cardId,
                )!
                return (
                  <article key={note.cardId} className="loose-note quest2-note">
                    <span>{i + 1}</span>
                    <div className="quest2-note-mark">
                      <ShapeMark
                        shape={card.shape}
                        color={card.color}
                        small
                      />
                      <b style={{ color: card.color }}>{card.letter}</b>
                    </div>
                  </article>
                )
              })}
            </div>
            <Button onClick={() => setNotesOpen(false)}>
              {content.quest1.closeNotes} →
            </Button>
          </section>
        </div>
      )}
    </main>
  )
}
