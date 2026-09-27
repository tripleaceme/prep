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


function Idempotency() {
  return (
    <Figure
      label="Appending duplicates rows on a rerun; merging leaves the table the same."
      caption="The test is not whether it runs twice without erroring. It is whether the table is identical afterwards. Append fails that; merge, or delete-and-insert the partition, passes it."
      viewBox="0 0 380 140"
    >
      <Label x={0} y={12} bold>Append</Label>
      {[0, 1].map((i) => (
        <rect key={i} x={0} y={22 + i * 16} width={110} height={12} rx={2} fill={FILL} stroke={LINE} />
      ))}
      {[0, 1].map((i) => (
        <rect key={`d${i}`} x={0} y={56 + i * 16} width={110} height={12} rx={2} fill={WARN} opacity={0.85} />
      ))}
      <Label x={0} y={100} colour={WARN} size={9}>rerun → 4 rows</Label>
      <Label x={0} y={113} colour={FAINT} size={9}>the same two, twice</Label>

      <Label x={215} y={12} bold>Merge on a key</Label>
      {[0, 1].map((i) => (
        <rect key={i} x={215} y={22 + i * 16} width={110} height={12} rx={2} fill={BRAND} opacity={0.85} />
      ))}
      <Label x={215} y={100} colour={BRAND} size={9}>rerun → 2 rows</Label>
      <Label x={215} y={113} colour={FAINT} size={9}>identical to one run</Label>
      <path d="M160 46 L200 46" stroke={LINE} />
      <Label x={180} y={40} anchor="middle" size={8} colour={FAINT}>run twice</Label>
    </Figure>
  );
}

function IncrementalVsFull() {
  return (
    <Figure
      label="A full load rewrites the whole table each run; an incremental load processes only what changed."
      caption="Incremental is cheaper and introduces the two questions a full reload never has to answer: which rows count as new, and what happens to rows that were deleted upstream."
      viewBox="0 0 380 130"
    >
      <Label x={0} y={12} bold>Full reload</Label>
      {Array.from({ length: 24 }).map((_, i) => (
        <rect key={i} x={(i % 8) * 20} y={22 + Math.floor(i / 8) * 14} width={16} height={10} rx={1.5} fill={WARN} opacity={0.8} />
      ))}
      <Label x={0} y={84} colour={WARN} size={9}>every row, every night</Label>

      <Label x={215} y={12} bold>Incremental</Label>
      {Array.from({ length: 24 }).map((_, i) => (
        <rect
          key={i}
          x={215 + (i % 8) * 20}
          y={22 + Math.floor(i / 8) * 14}
          width={16}
          height={10}
          rx={1.5}
          fill={i >= 21 ? BRAND : LINE}
          opacity={i >= 21 ? 0.9 : 0.3}
        />
      ))}
      <Label x={215} y={84} colour={BRAND} size={9}>only what changed</Label>
      <Label x={215} y={100} colour={FAINT} size={9}>but: what is new, and what was deleted?</Label>
    </Figure>
  );
}

function CdcVsPolling() {
  return (
    <Figure
      label="Polling on a timestamp cannot see a deleted row; reading the change log sees the delete as an event."
      caption="A deleted row simply stops appearing in a polled query, so the warehouse keeps it forever. The change log records the delete as an event, which is why it is the answer whenever deletes matter."
      viewBox="0 0 380 140"
    >
      <Label x={0} y={12} bold>Polling on updated_at</Label>
      {["insert", "update", "delete"].map((t, i) => (
        <g key={i}>
          <rect x={0} y={24 + i * 22} width={80} height={16} rx={2} fill={FILL} stroke={LINE} />
          <Label x={6} y={35 + i * 22} size={8}>{t}</Label>
          {i < 2 ? (
            <path d={`M82 32 L118 32`} stroke={BRAND} transform={`translate(0 ${i * 22})`} />
          ) : (
            <Label x={90} y={35 + i * 22} size={8} colour={WARN}>✕ never seen</Label>
          )}
        </g>
      ))}
      <Label x={0} y={108} colour={WARN} size={9}>the row just stops appearing</Label>
      <Label x={0} y={121} colour={FAINT} size={9}>and stays in the warehouse forever</Label>

      <Label x={215} y={12} bold>Reading the log</Label>
      {["I", "U", "D"].map((t, i) => (
        <g key={i}>
          <rect x={215 + i * 34} y={24} width={28} height={28} rx={3} fill={BRAND} opacity={0.85} />
          <Label x={229 + i * 34} y={43} anchor="middle" size={11} colour="#04110f" bold>{t}</Label>
        </g>
      ))}
      <path d="M215 62 L317 62" stroke={LINE} />
      <Label x={215} y={108} colour={BRAND} size={9}>the delete is an event too</Label>
      <Label x={215} y={121} colour={FAINT} size={9}>ordered, and nothing is inferred</Label>
    </Figure>
  );
}

function DeadLetter() {
  return (
    <Figure
      label="Good rows continue through the pipeline; bad rows go to a quarantine with the reason, and the run does not stop."
      caption="The two instincts are both wrong: failing the run on one bad row means it never finishes, and dropping bad rows silently means nobody learns the feed changed. Quarantine keeps the row and the reason."
      viewBox="0 0 380 130"
    >
      <rect x={0} y={44} width={68} height={28} rx={4} fill={FILL} stroke={LINE} />
      <Label x={34} y={62} anchor="middle" size={9}>incoming</Label>
      <path d="M68 58 L104 58" stroke={LINE} />
      <rect x={104} y={44} width={62} height={28} rx={4} fill={FILL} stroke={LINE} />
      <Label x={135} y={62} anchor="middle" size={9}>parse</Label>

      <path d="M166 52 C 196 52, 196 26, 228 26" stroke={BRAND} fill="none" />
      <rect x={228} y={12} width={128} height={28} rx={4} fill={BRAND} opacity={0.85} />
      <Label x={292} y={30} anchor="middle" size={9} colour="#04110f" bold>loaded</Label>

      <path d="M166 64 C 196 64, 196 92, 228 92" stroke={WARN} fill="none" />
      <rect x={228} y={78} width={128} height={28} rx={4} fill={WARN} opacity={0.85} />
      <Label x={292} y={91} anchor="middle" size={8} colour="#1a1204" bold>quarantined</Label>
      <Label x={292} y={101} anchor="middle" size={7} colour="#1a1204">row + reason + run id</Label>

      <Label x={228} y={122} size={9} colour={FAINT}>the run still finishes</Label>
    </Figure>
  );
}

function DagOrder() {
  return (
    <Figure
      label="Tasks run after everything they depend on; a failure blocks everything downstream of it."
      caption="A scheduler turns the dependency graph into an order. When a task fails, what matters to everyone waiting is not which task failed but everything downstream that now cannot run."
      viewBox="0 0 380 130"
    >
      {[
        { x: 0, y: 20, l: "extract", fail: true },
        { x: 0, y: 72, l: "extract" },
        { x: 100, y: 20, l: "load", blocked: true },
        { x: 100, y: 72, l: "load" },
        { x: 200, y: 46, l: "join", blocked: true },
        { x: 296, y: 46, l: "report", blocked: true },
      ].map((n, i) => (
        <g key={i}>
          <rect
            x={n.x}
            y={n.y}
            width={72}
            height={26}
            rx={4}
            fill={n.fail ? WARN : n.blocked ? "transparent" : FILL}
            opacity={n.fail ? 0.9 : 1}
            stroke={n.blocked ? WARN : LINE}
            strokeDasharray={n.blocked ? "4 3" : undefined}
          />
          <Label
            x={n.x + 36}
            y={n.y + 17}
            anchor="middle"
            size={9}
            colour={n.fail ? "#1a1204" : n.blocked ? WARN : FAINT}
            bold={n.fail}
          >
            {n.l}
          </Label>
        </g>
      ))}
      <path d="M72 33 L100 33" stroke={LINE} />
      <path d="M72 85 L100 85" stroke={LINE} />
      <path d="M172 33 C 188 33, 188 59, 200 59" stroke={LINE} fill="none" />
      <path d="M172 85 C 188 85, 188 59, 200 59" stroke={LINE} fill="none" />
      <path d="M272 59 L296 59" stroke={LINE} />
      <Label x={0} y={118} size={9} colour={WARN}>one failure</Label>
      <Label x={100} y={118} size={9} colour={WARN}>three tasks blocked, one branch fine</Label>
    </Figure>
  );
}

function RetryBackoff() {
  const delays = [1, 2, 4, 8, 16, 16, 16];
  return (
    <Figure
      label="Each retry waits twice as long as the last, up to a ceiling."
      caption="Retrying immediately turns one failure into a burst of traffic at a service already struggling. Doubling the wait backs off, the cap stops it growing forever, and jitter stops every client retrying in step."
      viewBox="0 0 380 120"
    >
      <line x1={0} y1={86} x2={360} y2={86} stroke={LINE} />
      {delays.map((d, i) => (
        <g key={i}>
          <rect
            x={i * 50}
            y={86 - d * 3.6}
            width={34}
            height={d * 3.6}
            rx={2}
            fill={d === 16 ? FAINT : BRAND}
            opacity={d === 16 ? 0.5 : 0.85}
          />
          <Label x={i * 50 + 17} y={100} anchor="middle" size={8}>{d}s</Label>
        </g>
      ))}
      <line x1={0} y1={28} x2={360} y2={28} stroke={WARN} strokeDasharray="4 3" />
      <Label x={360} y={24} anchor="end" size={8} colour={WARN}>cap</Label>
      <Label x={0} y={114} size={9} colour={FAINT}>attempt 1 … 7</Label>
    </Figure>
  );
}


function JoinTypes() {
  const sets = [
    { l: "INNER", a: false, mid: true, b: false },
    { l: "LEFT", a: true, mid: true, b: false },
    { l: "ANTI", a: true, mid: false, b: false },
  ];
  return (
    <Figure
      label="Inner keeps only matches; left keeps every row on the left; anti keeps only the rows with no match."
      caption="An anti-join answers 'who has none of these', and it is the shape behind customers who never ordered, products never sold, and orphaned foreign keys."
      viewBox="0 0 380 120"
    >
      {sets.map((s, i) => (
        <g key={s.l} transform={`translate(${i * 128} 0)`}>
          <Label x={52} y={12} anchor="middle" size={9} bold>{s.l}</Label>
          <circle cx={40} cy={58} r={30} fill={s.a ? BRAND : FILL} opacity={s.a ? 0.55 : 1} stroke={LINE} />
          <circle cx={70} cy={58} r={30} fill={s.b ? BRAND : FILL} opacity={s.b ? 0.55 : 1} stroke={LINE} />
          {s.mid ? (
            <path
              d="M55 33 A 30 30 0 0 0 55 83 A 30 30 0 0 0 55 33"
              fill={BRAND}
              opacity={0.9}
            />
          ) : null}
          <Label x={52} y={108} anchor="middle" size={8}>
            {s.l === "INNER" ? "matches only" : s.l === "LEFT" ? "all of A" : "A with no B"}
          </Label>
        </g>
      ))}
    </Figure>
  );
}

function WindowVsGroupBy() {
  return (
    <Figure
      label="GROUP BY collapses rows into one per group; a window function keeps every row and adds the aggregate alongside."
      caption="That is the whole difference. If you need the total and the individual rows in the same result, GROUP BY cannot give you both and a window function can."
      viewBox="0 0 380 130"
    >
      <Label x={0} y={12} bold>GROUP BY</Label>
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={0} y={22 + i * 14} width={70} height={10} rx={1.5} fill={FILL} stroke={LINE} />
      ))}
      <path d="M74 48 L100 48" stroke={LINE} />
      <rect x={104} y={42} width={60} height={12} rx={2} fill={BRAND} opacity={0.9} />
      <Label x={134} y={51} anchor="middle" size={8} colour="#04110f" bold>1 row</Label>
      <Label x={0} y={104} size={9} colour={WARN}>the detail is gone</Label>

      <Label x={215} y={12} bold>Window function</Label>
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect x={215} y={22 + i * 14} width={70} height={10} rx={1.5} fill={FILL} stroke={LINE} />
          <rect x={290} y={22 + i * 14} width={60} height={10} rx={1.5} fill={BRAND} opacity={0.9} />
        </g>
      ))}
      <Label x={215} y={104} size={9} colour={BRAND}>every row, plus the aggregate</Label>
    </Figure>
  );
}

function RankFunctions() {
  const rows = [
    { v: 100, rank: 1, dense: 1, rn: 1 },
    { v: 90, rank: 2, dense: 2, rn: 2 },
    { v: 90, rank: 2, dense: 2, rn: 3 },
    { v: 80, rank: 4, dense: 3, rn: 4 },
  ];
  return (
    <Figure
      label="With a tie, RANK skips a number, DENSE_RANK does not, and ROW_NUMBER gives every row a distinct value."
      caption="Choosing the wrong one changes the answer whenever there is a tie. Top-three by RANK can return four rows; by ROW_NUMBER it silently drops one of the tied rows."
      viewBox="0 0 380 130"
    >
      {["value", "RANK", "DENSE_RANK", "ROW_NUMBER"].map((h, i) => (
        <Label key={h} x={i === 0 ? 10 : 60 + i * 95} y={14} anchor={i === 0 ? "start" : "middle"} size={9} bold>
          {h}
        </Label>
      ))}
      {rows.map((r, i) => {
        const y = 26 + i * 24;
        const tie = r.v === 90;
        return (
          <g key={i}>
            <rect x={0} y={y} width={46} height={18} rx={2} fill={tie ? WARN : FILL} opacity={tie ? 0.75 : 1} stroke={LINE} />
            <Label x={23} y={y + 13} anchor="middle" size={9} colour={tie ? "#1a1204" : FAINT}>{r.v}</Label>
            {[r.rank, r.dense, r.rn].map((n, j) => (
              <g key={j}>
                <rect x={110 + j * 95} y={y} width={40} height={18} rx={2} fill={FILL} stroke={LINE} />
                <Label x={130 + j * 95} y={y + 13} anchor="middle" size={9} colour={BRAND}>{n}</Label>
              </g>
            ))}
          </g>
        );
      })}
      <Label x={155} y={122} anchor="middle" size={8} colour={WARN}>skips 3</Label>
      <Label x={345} y={122} anchor="middle" size={8} colour={WARN}>breaks the tie</Label>
    </Figure>
  );
}

function GapsAndIslands() {
  const days = [1, 2, 3, 7, 8];
  return (
    <Figure
      label="Subtracting a row number from a date gives the same value for every day in a consecutive run."
      caption="Consecutive days advance by one and so does the row number, so the difference is constant within a run and changes at every gap. Group on that difference and each group is one streak."
      viewBox="0 0 380 130"
    >
      {["day", "row_number", "day − rn"].map((h, i) => (
        <Label key={h} x={10 + i * 120} y={14} size={9} bold>{h}</Label>
      ))}
      {days.map((d, i) => {
        const y = 26 + i * 19;
        const grp = d - (i + 1);
        return (
          <g key={d}>
            <rect x={0} y={y} width={60} height={15} rx={2} fill={FILL} stroke={LINE} />
            <Label x={30} y={y + 11} anchor="middle" size={8}>May {d}</Label>
            <rect x={120} y={y} width={40} height={15} rx={2} fill={FILL} stroke={LINE} />
            <Label x={140} y={y + 11} anchor="middle" size={8}>{i + 1}</Label>
            <rect x={240} y={y} width={40} height={15} rx={2} fill={grp === 0 ? BRAND : WARN} opacity={0.85} />
            <Label x={260} y={y + 11} anchor="middle" size={8} colour={grp === 0 ? "#04110f" : "#1a1204"} bold>{grp}</Label>
          </g>
        );
      })}
      <Label x={290} y={45} size={8} colour={BRAND}>run of 3</Label>
      <Label x={290} y={102} size={8} colour={WARN}>run of 2</Label>
    </Figure>
  );
}

function Funnel() {
  const steps = [
    { l: "visit", n: 1000, w: 340 },
    { l: "signup", n: 420, w: 143 },
    { l: "purchase", n: 168, w: 57 },
  ];
  return (
    <Figure
      label="Each funnel step is smaller than the last; the drop between two steps is where the work is."
      caption="The number that matters is the ratio between two adjacent steps, not the counts. Which denominator you use — the step above, or the top — tells a different story, so the prompt has to say which."
      viewBox="0 0 380 130"
    >
      {steps.map((s, i) => (
        <g key={s.l}>
          <rect x={(360 - s.w) / 2} y={12 + i * 38} width={s.w} height={26} rx={3} fill={BRAND} opacity={0.9 - i * 0.2} />
          <Label x={180} y={29 + i * 38} anchor="middle" size={10} colour="#04110f" bold>
            {s.l} · {s.n}
          </Label>
          {i > 0 ? (
            <Label x={370} y={29 + i * 38} anchor="end" size={9} colour={WARN}>
              {Math.round((s.n / steps[i - 1].n) * 100)}%
            </Label>
          ) : null}
        </g>
      ))}
      <Label x={0} y={124} size={9} colour={FAINT}>step-to-step conversion, not share of the top</Label>
    </Figure>
  );
}

function Cohorts() {
  return (
    <Figure
      label="A cohort grid: each row is a signup month and each column is how many came back N months later."
      caption="Reading down a column compares cohorts at the same age, which is the comparison that means something. Reading across a row shows one cohort decaying."
      viewBox="0 0 380 130"
    >
      {["M0", "M1", "M2", "M3"].map((m, i) => (
        <Label key={m} x={96 + i * 62} y={14} anchor="middle" size={9} bold>{m}</Label>
      ))}
      {[
        { c: "Jan", v: [100, 62, 48, 41] },
        { c: "Feb", v: [100, 58, 44, 0] },
        { c: "Mar", v: [100, 71, 0, 0] },
        { c: "Apr", v: [100, 0, 0, 0] },
      ].map((row, r) => (
        <g key={row.c}>
          <Label x={0} y={38 + r * 24} size={9}>{row.c}</Label>
          {row.v.map((v, c) => (
            <g key={c}>
              <rect
                x={70 + c * 62}
                y={26 + r * 24}
                width={52}
                height={17}
                rx={2}
                fill={v ? BRAND : "transparent"}
                opacity={v ? v / 130 : 1}
                stroke={v ? "none" : LINE}
                strokeDasharray={v ? undefined : "3 3"}
              />
              {v ? (
                <Label x={96 + c * 62} y={38 + r * 24} anchor="middle" size={8} colour="#04110f" bold>
                  {v}%
                </Label>
              ) : null}
            </g>
          ))}
        </g>
      ))}
      <Label x={0} y={124} size={9} colour={FAINT}>the empty corner is future, not zero</Label>
    </Figure>
  );
}

function Sessionise() {
  const events = [4, 22, 40, 150, 168, 300];
  return (
    <Figure
      label="Events closer together than the gap belong to one session; a longer gap starts a new one."
      caption="The gap is measured between consecutive events, not from the start of the session. A user clicking every twenty minutes for six hours is in one long session, not eighteen."
      viewBox="0 0 380 110"
    >
      <line x1={0} y1={54} x2={360} y2={54} stroke={LINE} />
      {events.map((x, i) => (
        <circle key={i} cx={x} cy={54} r={5} fill={BRAND} />
      ))}
      <rect x={-4} y={38} width={56} height={32} rx={4} fill={BRAND} opacity={0.15} stroke={BRAND} strokeDasharray="3 3" />
      <rect x={142} y={38} width={34} height={32} rx={4} fill={BRAND} opacity={0.15} stroke={BRAND} strokeDasharray="3 3" />
      <rect x={292} y={38} width={16} height={32} rx={4} fill={BRAND} opacity={0.15} stroke={BRAND} strokeDasharray="3 3" />
      <Label x={24} y={86} anchor="middle" size={8} colour={BRAND}>session 1</Label>
      <Label x={159} y={86} anchor="middle" size={8} colour={BRAND}>session 2</Label>
      <Label x={300} y={86} anchor="middle" size={8} colour={BRAND}>session 3</Label>
      <Label x={95} y={32} anchor="middle" size={8} colour={WARN}>gap &gt; 30 min</Label>
      <Label x={230} y={32} anchor="middle" size={8} colour={WARN}>gap &gt; 30 min</Label>
    </Figure>
  );
}


function NullLogic() {
  const rows = [
    { e: "status = 'x'", r: "true / false", keep: true },
    { e: "NULL = 'x'", r: "NULL", keep: false },
    { e: "NULL != 'x'", r: "NULL", keep: false },
    { e: "NULL IS NULL", r: "true", keep: true },
  ];
  return (
    <Figure
      label="Comparing NULL to anything returns NULL, and a WHERE clause keeps only rows that are true, so those rows disappear."
      caption="Nothing errors. The rows are simply absent, and the count comes out short — which is why a filter written as != silently drops every row where the value was never recorded."
      viewBox="0 0 380 125"
    >
      {rows.map((r, i) => (
        <g key={i}>
          <rect x={0} y={16 + i * 24} width={150} height={18} rx={2} fill={FILL} stroke={LINE} />
          <Label x={8} y={29 + i * 24} size={9}>{r.e}</Label>
          <Label x={165} y={29 + i * 24} size={9} colour={FAINT}>→</Label>
          <rect x={185} y={16 + i * 24} width={92} height={18} rx={2} fill={r.keep ? BRAND : WARN} opacity={0.85} />
          <Label x={231} y={29 + i * 24} anchor="middle" size={9} colour={r.keep ? "#04110f" : "#1a1204"} bold>
            {r.r}
          </Label>
          <Label x={290} y={29 + i * 24} size={8} colour={r.keep ? BRAND : WARN}>
            {r.keep ? "row kept" : "row dropped"}
          </Label>
        </g>
      ))}
    </Figure>
  );
}

function BridgeTable() {
  return (
    <Figure
      label="A bridge table sits between two entities that relate many-to-many, holding one row per pair."
      caption="It resolves the relationship and it introduces a fan-out: summing a measure from either side through the bridge counts it once per pair, so the total comes out high."
      viewBox="0 0 380 120"
    >
      <rect x={0} y={44} width={86} height={30} rx={4} fill={FILL} stroke={LINE} />
      <Label x={43} y={63} anchor="middle" size={9}>visit</Label>
      <rect x={140} y={44} width={100} height={30} rx={4} fill={BRAND} opacity={0.9} />
      <Label x={190} y={58} anchor="middle" size={8} colour="#04110f" bold>bridge</Label>
      <Label x={190} y={69} anchor="middle" size={7} colour="#04110f">one row per pair</Label>
      <rect x={294} y={44} width={86} height={30} rx={4} fill={FILL} stroke={LINE} />
      <Label x={337} y={63} anchor="middle" size={9}>diagnosis</Label>

      <path d="M86 59 L140 59" stroke={LINE} />
      <path d="M240 59 L294 59" stroke={LINE} />
      <Label x={113} y={53} anchor="middle" size={8} colour={FAINT}>1 → n</Label>
      <Label x={267} y={53} anchor="middle" size={8} colour={FAINT}>n ← 1</Label>

      <Label x={0} y={100} size={9} colour={WARN}>cost summed through the bridge is counted once per diagnosis</Label>
      <Label x={0} y={113} size={9} colour={FAINT}>aggregate first, or allocate — and say which</Label>
    </Figure>
  );
}

function NarrowVsWide() {
  return (
    <Figure
      label="A narrow transformation keeps each partition independent; a wide one moves data between partitions."
      caption="Narrow work happens where the data already is. Wide work needs a shuffle, which is the network boundary and almost always the expensive step — which is why counting shuffles predicts cost better than counting lines."
      viewBox="0 0 380 125"
    >
      <Label x={0} y={12} bold>Narrow — filter, map</Label>
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x={i * 52} y={24} width={40} height={20} rx={3} fill={FILL} stroke={LINE} />
          <path d={`M${i * 52 + 20} 46 L${i * 52 + 20} 66`} stroke={BRAND} />
          <rect x={i * 52} y={68} width={40} height={20} rx={3} fill={BRAND} opacity={0.85} />
        </g>
      ))}
      <Label x={0} y={108} size={9} colour={BRAND}>no data crosses</Label>

      <Label x={215} y={12} bold>Wide — join, groupBy</Label>
      {[0, 1, 2].map((i) => (
        <rect key={`t${i}`} x={215 + i * 52} y={24} width={40} height={20} rx={3} fill={FILL} stroke={LINE} />
      ))}
      {[0, 1, 2].map((i) =>
        [0, 1, 2].map((j) => (
          <path key={`${i}${j}`} d={`M${235 + i * 52} 46 L${235 + j * 52} 66`} stroke={WARN} opacity={0.4} />
        )),
      )}
      {[0, 1, 2].map((i) => (
        <rect key={`b${i}`} x={215 + i * 52} y={68} width={40} height={20} rx={3} fill={WARN} opacity={0.85} />
      ))}
      <Label x={215} y={108} size={9} colour={WARN}>a shuffle: everything crosses</Label>
    </Figure>
  );
}

function LambdaKappa() {
  return (
    <Figure
      label="Lambda runs a batch path and a streaming path side by side; Kappa runs one streaming path and replays it."
      caption="Lambda buys correctness from the batch layer and pays in two implementations of the same logic that must agree. Kappa buys one implementation and pays in having no separate source of truth to reconcile against."
      viewBox="0 0 380 130"
    >
      <Label x={0} y={12} bold>Lambda</Label>
      <rect x={0} y={22} width={40} height={50} rx={4} fill={FILL} stroke={LINE} />
      <Label x={20} y={51} anchor="middle" size={8}>source</Label>
      <path d="M40 34 L72 34" stroke={LINE} />
      <path d="M40 60 L72 60" stroke={LINE} />
      <rect x={72} y={22} width={58} height={24} rx={3} fill={WARN} opacity={0.85} />
      <Label x={101} y={38} anchor="middle" size={8} colour="#1a1204" bold>speed</Label>
      <rect x={72} y={50} width={58} height={24} rx={3} fill={BRAND} opacity={0.85} />
      <Label x={101} y={66} anchor="middle" size={8} colour="#04110f" bold>batch</Label>
      <path d="M130 34 C 146 34, 146 48, 158 48" stroke={LINE} fill="none" />
      <path d="M130 62 C 146 62, 146 48, 158 48" stroke={LINE} fill="none" />
      <rect x={158} y={36} width={34} height={24} rx={3} fill={FILL} stroke={LINE} />
      <Label x={175} y={52} anchor="middle" size={8}>serve</Label>
      <Label x={0} y={104} size={9} colour={WARN}>two implementations to keep in agreement</Label>

      <Label x={230} y={12} bold>Kappa</Label>
      <rect x={230} y={36} width={38} height={24} rx={4} fill={FILL} stroke={LINE} />
      <Label x={249} y={52} anchor="middle" size={8}>log</Label>
      <path d="M268 48 L292 48" stroke={LINE} />
      <rect x={292} y={36} width={44} height={24} rx={3} fill={BRAND} opacity={0.85} />
      <Label x={314} y={52} anchor="middle" size={8} colour="#04110f" bold>stream</Label>
      <path d="M336 48 L358 48" stroke={LINE} />
      <rect x={358} y={36} width={20} height={24} rx={3} fill={FILL} stroke={LINE} />
      <path d="M314 62 C 314 84, 249 84, 249 64" stroke={FAINT} strokeDasharray="3 3" fill="none" />
      <Label x={282} y={96} anchor="middle" size={8} colour={FAINT}>replay to correct</Label>
      <Label x={230} y={118} size={9} colour={BRAND}>one implementation</Label>
    </Figure>
  );
}

function Freshness() {
  const tables = [
    { n: "orders", h: 2 },
    { n: "customers", h: 2 },
    { n: "events", h: 96 },
    { n: "refunds", h: 3 },
  ];
  return (
    <Figure
      label="One table has not loaded for days while every job reports success."
      caption="Nothing failed. The job simply never ran, so there is no error anywhere — which is why freshness is the check people add last and need first."
      viewBox="0 0 380 120"
    >
      {tables.map((t, i) => (
        <g key={t.n}>
          <Label x={0} y={30 + i * 24} size={9}>{t.n}</Label>
          <rect x={78} y={19 + i * 24} width={260} height={15} rx={2} fill={FILL} stroke={LINE} />
          <rect
            x={78}
            y={19 + i * 24}
            width={Math.min(t.h * 2.6, 260)}
            height={15}
            rx={2}
            fill={t.h > 24 ? WARN : BRAND}
            opacity={0.85}
          />
          <Label x={346} y={30 + i * 24} size={8} colour={t.h > 24 ? WARN : FAINT}>
            {t.h}h
          </Label>
        </g>
      ))}
      <line x1={140} y1={12} x2={140} y2={116} stroke={WARN} strokeDasharray="4 3" />
      <Label x={146} y={112} size={8} colour={WARN}>24h threshold</Label>
    </Figure>
  );
}

function Masking() {
  return (
    <Figure
      label="Row-level security hides rows a viewer may not see; column-level security hides fields within the rows they may."
      caption="They answer different questions. Row-level decides which records exist for you; column-level decides how much of a record you can read. Most real policies need both."
      viewBox="0 0 380 120"
    >
      {["region", "customer", "email", "amount"].map((h, i) => (
        <Label key={h} x={8 + i * 92} y={14} size={8} bold>{h}</Label>
      ))}
      {[
        { r: "NG", hidden: false },
        { r: "NG", hidden: false },
        { r: "PT", hidden: true },
        { r: "SG", hidden: true },
      ].map((row, i) => (
        <g key={i} opacity={row.hidden ? 0.25 : 1}>
          {[0, 1, 2, 3].map((c) => (
            <g key={c}>
              <rect
                x={c * 92}
                y={22 + i * 22}
                width={84}
                height={17}
                rx={2}
                fill={c === 2 && !row.hidden ? WARN : FILL}
                opacity={c === 2 && !row.hidden ? 0.75 : 1}
                stroke={LINE}
              />
              {c === 2 && !row.hidden ? (
                <Label x={42 + c * 92} y={34 + i * 22} anchor="middle" size={8} colour="#1a1204" bold>
                  ••••••
                </Label>
              ) : null}
            </g>
          ))}
          {row.hidden ? (
            <Label x={344} y={34 + i * 22} anchor="end" size={8} colour={FAINT}>hidden</Label>
          ) : null}
        </g>
      ))}
      <Label x={0} y={112} size={9} colour={FAINT}>rows filtered by region · the email column masked</Label>
    </Figure>
  );
}

function BackfillBatches() {
  return (
    <Figure
      label="A long backfill is split into small batches with a limit on how many run at once."
      caption="Two years as one statement competes with tonight's production run and cannot be stopped halfway. Batched by date with a concurrency cap, it can be paused, resumed and reasoned about."
      viewBox="0 0 380 110"
    >
      <rect x={0} y={16} width={360} height={18} rx={3} fill={WARN} opacity={0.75} />
      <Label x={180} y={29} anchor="middle" size={9} colour="#1a1204" bold>one statement, 730 days</Label>
      <Label x={0} y={48} size={9} colour={WARN}>competes with production, cannot be paused</Label>

      {Array.from({ length: 12 }).map((_, i) => (
        <rect
          key={i}
          x={i * 30}
          y={62}
          width={26}
          height={18}
          rx={3}
          fill={i < 3 ? BRAND : FILL}
          opacity={i < 3 ? 0.9 : 1}
          stroke={i < 3 ? "none" : LINE}
        />
      ))}
      <Label x={0} y={98} size={9} colour={BRAND}>batched by date, three in flight, resumable</Label>
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
  idempotency: Idempotency,
  "incremental-vs-full": IncrementalVsFull,
  "cdc-vs-polling": CdcVsPolling,
  "dead-letter": DeadLetter,
  "dag-order": DagOrder,
  "retry-backoff": RetryBackoff,
  "join-types": JoinTypes,
  "window-vs-groupby": WindowVsGroupBy,
  "rank-functions": RankFunctions,
  "gaps-and-islands": GapsAndIslands,
  funnel: Funnel,
  cohorts: Cohorts,
  sessionise: Sessionise,
  "null-logic": NullLogic,
  "bridge-table": BridgeTable,
  "narrow-vs-wide": NarrowVsWide,
  "lambda-kappa": LambdaKappa,
  freshness: Freshness,
  masking: Masking,
  "backfill-batches": BackfillBatches,
} as const;

export type DiagramKey = keyof typeof DIAGRAMS;

export function Diagram({ name }: { name: DiagramKey }) {
  const Component = DIAGRAMS[name];
  return Component ? <Component /> : null;
}
