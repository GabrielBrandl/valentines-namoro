const url = process.argv[2] || "http://localhost:3000";
const times = [];
for (let i = 0; i < 12; i += 1) {
  const start = performance.now();
  const response = await fetch(url, { cache: "no-store" });
  times.push({ ms: Math.round(performance.now() - start), status: response.status });
}
const avg = Math.round(times.reduce((sum, item) => sum + item.ms, 0) / times.length);
console.log(JSON.stringify({ url, avg, times }));
