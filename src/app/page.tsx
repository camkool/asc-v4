export default function Home() {
  return (
    <main style={{padding:24, fontFamily:'system-ui'}}>
      <h1>Ascendancy V4 Starter</h1>
      <p>Welcome. Use the links below:</p>
      <ul>
        <li><a href="/login">Login</a></li>
        <li><a href="/planet">My Planet</a></li>
        <li><a href="/api/tick?secret=YOUR_TICK_SECRET">Run Tick (dev)</a></li>
      </ul>
      <p style={{marginTop:24, opacity:0.7}}>Replace YOUR_TICK_SECRET with your real secret in production.</p>
    </main>
  );
}
