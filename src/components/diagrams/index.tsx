/**
 * Small diagrams for concept questions.
 *
 * Built as a shared library keyed by idea rather than by question, because the
 * same picture answers many questions. One diagram of a fan-out serves the
 * fan-trap question, the "why did my total double" question, the bridge-table
 * question and the code review that plants the bug — so a couple of dozen
 * drawings reach a large share of the library.
 *
 * Drawn as inline SVG rather than image files for three reasons: they stay
 * sharp at any size, they cost no network request, and they can be coloured
 * with the app's own CSS variables so they follow the theme instead of being
 * a pale rectangle stuck in a dark interface.
 *
 * Every diagram is deliberately small. It sits above a question the reader is
 * about to answer, not in place of it — the job is to make the shape of the
 * thing obvious in two seconds, not to teach the whole topic.
 */

const BRAND = "var(--brand-bright)";
const WARN = "var(--warn)";
const FAINT = "var(--text-faint)";
const LINE = "var(--border-strong)";
const FILL = "var(--surface-2)";

/** Frame, caption and the accessible description every diagram shares. */
function Figure({
  caption,
  label,
  children,
  viewBox = "0 0 380 150",
}: {
  caption: string;
  /** Read by screen readers in place of the drawing. */
  label: string;
  children: React.ReactNode;
  viewBox?: string;
}) {
  return (
    <figure className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-4">
      <svg
        viewBox={viewBox}
        role="img"
        aria-label={label}
        className="w-full"
        style={{ maxHeight: 190 }}
      >
        {children}
      </svg>
      <figcaption className="mt-3 text-xs leading-relaxed text-[var(--text-muted)]">
        {caption}
      </figcaption>
    </figure>
  );
}

/** A grid cell. Used by the storage diagrams. */
function Cell({
  x,
  y,
  on = false,
  w = 26,
  h = 16,
}: {
  x: number;
  y: number;
  on?: boolean;
  w?: number;
  h?: number;
}) {
  return (
    <rect
      x={x}
      y={y}
      width={w}
      height={h}
      rx={2}
      fill={on ? BRAND : FILL}
      opacity={on ? 0.9 : 1}
      stroke={LINE}
      strokeWidth={1}
    />
  );
}

function Label({
  x,
  y,
  children,
  anchor = "start",
  colour = FAINT,
  size = 10,
  bold = false,
}: {
  x: number;
  y: number;
  children: React.ReactNode;
  anchor?: "start" | "middle" | "end";
  colour?: string;
  size?: number;
  bold?: boolean;
}) {
  return (
    <text
      x={x}
      y={y}
      fill={colour}
      fontSize={size}
      textAnchor={anchor}
      fontWeight={bold ? 700 : 400}
      fontFamily="ui-sans-serif, system-ui, sans-serif"
    >
      {children}
    </text>
  );
}

/* ------------------------------------------------------------------ */

function RowVsColumnar() {
  const cols = 5;
  const rows = 4;
  return (
    <Figure
      label="A row store reads whole rows; a column store reads only the columns a query asks for."
      caption="A query needing two columns reads two columns, not the whole table. That is the entire reason analytical warehouses are columnar — and why SELECT * costs you real money on one."
    >
      <Label x={0} y={12} bold>Row storage</Label>
      <Label x={200} y={12} bold>Columnar storage</Label>

      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols }).map((_, c) => (
          <Cell key={`r${r}${c}`} x={c * 30} y={24 + r * 22} on={r === 1} />
        )),
      )}
      <Label x={0} y={124} colour={BRAND}>
        reads the whole row to get one field
      </Label>

      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols }).map((_, c) => (
          <Cell
            key={`c${r}${c}`}
            x={200 + c * 30}
            y={24 + r * 22}
            on={c === 1 || c === 3}
          />
        )),
      )}
      <Label x={200} y={124} colour={BRAND}>
        reads only the two columns asked for
      </Label>
    </Figure>
  );
}

function PartitionVsCluster() {
  return (
    <Figure
      label="Partitioning splits a table into files that can be skipped; clustering orders rows inside each file."
      caption="Partitioning decides which files are opened at all. Clustering decides how much of an opened file has to be scanned. They solve different halves of the same problem, which is why you usually want both."
    >
      <Label x={0} y={12} bold>Partitioning</Label>
      {["01 Jan", "02 Jan", "03 Jan", "04 Jan"].map((d, i) => (
        <g key={d}>
          <rect
            x={i * 46}
            y={22}
            width={40}
            height={44}
            rx={3}
            fill={i === 2 ? BRAND : FILL}
            opacity={i === 2 ? 0.9 : 1}
            stroke={LINE}
          />
          <Label x={i * 46 + 20} y={78} anchor="middle" size={8}>
            {d}
          </Label>
        </g>
      ))}
      <Label x={0} y={100} colour={BRAND}>
        WHERE day = &apos;03 Jan&apos; opens one file
      </Label>
      <Label x={0} y={114} colour={FAINT}>
        the other three are never read
      </Label>

      <Label x={215} y={12} bold>Clustering</Label>
      <rect x={215} y={22} width={150} height={44} rx={3} fill={FILL} stroke={LINE} />
      {Array.from({ length: 10 }).map((_, i) => (
        <rect
          key={i}
          x={221 + i * 14}
          y={28}
          width={10}
          height={32}
          rx={1}
          fill={i >= 4 && i <= 6 ? WARN : LINE}
          opacity={i >= 4 && i <= 6 ? 0.9 : 0.35}
        />
      ))}
      <Label x={215} y={100} colour={WARN}>
        rows sorted, so matches sit together
      </Label>
      <Label x={215} y={114} colour={FAINT}>
        the engine skips most of the file
      </Label>
    </Figure>
  );
}

function FanOut() {
  return (
    <Figure
      label="One customer joined to two subscriptions joined to four payments produces four rows, so a value on the customer is counted four times."
      caption="Each join multiplies rows. Any measure attached to the left-hand side is then summed once per row on the right, so the total inflates by a factor — which is why it still looks plausible and reaches a dashboard."
      viewBox="0 0 380 160"
    >
      <rect x={0} y={54} width={74} height={26} rx={4} fill={FILL} stroke={LINE} />
      <Label x={37} y={71} anchor="middle" size={9}>1 customer</Label>

      {[38, 78].map((y, i) => (
        <g key={i}>
          <path d={`M74 67 C 100 67, 100 ${y + 13}, 122 ${y + 13}`} stroke={LINE} fill="none" />
          <rect x={122} y={y} width={82} height={26} rx={4} fill={FILL} stroke={LINE} />
          <Label x={163} y={y + 17} anchor="middle" size={9}>subscription</Label>
        </g>
      ))}

      {[18, 52, 86, 120].map((y, i) => (
        <g key={i}>
          <path
            d={`M204 ${i < 2 ? 51 : 91} C 232 ${i < 2 ? 51 : 91}, 232 ${y + 11}, 256 ${y + 11}`}
            stroke={LINE}
            fill="none"
          />
          <rect x={256} y={y} width={80} height={22} rx={4} fill={BRAND} opacity={0.85} />
          <Label x={296} y={y + 15} anchor="middle" size={9} colour="#04110f" bold>
            mrr counted
          </Label>
        </g>
      ))}

      <Label x={344} y={78} colour={WARN} size={11} bold>×4</Label>
    </Figure>
  );
}

function StarVsSnowflake() {
  return (
    <Figure
      label="A star schema has one flat table per dimension; a snowflake splits dimensions into further tables."
      caption="Star costs some duplication and buys short joins. Snowflake saves storage nobody is short of any more, and charges an extra join on every query an analyst writes."
    >
      <Label x={0} y={12} bold>Star</Label>
      <rect x={52} y={54} width={52} height={26} rx={4} fill={BRAND} opacity={0.9} />
      <Label x={78} y={71} anchor="middle" size={9} colour="#04110f" bold>fact</Label>
      {[
        [52, 16], [52, 110], [4, 54], [104, 54],
      ].map(([x, y], i) => (
        <g key={i}>
          <rect x={x} y={y} width={52} height={22} rx={4} fill={FILL} stroke={LINE} />
          <Label x={x + 26} y={y + 15} anchor="middle" size={8}>dim</Label>
        </g>
      ))}
      <Label x={0} y={140} colour={BRAND}>one join to any attribute</Label>

      <Label x={215} y={12} bold>Snowflake</Label>
      <rect x={258} y={54} width={52} height={26} rx={4} fill={BRAND} opacity={0.9} />
      <Label x={284} y={71} anchor="middle" size={9} colour="#04110f" bold>fact</Label>
      {[[258, 16], [258, 110], [210, 54]].map(([x, y], i) => (
        <g key={i}>
          <rect x={x} y={y} width={52} height={22} rx={4} fill={FILL} stroke={LINE} />
          <Label x={x + 26} y={y + 15} anchor="middle" size={8}>dim</Label>
        </g>
      ))}
      <rect x={316} y={16} width={46} height={22} rx={4} fill={FILL} stroke={LINE} />
      <Label x={339} y={31} anchor="middle" size={8}>sub-dim</Label>
      <path d="M310 27 L316 27" stroke={LINE} />
      <path d="M284 42 L284 38" stroke={LINE} />
      <Label x={215} y={140} colour={WARN}>two joins to reach the same attribute</Label>
    </Figure>
  );
}

function Scd2() {
  return (
    <Figure
      label="A Type 2 dimension closes the old row and opens a new one, so a fact points at the version that was live when it happened."
      caption="The fact stores the surrogate key of the version that was current at the time. That is the whole mechanism: re-run March in June and it still says North, because the March fact never pointed at the new row."
      viewBox="0 0 380 130"
    >
      <line x1={0} y1={104} x2={360} y2={104} stroke={LINE} />
      {["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((m, i) => (
        <Label key={m} x={10 + i * 60} y={120} anchor="middle" size={9}>{m}</Label>
      ))}

      <rect x={0} y={28} width={190} height={24} rx={4} fill={BRAND} opacity={0.85} />
      <Label x={10} y={44} size={9} colour="#04110f" bold>region = North</Label>
      <Label x={182} y={44} size={8} anchor="end" colour="#04110f">valid_to 31 Mar</Label>

      <rect x={192} y={62} width={168} height={24} rx={4} fill={WARN} opacity={0.85} />
      <Label x={202} y={78} size={9} colour="#1a1204" bold>region = South</Label>
      <Label x={352} y={78} size={8} anchor="end" colour="#1a1204">current</Label>

      <line x1={130} y1={20} x2={130} y2={96} stroke={FAINT} strokeDasharray="3 3" />
      <Label x={134} y={18} size={9} colour={FAINT}>a March fact points here</Label>
    </Figure>
  );
}

function Skew() {
  const heights = [8, 6, 9, 7, 5, 8, 6, 7, 9, 6, 8, 7, 5, 9, 6, 8, 7, 6, 74, 68];
  return (
    <Figure
      label="In a skewed stage most tasks finish quickly while one or two run for hours."
      caption="The work is split by hashing the join key, so every row sharing a hot key lands on one task. Adding executors gives that task no help at all — which is the answer the question is really looking for."
      viewBox="0 0 380 130"
    >
      <line x1={0} y1={100} x2={360} y2={100} stroke={LINE} />
      {heights.map((h, i) => (
        <rect
          key={i}
          x={i * 18}
          y={100 - h}
          width={12}
          height={h}
          rx={1.5}
          fill={h > 40 ? WARN : BRAND}
          opacity={h > 40 ? 0.95 : 0.55}
        />
      ))}
      <Label x={0} y={118} size={9}>198 tasks finish in under a minute</Label>
      <Label x={360} y={118} size={9} anchor="end" colour={WARN}>2 run for hours</Label>
      <Label x={0} y={14} size={9} colour={FAINT}>task duration</Label>
    </Figure>
  );
}

function EventVsProcessingTime() {
  return (
    <Figure
      label="An event happens at one time and arrives later; the watermark decides how long you wait for stragglers."
      caption="Partition on when it happened, watermark on when it arrived. Filtering on event time to decide what is new is how a pipeline silently drops every record that was late."
      viewBox="0 0 380 130"
    >
      <line x1={0} y1={44} x2={360} y2={44} stroke={LINE} />
      <Label x={0} y={30} size={9} bold>event time</Label>
      <circle cx={90} cy={44} r={5} fill={BRAND} />
      <Label x={90} y={62} anchor="middle" size={8} colour={BRAND}>happened 14:02</Label>

      <line x1={0} y1={96} x2={360} y2={96} stroke={LINE} />
      <Label x={0} y={116} size={9} bold>processing time</Label>
      <circle cx={250} cy={96} r={5} fill={WARN} />
      <Label x={250} y={86} anchor="middle" size={8} colour={WARN}>arrived 17:40</Label>

      <path d="M90 50 C 150 70, 190 78, 248 92" stroke={FAINT} strokeDasharray="3 3" fill="none" />

      <line x1={300} y1={72} x2={300} y2={112} stroke={BRAND} strokeDasharray="4 3" />
      <Label x={306} y={80} size={8} colour={BRAND}>watermark</Label>
      <Label x={306} y={92} size={8} colour={FAINT}>anything later is dropped</Label>
    </Figure>
  );
}

function Medallion() {
  const layers = [
    { name: "Bronze", note: "raw, exactly as it arrived", colour: "#a86a3d" },
    { name: "Silver", note: "cleaned, deduplicated, typed", colour: "#8d99a6" },
    { name: "Gold", note: "modelled for the business", colour: "#c9a227" },
  ];
  return (
    <Figure
      label="Bronze holds raw data, silver holds cleaned data, gold holds business-ready models."
      caption="The promise of each layer is what matters. Bronze is never edited, so anything downstream can be rebuilt from it — which is what makes a bad transform recoverable instead of permanent."
      viewBox="0 0 380 130"
    >
      {layers.map((l, i) => (
        <g key={l.name}>
          <rect
            x={0}
            y={i * 42}
            width={230}
            height={32}
            rx={4}
            fill={l.colour}
            opacity={0.85}
          />
          <Label x={12} y={i * 42 + 21} size={10} colour="#0d0f0e" bold>
            {l.name}
          </Label>
          <Label x={244} y={i * 42 + 21} size={9}>{l.note}</Label>
          {i < 2 ? (
            <path
              d={`M115 ${i * 42 + 32} L115 ${i * 42 + 42}`}
              stroke={LINE}
              markerEnd=""
            />
          ) : null}
        </g>
      ))}
    </Figure>
  );
}

function BroadcastVsShuffle() {
  return (
    <Figure
      label="A shuffle join moves both sides across the network; a broadcast join copies the small side to every executor."
      caption="If one side fits in memory, copying it everywhere removes the shuffle entirely. The shuffle is the expensive operation, so this is usually the largest single win available in a Spark job."
      viewBox="0 0 380 140"
    >
      <Label x={0} y={12} bold>Shuffle join</Label>
      {[0, 1, 2].map((i) => (
        <rect key={`a${i}`} x={i * 40} y={26} width={30} height={20} rx={3} fill={FILL} stroke={LINE} />
      ))}
      {[0, 1, 2].map((i) => (
        <rect key={`b${i}`} x={i * 40} y={92} width={30} height={20} rx={3} fill={FILL} stroke={LINE} />
      ))}
      {[0, 1, 2].map((i) =>
        [0, 1, 2].map((j) => (
          <path
            key={`p${i}${j}`}
            d={`M${i * 40 + 15} 46 L${j * 40 + 15} 92`}
            stroke={WARN}
            opacity={0.45}
          />
        )),
      )}
      <Label x={0} y={130} colour={WARN}>every row crosses the network</Label>

      <Label x={215} y={12} bold>Broadcast join</Label>
      <rect x={272} y={26} width={40} height={20} rx={3} fill={BRAND} opacity={0.9} />
      <Label x={292} y={40} anchor="middle" size={8} colour="#04110f" bold>small</Label>
      {[0, 1, 2].map((i) => (
        <g key={`c${i}`}>
          <path d={`M292 46 L${228 + i * 50} 88`} stroke={BRAND} opacity={0.5} />
          <rect x={215 + i * 50} y={92} width={32} height={20} rx={3} fill={FILL} stroke={LINE} />
        </g>
      ))}
      <Label x={215} y={130} colour={BRAND}>copied once, no shuffle</Label>
    </Figure>
  );
}

function SmallFiles() {
  return (
    <Figure
      label="Many tiny files cost far more to read than a few correctly sized ones."
      caption="Every file carries a fixed cost to list and open. Two thousand one-megabyte files hold the same data as twenty hundred-megabyte files and take far longer to read, which is why compaction exists."
      viewBox="0 0 380 120"
    >
      <Label x={0} y={12} bold>2,000 small files</Label>
      {Array.from({ length: 60 }).map((_, i) => (
        <rect
          key={i}
          x={(i % 20) * 8}
          y={26 + Math.floor(i / 20) * 12}
          width={5}
          height={8}
          rx={1}
          fill={WARN}
          opacity={0.8}
        />
      ))}
      <Label x={0} y={86} colour={WARN}>overhead per file dominates</Label>

      <Label x={215} y={12} bold>20 right-sized files</Label>
      {Array.from({ length: 6 }).map((_, i) => (
        <rect
          key={i}
          x={215 + (i % 3) * 50}
          y={26 + Math.floor(i / 3) * 24}
          width={44}
          height={18}
          rx={2}
          fill={BRAND}
          opacity={0.8}
        />
      ))}
      <Label x={215} y={86} colour={BRAND}>same data, far fewer opens</Label>
    </Figure>
  );
}

function Grain() {
  return (
    <Figure
      label="One table holding two different grains makes every sum wrong."
      caption="Mixing grains produces no error. The total simply comes out too high and stays plausible, which is why stating the grain in one sentence is the first thing the round is looking for."
      viewBox="0 0 380 130"
    >
      <Label x={0} y={12} bold>One row per order line</Label>
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x={0} y={24 + i * 22} width={160} height={16} rx={2} fill={FILL} stroke={LINE} />
          <Label x={8} y={36 + i * 22} size={8}>line · £{[40, 25, 63][i]}</Label>
        </g>
      ))}
      <Label x={0} y={110} colour={BRAND}>SUM = £128 ✓</Label>

      <Label x={215} y={12} bold>Two grains in one table</Label>
      {[0, 1].map((i) => (
        <g key={i}>
          <rect x={215} y={24 + i * 22} width={160} height={16} rx={2} fill={FILL} stroke={LINE} />
          <Label x={223} y={36 + i * 22} size={8}>line · £{[40, 25][i]}</Label>
        </g>
      ))}
      <rect x={215} y={68} width={160} height={16} rx={2} fill={WARN} opacity={0.85} />
      <Label x={223} y={80} size={8} colour="#1a1204" bold>order total · £128</Label>
      <Label x={215} y={110} colour={WARN}>SUM = £193 ✗</Label>
    </Figure>
  );
}


function ParquetVsCsv() {
  return (
    <Figure
      label="A CSV file is rows of text read end to end; a Parquet file stores each column separately with statistics, so most of it can be skipped."
      caption="A CSV has to be read from the start and parsed as text. A Parquet file stores each column as its own compressed chunk with min and max recorded, so the reader skips chunks that cannot match and decodes only the columns asked for."
      viewBox="0 0 380 150"
    >
      <Label x={0} y={12} bold>products.csv</Label>
      {Array.from({ length: 6 }).map((_, i) => (
        <g key={i}>
          <rect x={0} y={22 + i * 15} width={160} height={11} rx={1.5} fill={FILL} stroke={LINE} />
          <Label x={5} y={31 + i * 15} size={7}>
            id,name,category,price,stock
          </Label>
        </g>
      ))}
      <Label x={0} y={128} colour={WARN} size={9}>every byte read and parsed as text</Label>
      <Label x={0} y={141} colour={FAINT} size={9}>no types, no statistics, no skipping</Label>

      <Label x={215} y={12} bold>products.parquet</Label>
      {[
        { n: "id", on: false },
        { n: "name", on: false },
        { n: "category", on: true },
        { n: "price", on: true },
        { n: "stock", on: false },
      ].map((c, i) => (
        <g key={c.n}>
          <rect
            x={215 + i * 31}
            y={22}
            width={26}
            height={62}
            rx={2}
            fill={c.on ? BRAND : FILL}
            opacity={c.on ? 0.9 : 1}
            stroke={LINE}
          />
          <Label
            x={228 + i * 31}
            y={95}
            anchor="middle"
            size={7}
            colour={c.on ? BRAND : FAINT}
          >
            {c.n}
          </Label>
          <Label x={228 + i * 31} y={106} anchor="middle" size={6} colour={FAINT}>
            min/max
          </Label>
        </g>
      ))}
      <Label x={215} y={128} colour={BRAND} size={9}>only the two columns are decoded</Label>
      <Label x={215} y={141} colour={FAINT} size={9}>typed and compressed per column</Label>
    </Figure>
  );
}

/* ------------------------------------------------------------------ */

/**
 * The registry. A question names a key, so one drawing can serve a dozen
 * questions and adding a diagram never means editing a question.
 */
export const DIAGRAMS = {
  "row-vs-columnar": RowVsColumnar,
  "partition-vs-cluster": PartitionVsCluster,
  "fan-out": FanOut,
  "star-vs-snowflake": StarVsSnowflake,
  "scd2": Scd2,
  "skew": Skew,
  "event-vs-processing-time": EventVsProcessingTime,
  "medallion": Medallion,
  "broadcast-vs-shuffle": BroadcastVsShuffle,
  "small-files": SmallFiles,
  "grain": Grain,
  "parquet-vs-csv": ParquetVsCsv,
} as const;

export type DiagramKey = keyof typeof DIAGRAMS;

export function Diagram({ name }: { name: DiagramKey }) {
  const Component = DIAGRAMS[name];
  return Component ? <Component /> : null;
}
