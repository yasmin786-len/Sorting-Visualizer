import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Sun, Play, Pause, RotateCcw, Shuffle, ChevronDown, ArrowRight, BarChart3, Clock3, Repeat2, Layers3 } from "lucide-react";
import { motion } from "framer-motion";
import "./index.css";

const META = {
  Bubble: { desc: "Repeatedly compares adjacent values and swaps them when out of order.", best: "O(n)", avg: "O(n²)", worst: "O(n²)", space: "O(1)", stable: "Yes", category: "Comparison" },
  Selection: { desc: "Selects the smallest remaining value and places it at the next position.", best: "O(n²)", avg: "O(n²)", worst: "O(n²)", space: "O(1)", stable: "No", category: "Comparison" },
  Insertion: { desc: "Builds a sorted prefix by inserting each new value into its correct position.", best: "O(n)", avg: "O(n²)", worst: "O(n²)", space: "O(1)", stable: "Yes", category: "Comparison" },
  Merge: { desc: "Splits the array recursively, then merges sorted halves.", best: "O(n log n)", avg: "O(n log n)", worst: "O(n log n)", space: "O(n)", stable: "Yes", category: "Divide & Conquer" },
  Quick: { desc: "Partitions values around a pivot and recursively sorts the partitions.", best: "O(n log n)", avg: "O(n log n)", worst: "O(n²)", space: "O(log n)", stable: "No", category: "Divide & Conquer" },
  Heap: { desc: "Builds a max heap and repeatedly moves the maximum to the end.", best: "O(n log n)", avg: "O(n log n)", worst: "O(n log n)", space: "O(1)", stable: "No", category: "Comparison" },
  Counting: { desc: "Counts occurrences of each value, then reconstructs the sorted array.", best: "O(n+k)", avg: "O(n+k)", worst: "O(n+k)", space: "O(n+k)", stable: "Yes", category: "Non-comparison" },
  Bucket: { desc: "Distributes values into buckets, sorts each bucket, and combines them.", best: "O(n+k)", avg: "O(n+k)", worst: "O(n²)", space: "O(n+k)", stable: "Yes", category: "Non-comparison" }
};

const ALGORITHMS = Object.keys(META);

function randomArray(n) {
  return Array.from({ length: n }, () => Math.floor(Math.random() * 95) + 5);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function buildOperations(input, type) {
  const a = input.slice();
  const ops = [];
  const compare = (i, j) => ops.push({ type: "compare", i, j });
  const swap = (i, j) => {
    ops.push({ type: "swap", i, j });
    [a[i], a[j]] = [a[j], a[i]];
  };
  const sorted = (i) => ops.push({ type: "sorted", i });

  if (type === "Bubble") {
    for (let end = a.length - 1; end > 0; end--) {
      for (let i = 0; i < end; i++) {
        compare(i, i + 1);
        if (a[i] > a[i + 1]) swap(i, i + 1);
      }
      sorted(end);
    }
    if (a.length) sorted(0);
  }

  if (type === "Selection") {
    for (let i = 0; i < a.length; i++) {
      let min = i;
      for (let j = i + 1; j < a.length; j++) {
        compare(min, j);
        if (a[j] < a[min]) min = j;
      }
      if (min !== i) swap(i, min);
      sorted(i);
    }
  }

  if (type === "Insertion") {
    for (let i = 1; i < a.length; i++) {
      let j = i;
      while (j > 0) {
        compare(j - 1, j);
        if (a[j - 1] <= a[j]) break;
        swap(j - 1, j);
        j--;
      }
    }
    for (let i = 0; i < a.length; i++) sorted(i);
  }

  if (type === "Quick") {
    const quick = (left, right) => {
      if (left > right) return;
      if (left === right) {
        sorted(left);
        return;
      }
      const pivot = a[right];
      ops.push({ type: "pivot", i: right });
      let store = left;
      for (let j = left; j < right; j++) {
        compare(j, right);
        if (a[j] < pivot) {
          if (store !== j) swap(store, j);
          store++;
        }
      }
      if (store !== right) swap(store, right);
      sorted(store);
      quick(left, store - 1);
      quick(store + 1, right);
    };
    quick(0, a.length - 1);
  }

  if (type === "Merge") {
    const temp = Array(a.length);
    const mergeSort = (left, right) => {
      if (left >= right) {
        if (left === right) sorted(left);
        return;
      }
      const mid = Math.floor((left + right) / 2);
      mergeSort(left, mid);
      mergeSort(mid + 1, right);
      let i = left, j = mid + 1, k = left;
      while (i <= mid && j <= right) {
        compare(i, j);
        temp[k++] = a[i] <= a[j] ? a[i++] : a[j++];
      }
      while (i <= mid) temp[k++] = a[i++];
      while (j <= right) temp[k++] = a[j++];
      for (let x = left; x <= right; x++) {
        a[x] = temp[x];
        ops.push({ type: "write", i: x, value: a[x] });
      }
    };
    mergeSort(0, a.length - 1);
  }

  if (type === "Heap") {
    const heapify = (n, i) => {
      let largest = i;
      const left = 2 * i + 1;
      const right = left + 1;
      if (left < n) {
        compare(left, largest);
        if (a[left] > a[largest]) largest = left;
      }
      if (right < n) {
        compare(right, largest);
        if (a[right] > a[largest]) largest = right;
      }
      if (largest !== i) {
        swap(i, largest);
        heapify(n, largest);
      }
    };
    for (let i = Math.floor(a.length / 2) - 1; i >= 0; i--) heapify(a.length, i);
    for (let end = a.length - 1; end > 0; end--) {
      swap(0, end);
      sorted(end);
      heapify(end, 0);
    }
    if (a.length) sorted(0);
  }

  if (type === "Counting") {
    if (a.length) {
      const min = Math.min(...a);
      const max = Math.max(...a);
      const counts = Array(max - min + 1).fill(0);
      for (const value of a) {
        counts[value - min]++;
        ops.push({ type: "count", value: value - min });
      }
      let index = 0;
      for (let value = 0; value < counts.length; value++) {
        for (let c = 0; c < counts[value]; c++) {
          a[index] = value + min;
          ops.push({ type: "write", i: index, value: a[index] });
          sorted(index);
          index++;
        }
      }
    }
  }

  if (type === "Bucket") {
    if (a.length) {
      const min = Math.min(...a);
      const max = Math.max(...a);
      const bucketCount = Math.max(3, Math.ceil(Math.sqrt(a.length)));
      const bucketSize = (max - min + 1) / bucketCount;
      const buckets = Array.from({ length: bucketCount }, () => []);

      a.forEach((value, index) => {
        const bucket = Math.min(
          bucketCount - 1,
          Math.floor((value - min) / bucketSize)
        );
        buckets[bucket].push(value);
        ops.push({ type: "bucket", index, bucket, value });
      });

      let writeIndex = 0;
      for (const bucket of buckets) {
        bucket.sort((x, y) => x - y);
        for (const value of bucket) {
          a[writeIndex] = value;
          ops.push({ type: "write", i: writeIndex, value });
          sorted(writeIndex);
          writeIndex++;
        }
      }
    }
  }

  return ops;
}

function App() {
  const [array, setArray] = useState(() => randomArray(48));
  const [size, setSize] = useState(48);
  const [algorithm, setAlgorithm] = useState("Quick");
  const [speed, setSpeed] = useState(5);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [step, setStep] = useState(0);
  const [comparisons, setComparisons] = useState(0);
  const [swaps, setSwaps] = useState(0);
  const [active, setActive] = useState([]);
  const [sorted, setSorted] = useState(new Set());
  const [special, setSpecial] = useState({});
  const [done, setDone] = useState(false);
  const cancelRef = useRef(false);
  const pauseRef = useRef(false);

  const reset = () => {
    cancelRef.current = true;
    pauseRef.current = false;
    setRunning(false);
    setPaused(false);
    setStep(0);
    setComparisons(0);
    setSwaps(0);
    setActive([]);
    setSorted(new Set());
    setSpecial({});
    setDone(false);
  };

  const generate = () => {
    reset();
    cancelRef.current = false;
    setArray(randomArray(size));
  };

  const start = async () => {
    if (running) {
      pauseRef.current = false;
      setPaused(false);
      return;
    }

    reset();
    cancelRef.current = false;
    pauseRef.current = false;

    const operations = buildOperations(array, algorithm);
    let values = array.slice();
    let cmp = 0;
    let sw = 0;
    const completed = new Set();

    setRunning(true);

    for (let index = 0; index < operations.length; index++) {
      while (pauseRef.current && !cancelRef.current) await sleep(40);
      if (cancelRef.current) return;

      const op = operations[index];

      if (op.type === "compare") {
        setActive([op.i, op.j]);
        cmp++;
      } else if (op.type === "swap") {
        [values[op.i], values[op.j]] = [values[op.j], values[op.i]];
        setActive([op.i, op.j]);
        sw++;
      } else if (op.type === "write") {
        values[op.i] = op.value;
        setActive([op.i]);
      } else if (op.type === "sorted") {
        completed.add(op.i);
        setSorted(new Set(completed));
        setActive([op.i]);
      } else if (op.type === "pivot") {
        setSpecial({ pivot: op.i });
      } else if (op.type === "count") {
        setSpecial((previous) => ({ ...previous, count: (previous.count || 0) + 1 }));
      } else if (op.type === "bucket") {
        setSpecial({ bucket: op.bucket, bucketValue: op.value });
      }

      setArray(values.slice());
setComparisons(cmp);
setSwaps(sw);
setStep(index + 1);

await sleep(Math.max(80, 1100 - speed * 100));
    }

    if (!cancelRef.current) {
      setRunning(false);
      setPaused(false);
      setDone(true);
      setActive([]);
      setSpecial({});
    }
  };

  useEffect(() => () => { cancelRef.current = true; }, []);

  const max = Math.max(...array, 1);
  const info = META[algorithm];

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#050507] text-white">
      <div
        className="pointer-events-none fixed inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(circle at 15% 10%,rgba(99,102,241,.18),transparent 30%),radial-gradient(circle at 85% 20%,rgba(34,211,238,.12),transparent 28%)"
        }}
      />

      <nav className="sticky top-0 z-50 border-b border-white/10 bg-black/50 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <a href="#" className="flex items-center gap-3 text-xl font-bold">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 shadow-lg shadow-indigo-500/20">S</span>
            Sortify
          </a>
          <div className="hidden gap-7 text-sm text-white/65 md:flex">
            <a href="#visualizer" className="hover:text-white">Visualizer</a>
            <a href="#algorithms" className="hover:text-white">Algorithms</a>
            <a href="#compare" className="hover:text-white">Compare</a>
          </div>
          <div className="flex gap-2">
            <a href="https://github.com" target="_blank" rel="noreferrer" className="rounded-lg p-2 hover:bg-white/10"><span className="text-sm font-bold">GH</span></a>

          </div>
        </div>
      </nav>

      <main className="relative mx-auto max-w-7xl px-5">
        <section className="grid min-h-[68vh] items-center gap-12 py-20 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="mb-5 text-xs font-semibold uppercase tracking-[.25em] text-cyan-300">Interactive DSA Learning</div>
            <h1 className="text-5xl font-black leading-[.95] tracking-tight md:text-7xl">
              See algorithms<br />
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-300 bg-clip-text text-transparent">come to life.</span>
            </h1>
            <p className="mt-7 max-w-xl text-lg text-white/55">
              Explore how sorting algorithms compare, swap, count, divide, and transform data through beautiful real-time visualizations.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#visualizer" className="flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-black transition hover:scale-[1.02]">
                Start visualizing <ArrowRight size={18} />
              </a>
              <a href="#algorithms" className="rounded-xl border border-white/15 bg-white/5 px-5 py-3">Explore algorithms</a>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: .95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .8 }}
            className="rounded-3xl border border-white/10 bg-white/[.035] p-6 shadow-2xl shadow-indigo-950/30">
            <div className="mb-8 flex items-center justify-between">
              <div><div className="font-semibold">Quick Sort</div><div className="mt-1 text-xs text-white/40">Live preview</div></div>
              <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_18px_#34d399]" />
            </div>
            <div className="flex h-64 items-end justify-center gap-2">
              {[34,74,48,91,57,29,82,42,68,22,77,51].map((value, i) => (
                <motion.div key={i} animate={{ height: `${value}%` }} transition={{ duration: .6, repeat: Infinity, repeatType: "reverse", delay: i * .05 }}
                  className="w-4 rounded-t-lg bg-gradient-to-t from-indigo-600 to-cyan-300 sm:w-6" />
              ))}
            </div>
          </motion.div>
        </section>

        <section id="visualizer" className="scroll-mt-24 py-8">
          <div className="mb-6 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div><div className="text-sm font-semibold text-indigo-300">LIVE PLAYGROUND</div><h2 className="mt-2 text-3xl font-bold md:text-4xl">Sorting Visualizer</h2></div>
            <div className="text-sm text-white/45">{done ? "✓ Sorting completed" : running ? (paused ? "Ⅱ Paused" : "● Sorting") : "● Ready"}</div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[.035] p-5 shadow-2xl md:p-7">
            <div className="mb-7 grid gap-5 xl:grid-cols-[1fr_auto]">
              <div className="flex flex-wrap gap-3">
                <label className="min-w-44">
                  <span className="mb-2 block text-xs text-white/45">Algorithm</span>
                  <div className="relative">
                    <select value={algorithm} disabled={running} onChange={(e) => { reset(); setAlgorithm(e.target.value); }}
                      className="w-full appearance-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 pr-10 outline-none focus:border-indigo-400">
                      {ALGORITHMS.map((name) => <option key={name}>{name}</option>)}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-3.5" size={17} />
                  </div>
                </label>

                <label className="w-48">
                  <span className="mb-2 flex justify-between text-xs text-white/45">Array size <b className="text-white/70">{size}</b></span>
                  <input className="w-full accent-indigo-500" type="range" min="8" max="90" value={size}
                    onChange={(e) => { const value = Number(e.target.value); setSize(value); reset(); setArray(randomArray(value)); }} />
                </label>

                <label className="w-48">
                  <span className="mb-2 flex justify-between text-xs text-white/45">Speed <b className="text-white/70">{speed}</b></span>
                 <input
  className="w-full accent-cyan-400"
  type="range"
  min="1"
  max="10"
  value={speed}
  onChange={(e) => setSpeed(Number(e.target.value))}
/>
                </label>
              </div>

              <div className="flex flex-wrap items-end gap-2">
                <button onClick={generate} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 hover:bg-white/10"><Shuffle size={17} />Generate</button>
                <button onClick={start} className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 font-semibold text-black hover:scale-[1.01]"><Play size={17} />{paused ? "Resume" : "Start"}</button>
                <button onClick={() => { pauseRef.current = true; setPaused(true); }} disabled={!running || paused} className="rounded-xl border border-white/10 px-4 py-3 disabled:opacity-30"><Pause size={17} /></button>
                <button onClick={reset} className="rounded-xl border border-white/10 px-4 py-3"><RotateCcw size={17} /></button>
              </div>
            </div>

            <div className="flex h-[390px] items-end gap-[2px] border-b border-white/5 px-1 pb-4 sm:gap-1">
              {array.map((value, i) => {
                const isSorted = sorted.has(i);
                const isActive = active.includes(i);
                const isPivot = special.pivot === i;
                return (
                  <motion.div
  layout
  key={i}
  animate={{
    height: `${Math.max(3, (value / max) * 100)}%`,
    scale: isActive ? 1.04 : 1
  }}
  transition={{ duration: 0.08 }}
  className={
    "relative min-w-0 flex-1 rounded-t-md " +
    (isSorted
      ? "bg-emerald-400"
      : isActive
      ? "bg-amber-300"
      : isPivot
      ? "bg-fuchsia-400"
      : "bg-gradient-to-t from-indigo-600 to-cyan-300")
  }
>
  <span
    className={
      "absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold " +
      (isActive || isSorted ? "text-white" : "text-white/70")
    }
  >
    {value}
  </span>
</motion.div>
                );
              })}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                [BarChart3, "Comparisons", comparisons],
                [Repeat2, "Swaps", swaps],
                [Layers3, "Steps", step],
                [Clock3, "Status", done ? "Done" : running ? "Sorting" : "Ready"]
              ].map(([Icon, label, value]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <Icon size={17} className="text-indigo-300" />
                  <div className="mt-3 text-xs text-white/40">{label}</div>
                  <div className="mt-1 text-lg font-bold">{value}</div>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_auto]">
              <div>
                <div className="text-sm font-semibold">How {algorithm} Sort works</div>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-white/45">{info.desc}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[["Best", info.best], ["Average", info.avg], ["Worst", info.worst], ["Space", info.space]].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                    <div className="text-[11px] text-white/35">{label}</div>
                    <div className="mt-1 text-sm font-semibold">{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {(algorithm === "Counting" || algorithm === "Bucket") && (
              <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-5">
                <div className="font-semibold">{algorithm === "Counting" ? "Counting Sort — frequency visualization" : "Bucket Sort — distribution visualization"}</div>
                <div className="mt-1 text-sm text-white/45">
                  {algorithm === "Counting"
                    ? "Values are counted before the sorted array is reconstructed."
                    : "Values are distributed into buckets, sorted, then combined."}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {algorithm === "Counting"
                    ? Array.from({ length: 10 }, (_, i) => (
                        <span key={i} className="rounded-lg border border-indigo-400/10 bg-indigo-500/15 px-3 py-2 text-sm">Count {i}</span>
                      ))
                    : Array.from({ length: Math.max(3, Math.ceil(Math.sqrt(size))) }, (_, i) => (
                        <span key={i} className={"rounded-lg border px-3 py-2 " + (special.bucket === i ? "border-cyan-300 bg-cyan-300/10" : "border-white/10 bg-white/5")}>Bucket {i}</span>
                      ))}
                </div>
              </div>
            )}
          </div>
        </section>

        <section id="algorithms" className="scroll-mt-20 py-24">
          <div className="mb-10">
            <div className="text-sm font-semibold text-cyan-300">LEARN BY WATCHING</div>
            <h2 className="mt-2 text-3xl font-bold md:text-4xl">Eight ways to sort.</h2>
            <p className="mt-3 max-w-2xl text-white/45">Every algorithm has a different strategy. Select one to load it into the visualizer.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ALGORITHMS.map((name, index) => (
              <motion.button key={name} whileHover={{ y: -5 }} whileTap={{ scale: .98 }}
                onClick={() => { reset(); setAlgorithm(name); document.getElementById("visualizer").scrollIntoView({ behavior: "smooth" }); }}
                className="rounded-2xl border border-white/10 bg-white/[.035] p-5 text-left transition hover:border-indigo-400/40">
                <div className="text-xs text-indigo-300">{String(index + 1).padStart(2, "0")}</div>
                <div className="mt-3 text-xl font-bold">{name} Sort</div>
                <p className="mt-2 min-h-16 text-sm text-white/45">{META[name].desc}</p>
                <div className="mt-4 text-xs text-white/60">{META[name].avg} · {META[name].category}</div>
              </motion.button>
            ))}
          </div>
        </section>

        <section id="compare" className="scroll-mt-20 py-16">
          <div className="mb-8">
            <div className="text-sm font-semibold text-indigo-300">AT A GLANCE</div>
            <h2 className="mt-2 text-3xl font-bold">Algorithm comparison</h2>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full min-w-[850px] text-sm">
              <thead className="bg-white/5 text-white/45">
                <tr>{["Algorithm", "Best", "Average", "Worst", "Space", "Stable", "Category"].map((heading) => <th key={heading} className="p-4 text-left">{heading}</th>)}</tr>
              </thead>
              <tbody>
                {ALGORITHMS.map((name) => (
                  <tr key={name} className="border-t border-white/5">
                    <td className="p-4 font-semibold">{name}</td>
                    <td className="p-4 text-white/60">{META[name].best}</td>
                    <td className="p-4 text-white/60">{META[name].avg}</td>
                    <td className="p-4 text-white/60">{META[name].worst}</td>
                    <td className="p-4 text-white/60">{META[name].space}</td>
                    <td className="p-4 text-white/60">{META[name].stable}</td>
                    <td className="p-4 text-white/60">{META[name].category}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <footer className="mt-20 border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 px-5 py-10 text-sm text-white/40 sm:flex-row">
          <div>© 2026 Sortify. Built for learning DSA.</div>
          <div>React · Tailwind CSS · Framer Motion</div>
        </div>
      </footer>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
